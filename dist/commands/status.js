"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = statusCommand;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const config_js_1 = require("../utils/config.js");
const SshService_js_1 = require("../services/SshService.js");
const logger_js_1 = require("../utils/logger.js");
async function statusCommand() {
    const config = (0, config_js_1.readConfig)();
    const ssh = new SshService_js_1.SshService(config);
    const sp = (0, logger_js_1.spinner)('Checking SSH connectivity...').start();
    const connected = await ssh.isConnected();
    sp.stop();
    const tick = chalk_1.default.green('✔');
    const cross = chalk_1.default.red('✖');
    logger_js_1.log.blank();
    console.log(chalk_1.default.bold('STB Status'));
    console.log(chalk_1.default.dim('─'.repeat(40)));
    console.log(`  Host            ${chalk_1.default.cyan(config.host)}`);
    console.log(`  SSH             ${connected ? `${tick} connected` : `${cross} unreachable`}`);
    console.log(`  Port            ${config.port}`);
    console.log(`  User            ${config.user}`);
    console.log(`  Build Command   ${config.buildCommand}`);
    console.log(`  Build Output    ${chalk_1.default.dim(config.buildOutput)}  ${fs.existsSync(config.buildOutput) ? tick : chalk_1.default.yellow('(not built)')}`);
    console.log(`  Remote Path     ${chalk_1.default.dim(config.remotePath)}`);
    console.log(`  Service         ${config.service}`);
    console.log(`  Project Dir     ${chalk_1.default.dim(process.cwd())}`);
    logger_js_1.log.blank();
}
//# sourceMappingURL=status.js.map