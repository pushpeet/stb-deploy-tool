import prompts from 'prompts';
import chalk from 'chalk';
import { readConfig, updateConfig } from '../utils/config.js';
import { log } from '../utils/logger.js';

export async function hostCommand(ip?: string): Promise<void> {
  const config = readConfig();

  if (ip) {
    updateConfig({ host: ip.trim() });
    log.success(`Host updated to ${chalk.bold(ip.trim())}`);
    return;
  }

  log.info(`Current host: ${chalk.bold(config.host)}`);
  log.blank();

  const { newHost } = await prompts({
    type: 'text',
    name: 'newHost',
    message: 'New host (leave blank to keep current):',
    initial: config.host,
  });

  if (!newHost || newHost.trim() === config.host) {
    log.dim('No changes made.');
    return;
  }

  updateConfig({ host: newHost.trim() });
  log.success(`Host updated to ${chalk.bold(newHost.trim())}`);
}
