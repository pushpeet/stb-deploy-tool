"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostCommand = hostCommand;
const prompts_1 = __importDefault(require("prompts"));
const chalk_1 = __importDefault(require("chalk"));
const config_js_1 = require("../utils/config.js");
const logger_js_1 = require("../utils/logger.js");
async function hostCommand(ip) {
    const config = (0, config_js_1.readConfig)();
    if (ip) {
        (0, config_js_1.updateConfig)({ host: ip.trim() });
        logger_js_1.log.success(`Host updated to ${chalk_1.default.bold(ip.trim())}`);
        return;
    }
    logger_js_1.log.info(`Current host: ${chalk_1.default.bold(config.host)}`);
    logger_js_1.log.blank();
    const { newHost } = await (0, prompts_1.default)({
        type: 'text',
        name: 'newHost',
        message: 'New host (leave blank to keep current):',
        initial: config.host,
    });
    if (!newHost || newHost.trim() === config.host) {
        logger_js_1.log.dim('No changes made.');
        return;
    }
    (0, config_js_1.updateConfig)({ host: newHost.trim() });
    logger_js_1.log.success(`Host updated to ${chalk_1.default.bold(newHost.trim())}`);
}
//# sourceMappingURL=host.js.map