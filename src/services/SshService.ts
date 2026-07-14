import execa from 'execa';
import { spawn } from 'child_process';
import { StbConfig } from '../types/index.js';

export class SshService {
  constructor(private readonly config: StbConfig) {}

  private sshArgs(extraArgs: string[] = []): string[] {
    return [
      '-p', String(this.config.port),
      '-o', 'ConnectTimeout=5',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'BatchMode=yes',
      ...extraArgs,
      `${this.config.user}@${this.config.host}`,
    ];
  }

  async isConnected(): Promise<boolean> {
    try {
      await execa('ssh', [...this.sshArgs(), 'echo ok'], { timeout: 6000 });
      return true;
    } catch {
      return false;
    }
  }

  async exec(command: string): Promise<string> {
    const result = await execa('ssh', [...this.sshArgs(), command]);
    return result.stdout;
  }

  async execTimed(command: string): Promise<{ stdout: string; elapsedMs: number }> {
    const start = Date.now();
    const result = await execa('ssh', [...this.sshArgs(), command]);
    return { stdout: result.stdout, elapsedMs: Date.now() - start };
  }

  openShell(): void {
    const args = [
      '-p', String(this.config.port),
      '-o', 'StrictHostKeyChecking=no',
      `${this.config.user}@${this.config.host}`,
    ];
    const child = spawn('ssh', args, { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code ?? 0));
  }

  async streamLogs(): Promise<void> {
    const child = spawn('ssh', [...this.sshArgs(), 'journalctl -f'], {
      stdio: 'inherit',
    });
    return new Promise((_, reject) => {
      child.on('error', reject);
      child.on('exit', () => process.exit(0));
    });
  }

  async restartService(): Promise<number> {
    const start = Date.now();
    await this.exec(`systemctl restart ${this.config.service}`);
    return Date.now() - start;
  }

  async serviceStatus(): Promise<string> {
    try {
      return await this.exec(`systemctl is-active ${this.config.service}`);
    } catch {
      return 'unknown';
    }
  }

  async checkRemotePath(): Promise<boolean> {
    try {
      await this.exec(`test -d ${this.config.remotePath}`);
      return true;
    } catch {
      return false;
    }
  }

  async checkRemoteWritable(): Promise<boolean> {
    try {
      await this.exec(`test -w ${this.config.remotePath}`);
      return true;
    } catch {
      return false;
    }
  }

  buildSshCommand(): string {
    return `ssh -p ${this.config.port} ${this.config.user}@${this.config.host}`;
  }
}
