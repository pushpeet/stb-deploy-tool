import execa from 'execa';
import { StbConfig } from '../types/index.js';
import { SshService } from './SshService.js';
import { spinner, log } from '../utils/logger.js';

export class DeployService {
  constructor(private readonly config: StbConfig) {}

  private async hasRsync(): Promise<boolean> {
    try {
      await execa('which', ['rsync']);
      // also verify rsync exists on the remote
      const ssh = new SshService(this.config);
      await ssh.exec('which rsync');
      return true;
    } catch {
      return false;
    }
  }

  private async deployWithRsync(): Promise<number> {
    const { user, host, port, buildOutput, remotePath } = this.config;
    const ssh = new SshService(this.config);
    const src = `${buildOutput}/`;
    const dest = `${user}@${host}:${remotePath}/`;
    const args = [
      '-az', '--delete',
      '--progress',
      '-e', `${ssh.sshPassCommand()} -p ${port}`,
      src, dest,
    ];

    const sp = spinner('Uploading to STB... 0%').start();
    const start = Date.now();

    const child = execa('rsync', args);

    // rsync --info=progress2 writes to stdout, lines look like:
    //    1,234,567  45%  1.23MB/s    0:00:03
    child.stdout?.on('data', (chunk: Buffer) => {
      const line = chunk.toString();
      const match = line.match(/(\d+)%/);
      if (match) {
        sp.text = `Uploading to STB... ${match[1]}%`;
      }
    });

    try {
      await child;
      sp.succeed('Upload complete — 100%');
    } catch (err) {
      sp.fail('Upload failed');
      throw err;
    }

    return Date.now() - start;
  }

  private async deployWithScp(): Promise<number> {
    const { user, host, port, buildOutput, remotePath, password } = this.config;
    const pass = password ?? '';

    // Count total files first so we can show X/total progress
    const countResult = await execa('find', [buildOutput, '-type', 'f']);
    const totalFiles = countResult.stdout.split('\n').filter(Boolean).length;

    const scpArgs = [
      '-r', '-O', '-P', String(port),
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'PasswordAuthentication=yes',
      `${buildOutput}/`,
      `${user}@${host}:${remotePath}/`,
    ];

    const sp = spinner(`Uploading to STB... 0/${totalFiles} files`).start();
    const start = Date.now();
    const hasPassword = pass !== '';
    const child = hasPassword
      ? execa('sshpass', ['-p', pass, 'scp', ...scpArgs])
      : execa('scp', scpArgs);

    // scp -v prints "Sending file modes" per file to stderr
    let transferred = 0;
    child.stderr?.on('data', (chunk: Buffer) => {
      const matches = chunk.toString().match(/Sending file modes/g);
      if (matches) {
        transferred += matches.length;
        const pct = totalFiles > 0 ? Math.min(100, Math.round((transferred / totalFiles) * 100)) : 0;
        sp.text = `Uploading to STB... ${transferred}/${totalFiles} files (${pct}%)`;
      }
    });

    try {
      await child;
      sp.succeed(`Upload complete — ${totalFiles} files transferred`);
    } catch (err) {
      sp.fail('Upload failed');
      throw err;
    }

    return Date.now() - start;
  }

  private async cleanRemote(): Promise<void> {
    const sp = spinner('Cleaning remote folder...').start();
    try {
      const ssh = new SshService(this.config);
      await ssh.exec(`rm -rf ${this.config.remotePath}/* ${this.config.remotePath}/.[!.]* 2>/dev/null || true`);
      sp.succeed('Remote folder cleaned');
    } catch (err) {
      sp.fail('Failed to clean remote folder');
      throw err;
    }
  }

  async upload(): Promise<number> {
    const useRsync = await this.hasRsync();
    if (!useRsync) {
      log.warn('rsync not found — falling back to scp');
      await this.cleanRemote();
    }
    return useRsync
      ? await this.deployWithRsync()
      : await this.deployWithScp();
  }
}
