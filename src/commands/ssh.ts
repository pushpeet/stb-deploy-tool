import chalk from 'chalk';
import { readConfig } from '../utils/config.js';
import { SshService } from '../services/SshService.js';
import { log } from '../utils/logger.js';

export function sshCommand(): void {
  const config = readConfig();
  const ssh = new SshService(config);
  log.info(`Connecting to ${chalk.bold(config.host)}...`);
  log.dim(`  ${ssh.buildSshCommand()}`);
  ssh.openShell();
}
