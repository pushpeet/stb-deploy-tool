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
exports.deployCommand = deployCommand;
const chalk_1 = __importDefault(require("chalk"));
const config_js_1 = require("../utils/config.js");
const BuildService_js_1 = require("../services/BuildService.js");
const DeployService_js_1 = require("../services/DeployService.js");
const SshService_js_1 = require("../services/SshService.js");
const logger_js_1 = require("../utils/logger.js");
async function deployCommand(options = {}) {
    const config = (0, config_js_1.readConfig)();
    const build = new BuildService_js_1.BuildService(config);
    const deploy = new DeployService_js_1.DeployService(config);
    const ssh = new SshService_js_1.SshService(config);
    const totalStart = Date.now();
    const timings = { totalMs: 0 };
    logger_js_1.log.blank();
    logger_js_1.log.info(`Deploying to ${chalk_1.default.bold(config.host)}...`);
    logger_js_1.log.blank();
    if (!options.skipBuild) {
        await build.clean();
        timings.buildMs = await build.build();
    }
    timings.uploadMs = await deploy.upload();
    if (!options.skipRestart) {
        const sp = (await Promise.resolve().then(() => __importStar(require('ora')))).default('Restarting service...').start();
        try {
            timings.restartMs = await ssh.restartService();
            sp.succeed('Service restarted');
        }
        catch (err) {
            sp.fail('Failed to restart service');
            throw err;
        }
    }
    timings.totalMs = Date.now() - totalStart;
    logger_js_1.log.blank();
    logger_js_1.log.success(chalk_1.default.bold('Deployment complete'));
    if (timings.buildMs !== undefined)
        (0, logger_js_1.printTimings)('Build', timings.buildMs);
    if (timings.uploadMs !== undefined)
        (0, logger_js_1.printTimings)('Upload', timings.uploadMs);
    if (timings.restartMs !== undefined)
        (0, logger_js_1.printTimings)('Restart', timings.restartMs);
    (0, logger_js_1.printTimings)('Total', timings.totalMs);
    logger_js_1.log.blank();
}
//# sourceMappingURL=deploy.js.map