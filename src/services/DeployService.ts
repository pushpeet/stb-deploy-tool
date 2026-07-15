import execa from 'execa';
import * as fs from 'fs-extra';
import { StbConfig } from '../types/index.js';
import { SshService } from './SshService.js';
import { spinner } from '../utils/logger.js';

export class DeployService {
  constructor(private readonly config: StbConfig) {}

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
    const { user, host, port, buildOutput, remotePath, password } = this.config;
    const pass = password ?? '';
    const hasPassword = pass !== '';

    if (!fs.existsSync(buildOutput)) {
      throw new Error(`Build output not found at ${buildOutput}. Run 'stb deploy' first.`);
    }

    await this.cleanRemote();

    const countResult = await execa('find', [buildOutput, '-type', 'f']).catch(() => ({ stdout: '' }));
    const totalFiles = countResult.stdout.split('\n').filter(Boolean).length;

    const scpArgs = [
      '-r', '-O', '-v', '-P', String(port),
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'PasswordAuthentication=yes',
    ];

    const dest = `${user}@${host}:${remotePath}/`;
    const scpCmd = hasPassword
      ? `sshpass -p '${pass}' scp ${scpArgs.join(' ')} ${buildOutput}/* ${dest}`
      : `scp ${scpArgs.join(' ')} ${buildOutput}/* ${dest}`;

    const sp = spinner(`Uploading to STB... 0/${totalFiles} files`).start();
    const start = Date.now();
    const child = execa('sh', ['-c', scpCmd]);

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
}
