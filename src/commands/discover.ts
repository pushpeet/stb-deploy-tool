import chalk from "chalk";
import prompts from "prompts";
import {
  DiscoverService,
  getLocalSubnet,
} from "../services/DiscoverService.js";
import {
  updateConfig,
  configExists,
  writeConfig,
  readConfig,
} from "../utils/config.js";
import { DEFAULTS } from "../types/index.js";
import { log } from "../utils/logger.js";

const BAR_WIDTH = 30;

function renderBar(done: number, total: number): string {
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  const filled = Math.round(BAR_WIDTH * pct);
  const empty = BAR_WIDTH - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${Math.round(pct * 100)}%`;
}

export async function discoverCommand(): Promise<void> {
  log.blank();
  log.info("Detecting network...");
  log.blank();

  const net = getLocalSubnet();
  if (!net) {
    log.error(
      "Could not detect local network. Are you connected to Wi-Fi or LAN?",
    );
    process.exit(1);
  }

  // Use existing config credentials if available, otherwise use defaults
  const config = configExists() ? readConfig() : { ...DEFAULTS, host: "" };
  const service = new DiscoverService(config);

  let lastBar = "";

  const onStatus = (msg: string) => {
    process.stdout.write(`\r\x1b[K`);
    log.dim(`  ${msg}`);
  };

  const onProgress = (done: number, total: number) => {
    const bar = renderBar(done, total);
    if (bar !== lastBar) {
      process.stdout.write(`\r  ${bar}`);
      lastBar = bar;
    }
  };

  log.info("Scanning...");
  log.blank();

  const devices = await service.discover(onStatus, onProgress);

  // Clear progress bar line
  process.stdout.write(`\r\x1b[K`);
  log.blank();

  if (devices.length === 0) {
    log.error("No STBs were found on the local network.");
    log.blank();
    log.dim("  Please ensure:");
    log.dim("  • STB is powered on");
    log.dim("  • STB is connected to the same Wi-Fi/LAN");
    log.dim(`  • SSH is enabled on port ${config.port}`);
    log.blank();
    process.exit(1);
  }

  log.success(
    chalk.bold(`Found ${devices.length} STB${devices.length > 1 ? "s" : ""}`),
  );
  log.blank();

  // Display all found devices
  devices.forEach((device, i) => {
    const name =
      device.hostname && device.hostname !== device.ip
        ? device.hostname
        : chalk.dim("Unknown");
    console.log(`  ${chalk.bold(`${i + 1})`)} `);
    console.log(`     Name : ${chalk.cyan(name)}`);
    console.log(`     IP   : ${chalk.cyan(device.ip)}`);
    console.log(
      `     SSH  : ${device.verified ? chalk.green("Verified") : chalk.yellow("Unverified (port open)")}`,
    );
    log.blank();
  });

  let selectedIp: string;

  if (devices.length === 1) {
    // Single device — ask to confirm
    const { use } = await prompts({
      type: "confirm",
      name: "use",
      message: `Use ${chalk.bold(devices[0].ip)} as default STB?`,
      initial: true,
    });
    if (!use) {
      log.info("Aborted.");
      return;
    }
    selectedIp = devices[0].ip;
  } else {
    // Multiple devices — prompt selection
    const { index } = await prompts({
      type: "select",
      name: "index",
      message: "Select a device:",
      choices: devices.map((d, i) => ({
        title: `${d.ip}  ${chalk.dim(d.hostname && d.hostname !== d.ip ? d.hostname : "Unknown")}  ${d.verified ? chalk.green("✔ SSH") : chalk.yellow("⚠ unverified")}`,
        value: i,
      })),
    });
    if (index === undefined) {
      log.info("Aborted.");
      return;
    }
    selectedIp = devices[index].ip;
  }

  // Save to config
  if (configExists()) {
    updateConfig({ host: selectedIp });
  } else {
    writeConfig({ ...DEFAULTS, host: selectedIp });
  }

  log.blank();
  log.success(chalk.bold("Default STB saved."));
  log.blank();
  log.dim(`  Future deploy commands will use ${chalk.cyan(selectedIp)}`);
  log.blank();
}
