"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCommand = syncCommand;
const chalk_1 = __importDefault(require("chalk"));
const config_js_1 = require("../utils/config.js");
const BuildService_js_1 = require("../services/BuildService.js");
const DeployService_js_1 = require("../services/DeployService.js");
const logger_js_1 = require("../utils/logger.js");
async function syncCommand() {
    const config = (0, config_js_1.readConfig)();
    const build = new BuildService_js_1.BuildService(config);
    const deploy = new DeployService_js_1.DeployService(config);
    if (!build.buildOutputExists()) {
        logger_js_1.log.error(`Build output not found at ${chalk_1.default.bold(config.buildOutput)}`);
        logger_js_1.log.info(`Run ${chalk_1.default.cyan('stb deploy')} to build and deploy.`);
        process.exit(1);
    }
    logger_js_1.log.blank();
    logger_js_1.log.info(`Syncing to ${chalk_1.default.bold(config.host)}...`);
    logger_js_1.log.blank();
    const start = Date.now();
    const uploadMs = await deploy.upload();
    const totalMs = Date.now() - start;
    logger_js_1.log.blank();
    logger_js_1.log.success(chalk_1.default.bold('Sync complete'));
    (0, logger_js_1.printTimings)('Upload', uploadMs);
    (0, logger_js_1.printTimings)('Total', totalMs);
    logger_js_1.log.blank();
}
//# sourceMappingURL=sync.js.map