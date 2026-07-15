import execa from 'execa';
import { StbConfig } from '../types/index.js';
import { SshService } from './SshService.js';
import { spinner, log } from '../utils/logger.js';

export class DeployService {
  constructor(private readonly config: StbConfig) {}

  private async hasRsync(): Promise<boolean> {
    try {
      await execa('which', ['rsync']);
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
      '-e', `${ssh.sshPassCommand()} -p ${port}`,
      src, dest,
    ];
    const start = Date.now();
    await execa('rsync', args);
    return Date.now() - start;
  }

  private async deployWithScp(): Promise<number> {
    const { user, host, port, buildOutput, remotePath, password } = this.config;
    const pass = password ?? '';
    const scpArgs = [
      '-r', '-P', String(port),
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'PasswordAuthentication=yes',
      `${buildOutput}/.`,
      `${user}@${host}:${remotePath}/`,
    ];
    const start = Date.now();
    await execa('sshpass', ['-p', pass, 'scp', ...scpArgs]);
    return Date.now() - start;
  }

  async upload(): Promise<number> {
    const sp = spinner('Uploading to STB...').start();
    try {
      const useRsync = await this.hasRsync();
      if (!useRsync) {
        log.warn('rsync not found — falling back to scp');
      }
      const elapsed = useRsync
        ? await this.deployWithRsync()
        : await this.deployWithScp();
      sp.succeed(`Upload complete`);
      return elapsed;
    } catch (err) {
      sp.fail('Upload failed');
      throw err;
    }
  }
}
