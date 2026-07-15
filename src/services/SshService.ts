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
      '-o', 'PasswordAuthentication=yes',
      ...extraArgs,
      `${this.config.user}@${this.config.host}`,
    ];
  }

  // Wraps a command with sshpass when a password is configured
  private withPass(bin: string, args: string[]): { bin: string; args: string[] } {
    const pass = this.config.password ?? '';
    return { bin: 'sshpass', args: ['-p', pass, bin, ...args] };
  }

  async isConnected(): Promise<boolean> {
    try {
      const { bin, args } = this.withPass('ssh', [...this.sshArgs(), 'echo ok']);
      await execa(bin, args, { timeout: 6000 });
      return true;
    } catch {
      return false;
    }
  }

  async exec(command: string): Promise<string> {
    const { bin, args } = this.withPass('ssh', [...this.sshArgs(), command]);
    const result = await execa(bin, args);
    return result.stdout;
  }

  async execTimed(command: string): Promise<{ stdout: string; elapsedMs: number }> {
    const start = Date.now();
    const { bin, args } = this.withPass('ssh', [...this.sshArgs(), command]);
    const result = await execa(bin, args);
    return { stdout: result.stdout, elapsedMs: Date.now() - start };
  }

  openShell(): void {
    const sshArgs = [
      '-p', String(this.config.port),
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'PasswordAuthentication=yes',
      `${this.config.user}@${this.config.host}`,
    ];
    const { bin, args } = this.withPass('ssh', sshArgs);
    const child = spawn(bin, args, { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code ?? 0));
  }

  async streamLogs(): Promise<void> {
    const { bin, args } = this.withPass('ssh', [...this.sshArgs(), 'journalctl -f']);
    const child = spawn(bin, args, { stdio: 'inherit' });
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

  // Returns the sshpass ssh command string for rsync -e
  sshPassCommand(): string {
    const pass = this.config.password ?? '';
    return `sshpass -p '${pass}' ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=yes`;
  }
}
