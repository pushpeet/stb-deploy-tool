"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sshCommand = sshCommand;
const chalk_1 = __importDefault(require("chalk"));
const config_js_1 = require("../utils/config.js");
const SshService_js_1 = require("../services/SshService.js");
const logger_js_1 = require("../utils/logger.js");
function sshCommand() {
    const config = (0, config_js_1.readConfig)();
    const ssh = new SshService_js_1.SshService(config);
    logger_js_1.log.info(`Connecting to ${chalk_1.default.bold(config.host)}...`);
    logger_js_1.log.dim(`  ${ssh.buildSshCommand()}`);
    ssh.openShell();
}
//# sourceMappingURL=ssh.js.map