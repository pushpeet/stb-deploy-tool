import chokidar from 'chokidar';
import chalk from 'chalk';
import { readConfig } from '../utils/config.js';
import { deployCommand } from './deploy.js';
import { log } from '../utils/logger.js';

const DEBOUNCE_MS = 800;
const WATCH_PATHS = ['src', 'static', 'lng.config.js', 'lng.config.ts'];

export async function watchCommand(): Promise<void> {
  const config = readConfig();

  log.blank();
  log.info(`Watching for changes... ${chalk.dim('(Ctrl+C to stop)')}`);
  log.dim(`  Debounce: ${DEBOUNCE_MS}ms`);
  log.dim(`  Target:   ${config.host}`);
  log.blank();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isDeploying = false;
  let pendingDeploy = false;

  async function runDeploy(): Promise<void> {
    if (isDeploying) {
      pendingDeploy = true;
      return;
    }

    isDeploying = true;
    pendingDeploy = false;

    try {
      await deployCommand();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log.error(`Deploy failed: ${message}`);
    } finally {
      isDeploying = false;
      if (pendingDeploy) {
        log.info('Running queued deployment...');
        await runDeploy();
      }
    }
  }

  function onFileChange(filePath: string): void {
    log.dim(`  changed: ${filePath}`);
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void runDeploy();
    }, DEBOUNCE_MS);
  }

  const watcher = chokidar.watch(WATCH_PATHS, {
    ignoreInitial: true,
    ignored: /(^|[/\\])\..|(node_modules|dist)/,
    persistent: true,
  });

  watcher.on('change', onFileChange);
  watcher.on('add', onFileChange);
  watcher.on('unlink', onFileChange);

  process.on('SIGINT', async () => {
    log.blank();
    log.info('Stopping watcher...');
    await watcher.close();
    process.exit(0);
  });

  // Keep process alive
  await new Promise<never>(() => undefined);
}
