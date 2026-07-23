import * as fs from "fs-extra";
import execa from "execa";
import { StbConfig } from "../types/index.js";
import { spinner, log } from "../utils/logger.js";

export class BuildService {
  constructor(private readonly config: StbConfig) {}

  async clean(): Promise<void> {
    const sp = spinner("Cleaning dist folder...").start();
    try {
      await fs.remove(this.config.buildOutput);
      sp.succeed("Dist folder cleaned");
    } catch (err) {
      sp.fail("Failed to clean dist folder");
      throw err;
    }
  }

  async build(): Promise<number> {
    const [cmd, ...args] = this.config.buildCommand.split(" ");
    const sp = spinner(`Running ${this.config.buildCommand}...`).start();
    const start = Date.now();

    const buildEnv = {
      ...process.env,
      NODE_OPTIONS: [process.env.NODE_OPTIONS, "--max-old-space-size=8192"]
        .filter(Boolean)
        .join(" "),
    };

    try {
      await execa(cmd, args, { stdio: "pipe", env: buildEnv });
      const elapsed = Date.now() - start;
      sp.succeed(`Build complete`);
      return elapsed;
    } catch (err: unknown) {
      const execaErr = err as {
        stderr?: string;
        stdout?: string;
        message?: string;
      };
      const output = `${execaErr.stderr ?? ""} ${execaErr.stdout ?? ""} ${execaErr.message ?? ""}`;
      const isHeapError =
        output.includes("heap out of memory") ||
        output.includes("JavaScript heap") ||
        output.includes("Allocation failed") ||
        (err as { signal?: string }).signal === "SIGABRT";

      if (isHeapError) {
        sp.text = "Heap error detected — retrying with increased memory...";
        try {
          await execa(cmd, args, {
            stdio: "pipe",
            env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" },
          });
          const elapsed = Date.now() - start;
          sp.succeed("Build complete (with increased memory)");
          return elapsed;
        } catch (retryErr: unknown) {
          sp.fail("Build failed even with increased memory");
          const retryExecaErr = retryErr as {
            stderr?: string;
            stdout?: string;
          };
          if (retryExecaErr.stderr) log.error(retryExecaErr.stderr);
          if (retryExecaErr.stdout) log.dim(retryExecaErr.stdout);
          throw new Error("Build failed — aborting deployment");
        }
      }

      sp.fail("Build failed");
      if (execaErr.stderr) log.error(execaErr.stderr);
      if (execaErr.stdout) log.dim(execaErr.stdout);
      throw new Error("Build failed — aborting deployment");
    }
  }

  buildOutputExists(): boolean {
    return fs.existsSync(this.config.buildOutput);
  }
}
