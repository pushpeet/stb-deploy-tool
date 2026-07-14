import chalk from 'chalk';
import { readConfig } from '../utils/config.js';
import { BuildService } from '../services/BuildService.js';
import { DeployService } from '../services/DeployService.js';
import { SshService } from '../services/SshService.js';
import { log, printTimings } from '../utils/logger.js';
import { DeployOptions, TimingResult } from '../types/index.js';

export async function deployCommand(options: DeployOptions = {}): Promise<void> {
  const config = readConfig();
  const build = new BuildService(config);
  const deploy = new DeployService(config);
  const ssh = new SshService(config);
  const totalStart = Date.now();
  const timings: TimingResult = { totalMs: 0 };

  log.blank();
  log.info(`Deploying to ${chalk.bold(config.host)}...`);
  log.blank();

  if (!options.skipBuild) {
    await build.clean();
    timings.buildMs = await build.build();
  }

  timings.uploadMs = await deploy.upload();

  if (!options.skipRestart) {
    const sp = (await import('ora')).default('Restarting service...').start();
    try {
      timings.restartMs = await ssh.restartService();
      sp.succeed('Service restarted');
    } catch (err) {
      sp.fail('Failed to restart service');
      throw err;
    }
  }

  timings.totalMs = Date.now() - totalStart;

  log.blank();
  log.success(chalk.bold('Deployment complete'));
  if (timings.buildMs !== undefined) printTimings('Build', timings.buildMs);
  if (timings.uploadMs !== undefined) printTimings('Upload', timings.uploadMs);
  if (timings.restartMs !== undefined) printTimings('Restart', timings.restartMs);
  printTimings('Total', timings.totalMs);
  log.blank();
}
