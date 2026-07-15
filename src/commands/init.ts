import prompts from 'prompts';
import chalk from 'chalk';
import { writeConfig, configExists, getConfigPath } from '../utils/config.js';
import { DEFAULTS } from '../types/index.js';
import { log } from '../utils/logger.js';

export async function initCommand(): Promise<void> {
  if (configExists()) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: 'Config already exists. Overwrite?',
      initial: false,
    });
    if (!overwrite) {
      log.info('Aborted.');
      return;
    }
  }

  const { host } = await prompts({
    type: 'text',
    name: 'host',
    message: 'STB Host / IP address:',
    validate: (v: string) => v.trim().length > 0 || 'Host is required',
  });

  if (!host) {
    log.error('No host provided. Aborted.');
    process.exit(1);
  }

  const { password } = await prompts({
    type: 'password',
    name: 'password',
    message: 'STB Password (leave blank if empty):',
  });

  const config = { ...DEFAULTS, host: host.trim(), password: password ?? '' };
  writeConfig(config);

  log.blank();
  log.success(`Config saved to ${chalk.bold(getConfigPath())}`);
  log.dim(`  host:         ${config.host}`);
  log.dim(`  user:         ${config.user}`);
  log.dim(`  password:     ${config.password === '' ? '(empty)' : '***'}`);
  log.dim(`  port:         ${config.port}`);
  log.dim(`  buildCommand: ${config.buildCommand}`);
  log.dim(`  buildOutput:  ${config.buildOutput}`);
  log.dim(`  remotePath:   ${config.remotePath}`);
  log.dim(`  service:      ${config.service}`);
  log.blank();
  log.info(`Run ${chalk.cyan('stb deploy')} to start your first deployment.`);
}
