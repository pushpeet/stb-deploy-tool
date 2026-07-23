import chalk from 'chalk';
import execa from 'execa';
import * as fs from 'fs';
import * as path from 'path';
import { log, spinner } from '../utils/logger.js';

interface Pkg {
  version: string;
  repository?: { url?: string } | string;
}

type Semver = [number, number, number];

function loadPkg(): Pkg {
  const pkgPath = path.join(__dirname, '..', '..', 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as Pkg;
}

function normalizeRepoUrl(repo: Pkg['repository']): string {
  let url = typeof repo === 'string' ? repo : repo?.url ?? '';
  url = url.replace(/^git\+/, '');
  if (!url) throw new Error('Repository URL not found in package.json');
  return url;
}

function parseSemver(tag: string): Semver | null {
  const m = tag.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemver(a: Semver, b: Semver): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

async function latestTag(repoUrl: string): Promise<string | null> {
  const { stdout } = await execa('git', ['ls-remote', '--tags', '--refs', repoUrl]);
  let best: { tag: string; ver: Semver } | null = null;
  for (const line of stdout.split('\n')) {
    const tag = (line.split('/').pop() ?? '').trim();
    const ver = parseSemver(tag);
    if (!ver) continue;
    if (!best || compareSemver(ver, best.ver) > 0) best = { tag, ver };
  }
  return best?.tag ?? null;
}

export async function updateCommand(targetTag?: string): Promise<void> {
  const pkg = loadPkg();
  const current = pkg.version;
  const repoUrl = normalizeRepoUrl(pkg.repository);

  log.info(`Current version: ${chalk.bold('v' + current)}`);

  let tag = targetTag;
  if (!tag) {
    const sp = spinner('Checking for the latest version...').start();
    try {
      const latest = await latestTag(repoUrl);
      if (!latest) {
        sp.fail('Could not find any version tags on the remote');
        throw new Error('No semver tags found on remote repository');
      }
      tag = latest;
      sp.succeed(`Latest version: ${chalk.bold(tag)}`);
    } catch (err) {
      sp.fail('Failed to check the remote for the latest version');
      throw err;
    }
  }

  const targetVer = parseSemver(tag);
  const currentVer = parseSemver(current);
  if (!targetTag && targetVer && currentVer && compareSemver(targetVer, currentVer) <= 0) {
    log.success(`Already up to date (v${current}).`);
    return;
  }

  const spec = `git+${repoUrl}#${tag}`;
  log.info(`Updating to ${chalk.bold(tag)}...`);
  log.dim(`  npm install -g ${spec}`);
  log.blank();

  try {
    await execa('npm', ['install', '-g', '--foreground-scripts', spec], { stdio: 'inherit' });
  } catch (err) {
    log.blank();
    log.error('Update failed. Try clearing the npm cache and retry (do NOT use sudo):');
    log.dim('  npm cache clean --force');
    log.dim(`  npm install -g ${spec}`);
    throw err;
  }

  log.blank();
  log.success(`Updated to ${tag}. Run ${chalk.bold('stb --version')} to confirm.`);
}
