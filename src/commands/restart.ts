import chalk from 'chalk';
import { readConfig } from '../utils/config.js';
import { SshService } from '../services/SshService.js';
import { spinner, printTimings } from '../utils/logger.js';

export async function restartCommand(): Promise<void> {
  const config = readConfig();
  const ssh = new SshService(config);
  const sp = spinner(`Restarting ${chalk.bold(config.service)} on ${chalk.bold(config.host)}...`).start();

  try {
    const elapsedMs = await ssh.restartService();
    sp.succeed(`${config.service} restarted`);
    printTimings('Restart', elapsedMs);
  } catch (err) {
    sp.fail(`Failed to restart ${config.service}`);
    throw err;
  }
}
