#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { hostCommand } from './commands/host.js';
import { deployCommand } from './commands/deploy.js';
import { syncCommand } from './commands/sync.js';
import { restartCommand } from './commands/restart.js';
import { sshCommand } from './commands/ssh.js';
import { logsCommand } from './commands/logs.js';
import { statusCommand } from './commands/status.js';
import { doctorCommand } from './commands/doctor.js';
import { watchCommand } from './commands/watch.js';
import { discoverCommand } from './commands/discover.js';

const program = new Command();

program
  .name('stb')
  .description('Smart TV/STB deployment CLI for Lightning (lng) projects')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize STB config (asks for host/IP)')
  .action(wrap(initCommand));

program
  .command('host [ip]')
  .description('Show or update the STB host/IP')
  .action((ip?: string) => wrap(() => hostCommand(ip))());

program
  .command('deploy')
  .description('Clean, build, upload, and restart service')
  .action(wrap(deployCommand));

program
  .command('sync')
  .description('Upload existing build without rebuilding or restarting')
  .action(wrap(syncCommand));

program
  .command('restart')
  .description('Restart the residentapp service on STB')
  .action(wrap(restartCommand));

program
  .command('ssh')
  .description('Open an interactive SSH session to the STB')
  .action(() => {
    try {
      sshCommand();
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('logs')
  .description('Stream journalctl logs from the STB')
  .action(wrap(logsCommand));

program
  .command('status')
  .description('Show STB connection and project status')
  .action(wrap(statusCommand));

program
  .command('doctor')
  .description('Run health checks on your STB setup')
  .action(wrap(doctorCommand));

program
  .command('watch')
  .description('Watch source files and auto-deploy on changes')
  .action(wrap(watchCommand));

program
  .command('discover')
  .description('Auto-discover RDK STBs on the local network')
  .action(wrap(discoverCommand));

program.parse(process.argv);

function wrap(fn: () => Promise<void>): () => void {
  return () => {
    fn().catch(handleError);
  };
}

function handleError(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red('✖'), message);
  process.exit(1);
}
