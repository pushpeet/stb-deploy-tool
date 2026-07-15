"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsCommand = logsCommand;
const chalk_1 = __importDefault(require("chalk"));
const config_js_1 = require("../utils/config.js");
const SshService_js_1 = require("../services/SshService.js");
const logger_js_1 = require("../utils/logger.js");
async function logsCommand() {
    const config = (0, config_js_1.readConfig)();
    const ssh = new SshService_js_1.SshService(config);
    logger_js_1.log.info(`Streaming logs from ${chalk_1.default.bold(config.host)}...`);
    logger_js_1.log.dim('  Press Ctrl+C to stop');
    logger_js_1.log.blank();
    await ssh.streamLogs();
}
//# sourceMappingURL=logs.js.map