"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restartCommand = restartCommand;
const chalk_1 = __importDefault(require("chalk"));
const config_js_1 = require("../utils/config.js");
const SshService_js_1 = require("../services/SshService.js");
const logger_js_1 = require("../utils/logger.js");
async function restartCommand() {
    const config = (0, config_js_1.readConfig)();
    const ssh = new SshService_js_1.SshService(config);
    const sp = (0, logger_js_1.spinner)(`Restarting ${chalk_1.default.bold(config.service)} on ${chalk_1.default.bold(config.host)}...`).start();
    try {
        const elapsedMs = await ssh.restartService();
        sp.succeed(`${config.service} restarted`);
        (0, logger_js_1.printTimings)('Restart', elapsedMs);
    }
    catch (err) {
        sp.fail(`Failed to restart ${config.service}`);
        throw err;
    }
}
//# sourceMappingURL=restart.js.map