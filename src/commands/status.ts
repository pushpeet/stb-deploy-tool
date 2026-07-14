import chalk from 'chalk';
import * as fs from 'fs-extra';
import { readConfig } from '../utils/config.js';
import { SshService } from '../services/SshService.js';
import { spinner, log } from '../utils/logger.js';

export async function statusCommand(): Promise<void> {
  const config = readConfig();
  const ssh = new SshService(config);

  const sp = spinner('Checking SSH connectivity...').start();
  const connected = await ssh.isConnected();
  sp.stop();

  const tick = chalk.green('✔');
  const cross = chalk.red('✖');

  log.blank();
  console.log(chalk.bold('STB Status'));
  console.log(chalk.dim('─'.repeat(40)));
  console.log(`  Host            ${chalk.cyan(config.host)}`);
  console.log(`  SSH             ${connected ? `${tick} connected` : `${cross} unreachable`}`);
  console.log(`  Port            ${config.port}`);
  console.log(`  User            ${config.user}`);
  console.log(`  Build Command   ${config.buildCommand}`);
  console.log(`  Build Output    ${chalk.dim(config.buildOutput)}  ${fs.existsSync(config.buildOutput) ? tick : chalk.yellow('(not built)')}`);
  console.log(`  Remote Path     ${chalk.dim(config.remotePath)}`);
  console.log(`  Service         ${config.service}`);
  console.log(`  Project Dir     ${chalk.dim(process.cwd())}`);
  log.blank();
}
