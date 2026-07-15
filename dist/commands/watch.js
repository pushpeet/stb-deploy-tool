"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.watchCommand = watchCommand;
const chokidar_1 = __importDefault(require("chokidar"));
const chalk_1 = __importDefault(require("chalk"));
const config_js_1 = require("../utils/config.js");
const deploy_js_1 = require("./deploy.js");
const logger_js_1 = require("../utils/logger.js");
const DEBOUNCE_MS = 800;
const WATCH_PATHS = ['src', 'static', 'lng.config.js', 'lng.config.ts'];
async function watchCommand() {
    const config = (0, config_js_1.readConfig)();
    logger_js_1.log.blank();
    logger_js_1.log.info(`Watching for changes... ${chalk_1.default.dim('(Ctrl+C to stop)')}`);
    logger_js_1.log.dim(`  Debounce: ${DEBOUNCE_MS}ms`);
    logger_js_1.log.dim(`  Target:   ${config.host}`);
    logger_js_1.log.blank();
    let debounceTimer = null;
    let isDeploying = false;
    let pendingDeploy = false;
    async function runDeploy() {
        if (isDeploying) {
            pendingDeploy = true;
            return;
        }
        isDeploying = true;
        pendingDeploy = false;
        try {
            await (0, deploy_js_1.deployCommand)();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger_js_1.log.error(`Deploy failed: ${message}`);
        }
        finally {
            isDeploying = false;
            if (pendingDeploy) {
                logger_js_1.log.info('Running queued deployment...');
                await runDeploy();
            }
        }
    }
    function onFileChange(filePath) {
        logger_js_1.log.dim(`  changed: ${filePath}`);
        if (debounceTimer)
            clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            void runDeploy();
        }, DEBOUNCE_MS);
    }
    const watcher = chokidar_1.default.watch(WATCH_PATHS, {
        ignoreInitial: true,
        ignored: /(^|[/\\])\..|(node_modules|dist)/,
        persistent: true,
    });
    watcher.on('change', onFileChange);
    watcher.on('add', onFileChange);
    watcher.on('unlink', onFileChange);
    process.on('SIGINT', async () => {
        logger_js_1.log.blank();
        logger_js_1.log.info('Stopping watcher...');
        await watcher.close();
        process.exit(0);
    });
    // Keep process alive
    await new Promise(() => undefined);
}
//# sourceMappingURL=watch.js.map