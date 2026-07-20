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
      sp.succeed(`STB ${this.config.remotePath} folder cleaned`);
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

    // Calculate total size of build output
    const duResult = await execa('du', ['-sk', buildOutput]).catch(() => ({ stdout: '0' }));
    const totalKb = parseInt(duResult.stdout.split('\t')[0], 10) || 0;
    const totalMb = (totalKb / 1024).toFixed(1);

    const scpArgs = [
      '-r', '-O', '-v', '-P', String(port),
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'PasswordAuthentication=yes',
    ];

    const dest = `${user}@${host}:${remotePath}/`;
    const scpCmd = hasPassword
      ? `sshpass -p '${pass}' scp ${scpArgs.join(' ')} ${buildOutput}/* ${dest}`
      : `scp ${scpArgs.join(' ')} ${buildOutput}/* ${dest}`;

    const sp = spinner(`Uploading to STB... 0.0 MB / ${totalMb} MB (0%)`).start();
    const start = Date.now();
    const child = execa('sh', ['-c', scpCmd]);

    let transferredKb = 0;
    child.stderr?.on('data', (chunk: Buffer) => {
      // scp -v outputs file sizes like: Sending file modes: C0644 12345 filename
      const matches = [...chunk.toString().matchAll(/Sending file modes: \S+ (\d+)/g)];
      if (matches.length > 0) {
        for (const match of matches) {
          transferredKb += parseInt(match[1], 10) / 1024;
        }
        const transferredMb = (transferredKb / 1024).toFixed(1);
        const pct = totalKb > 0 ? Math.min(100, Math.round((transferredKb / totalKb) * 100)) : 0;
        sp.text = `Uploading to STB... ${transferredMb} MB / ${totalMb} MB (${pct}%)`;
      }
    });

    try {
      await child;
      sp.succeed(`Upload complete — ${totalMb} MB transferred`);
    } catch (err) {
      sp.fail('Upload failed');
      throw err;
    }

    return Date.now() - start;
  }
}
