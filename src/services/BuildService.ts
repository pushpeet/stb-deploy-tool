import * as fs from 'fs-extra';
import execa from 'execa';
import { StbConfig } from '../types/index.js';
import { spinner, log } from '../utils/logger.js';

export class BuildService {
  constructor(private readonly config: StbConfig) {}

  async clean(): Promise<void> {
    const sp = spinner('Cleaning dist folder...').start();
    try {
      await fs.remove(this.config.buildOutput);
      sp.succeed('Dist folder cleaned');
    } catch (err) {
      sp.fail('Failed to clean dist folder');
      throw err;
    }
  }

  async build(): Promise<number> {
    const [cmd, ...args] = this.config.buildCommand.split(' ');
    const sp = spinner(`Running ${this.config.buildCommand}...`).start();
    const start = Date.now();

    try {
      await execa(cmd, args, { stdio: 'pipe' });
      const elapsed = Date.now() - start;
      sp.succeed(`Build complete`);
      return elapsed;
    } catch (err: unknown) {
      sp.fail('Build failed');
      const execaErr = err as { stderr?: string; stdout?: string };
      if (execaErr.stderr) log.error(execaErr.stderr);
      if (execaErr.stdout) log.dim(execaErr.stdout);
      throw new Error('Build failed — aborting deployment');
    }
  }

  buildOutputExists(): boolean {
    return fs.existsSync(this.config.buildOutput);
  }
}
