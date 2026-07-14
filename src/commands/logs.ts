import chalk from 'chalk';
import { readConfig } from '../utils/config.js';
import { SshService } from '../services/SshService.js';
import { log } from '../utils/logger.js';

export async function logsCommand(): Promise<void> {
  const config = readConfig();
  const ssh = new SshService(config);
  log.info(`Streaming logs from ${chalk.bold(config.host)}...`);
  log.dim('  Press Ctrl+C to stop');
  log.blank();
  await ssh.streamLogs();
}
