import chalk from 'chalk';
import * as fs from 'fs-extra';
import execa from 'execa';
import { readConfig } from '../utils/config.js';
import { SshService } from '../services/SshService.js';
import { DoctorCheck } from '../types/index.js';
import { log } from '../utils/logger.js';

async function checkSsh(ssh: SshService): Promise<DoctorCheck> {
  const ok = await ssh.isConnected();
  return { name: 'SSH connectivity', status: ok ? 'ok' : 'fail', message: ok ? 'Connected' : 'Cannot reach STB' };
}

async function checkBuildCommand(cmd: string): Promise<DoctorCheck> {
  const [bin] = cmd.split(' ');
  try {
    await execa('which', [bin]);
    return { name: 'Build command', status: 'ok', message: `${bin} found` };
  } catch {
    return { name: 'Build command', status: 'fail', message: `${bin} not found in PATH` };
  }
}

function checkBuildOutput(outputPath: string): DoctorCheck {
  const exists = fs.existsSync(outputPath);
  return {
    name: 'Build output',
    status: exists ? 'ok' : 'warn',
    message: exists ? `${outputPath} exists` : `${outputPath} not found — run stb deploy`,
  };
}

async function checkRemotePath(ssh: SshService): Promise<DoctorCheck> {
  const exists = await ssh.checkRemotePath();
  if (!exists) return { name: 'Remote path', status: 'fail', message: 'Remote path does not exist' };
  const writable = await ssh.checkRemoteWritable();
  return { name: 'Remote path', status: writable ? 'ok' : 'fail', message: writable ? 'Exists and writable' : 'Exists but not writable' };
}

async function checkService(ssh: SshService, service: string): Promise<DoctorCheck> {
  const status = await ssh.serviceStatus();
  const ok = status.trim() === 'active';
  return { name: `Service (${service})`, status: ok ? 'ok' : 'warn', message: `systemctl: ${status.trim() || 'unknown'}` };
}

async function checkRsync(): Promise<DoctorCheck> {
  try {
    await execa('which', ['rsync']);
    return { name: 'rsync', status: 'ok', message: 'rsync available' };
  } catch {
    return { name: 'rsync', status: 'warn', message: 'rsync not found — will fall back to scp' };
  }
}

function renderCheck(check: DoctorCheck): void {
  const icon = check.status === 'ok' ? chalk.green('✔') : check.status === 'warn' ? chalk.yellow('⚠') : chalk.red('✖');
  const label = chalk.bold(check.name.padEnd(22));
  console.log(`  ${icon}  ${label} ${chalk.dim(check.message)}`);
}

export async function doctorCommand(): Promise<void> {
  const config = readConfig();
  const ssh = new SshService(config);

  log.blank();
  console.log(chalk.bold('STB Doctor'));
  console.log(chalk.dim('─'.repeat(50)));

  const checks = await Promise.all([
    checkSsh(ssh),
    checkBuildCommand(config.buildCommand),
    checkBuildOutput(config.buildOutput),
    checkRemotePath(ssh),
    checkService(ssh, config.service),
    checkRsync(),
  ]);

  checks.forEach(renderCheck);
  log.blank();

  const failures = checks.filter((c) => c.status === 'fail');
  const warnings = checks.filter((c) => c.status === 'warn');

  if (failures.length === 0 && warnings.length === 0) {
    log.success('All checks passed');
  } else {
    if (failures.length > 0) log.error(`${failures.length} check(s) failed`);
    if (warnings.length > 0) log.warn(`${warnings.length} warning(s)`);
  }
  log.blank();
}
