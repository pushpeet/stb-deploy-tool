import chalk from 'chalk';
import { readConfig } from '../utils/config.js';
import { BuildService } from '../services/BuildService.js';
import { DeployService } from '../services/DeployService.js';
import { log, printTimings } from '../utils/logger.js';

export async function syncCommand(): Promise<void> {
  const config = readConfig();
  const build = new BuildService(config);
  const deploy = new DeployService(config);

  if (!build.buildOutputExists()) {
    log.error(`Build output not found at ${chalk.bold(config.buildOutput)}`);
    log.info(`Run ${chalk.cyan('stb deploy')} to build and deploy.`);
    process.exit(1);
  }

  log.blank();
  log.info(`Syncing to ${chalk.bold(config.host)}...`);
  log.blank();

  const start = Date.now();
  const uploadMs = await deploy.upload();
  const totalMs = Date.now() - start;

  log.blank();
  log.success(chalk.bold('Sync complete'));
  printTimings('Upload', uploadMs);
  printTimings('Total', totalMs);
  log.blank();
}
