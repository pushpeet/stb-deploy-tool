"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
const prompts_1 = __importDefault(require("prompts"));
const chalk_1 = __importDefault(require("chalk"));
const config_js_1 = require("../utils/config.js");
const index_js_1 = require("../types/index.js");
const logger_js_1 = require("../utils/logger.js");
async function initCommand() {
    if ((0, config_js_1.configExists)()) {
        const { overwrite } = await (0, prompts_1.default)({
            type: 'confirm',
            name: 'overwrite',
            message: 'Config already exists. Overwrite?',
            initial: false,
        });
        if (!overwrite) {
            logger_js_1.log.info('Aborted.');
            return;
        }
    }
    const { host } = await (0, prompts_1.default)({
        type: 'text',
        name: 'host',
        message: 'STB Host / IP address:',
        validate: (v) => v.trim().length > 0 || 'Host is required',
    });
    if (!host) {
        logger_js_1.log.error('No host provided. Aborted.');
        process.exit(1);
    }
    const { password } = await (0, prompts_1.default)({
        type: 'password',
        name: 'password',
        message: 'STB Password (leave blank if empty):',
    });
    const config = { ...index_js_1.DEFAULTS, host: host.trim(), password: password ?? '' };
    (0, config_js_1.writeConfig)(config);
    logger_js_1.log.blank();
    logger_js_1.log.success(`Config saved to ${chalk_1.default.bold((0, config_js_1.getConfigPath)())}`);
    logger_js_1.log.dim(`  host:         ${config.host}`);
    logger_js_1.log.dim(`  user:         ${config.user}`);
    logger_js_1.log.dim(`  password:     ${config.password === '' ? '(empty)' : '***'}`);
    logger_js_1.log.dim(`  port:         ${config.port}`);
    logger_js_1.log.dim(`  buildCommand: ${config.buildCommand}`);
    logger_js_1.log.dim(`  buildOutput:  ${config.buildOutput}`);
    logger_js_1.log.dim(`  remotePath:   ${config.remotePath}`);
    logger_js_1.log.dim(`  service:      ${config.service}`);
    logger_js_1.log.blank();
    logger_js_1.log.info(`Run ${chalk_1.default.cyan('stb deploy')} to start your first deployment.`);
}
//# sourceMappingURL=init.js.map