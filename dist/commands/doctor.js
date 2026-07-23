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
exports.doctorCommand = doctorCommand;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const execa_1 = __importDefault(require("execa"));
const config_js_1 = require("../utils/config.js");
const SshService_js_1 = require("../services/SshService.js");
const logger_js_1 = require("../utils/logger.js");
async function checkSsh(ssh) {
    const ok = await ssh.isConnected();
    return {
        name: "SSH connectivity",
        status: ok ? "ok" : "fail",
        message: ok ? "Connected" : "Cannot reach STB",
    };
}
async function checkBuildCommand(cmd) {
    const [bin] = cmd.split(" ");
    try {
        await (0, execa_1.default)("which", [bin]);
        return { name: "Build command", status: "ok", message: `${bin} found` };
    }
    catch {
        return {
            name: "Build command",
            status: "fail",
            message: `${bin} not found in PATH`,
        };
    }
}
function checkBuildOutput(outputPath) {
    const exists = fs.existsSync(outputPath);
    return {
        name: "Build output",
        status: exists ? "ok" : "warn",
        message: exists
            ? `${outputPath} exists`
            : `${outputPath} not found — run stb deploy`,
    };
}
async function checkRemotePath(ssh) {
    const exists = await ssh.checkRemotePath();
    if (!exists)
        return {
            name: "Remote path",
            status: "fail",
            message: "Remote path does not exist",
        };
    const writable = await ssh.checkRemoteWritable();
    return {
        name: "Remote path",
        status: writable ? "ok" : "fail",
        message: writable ? "Exists and writable" : "Exists but not writable",
    };
}
async function checkService(ssh, service) {
    const status = await ssh.serviceStatus();
    const ok = status.trim() === "active";
    return {
        name: `Service (${service})`,
        status: ok ? "ok" : "warn",
        message: `systemctl: ${status.trim() || "unknown"}`,
    };
}
async function checkRsync() {
    try {
        await (0, execa_1.default)("which", ["rsync"]);
        return { name: "rsync", status: "ok", message: "rsync available" };
    }
    catch {
        return {
            name: "rsync",
            status: "warn",
            message: "rsync not found — will fall back to scp",
        };
    }
}
async function checkSshpass() {
    try {
        await (0, execa_1.default)("which", ["sshpass"]);
        return { name: "sshpass", status: "ok", message: "sshpass available" };
    }
    catch {
        return {
            name: "sshpass",
            status: "warn",
            message: "sshpass not found — needed for password auth (brew install hudochenkov/sshpass/sshpass)",
        };
    }
}
function renderCheck(check) {
    const icon = check.status === "ok"
        ? chalk_1.default.green("✔")
        : check.status === "warn"
            ? chalk_1.default.yellow("⚠")
            : chalk_1.default.red("✖");
    const label = chalk_1.default.bold(check.name.padEnd(22));
    console.log(`  ${icon}  ${label} ${chalk_1.default.dim(check.message)}`);
}
async function doctorCommand() {
    const config = (0, config_js_1.readConfig)();
    const ssh = new SshService_js_1.SshService(config);
    logger_js_1.log.blank();
    console.log(chalk_1.default.bold("STB Doctor"));
    console.log(chalk_1.default.dim("─".repeat(50)));
    const checks = await Promise.all([
        checkSsh(ssh),
        checkBuildCommand(config.buildCommand),
        checkBuildOutput(config.buildOutput),
        checkRemotePath(ssh),
        checkService(ssh, config.service),
        checkRsync(),
        checkSshpass(),
    ]);
    checks.forEach(renderCheck);
    logger_js_1.log.blank();
    const failures = checks.filter((c) => c.status === "fail");
    const warnings = checks.filter((c) => c.status === "warn");
    if (failures.length === 0 && warnings.length === 0) {
        logger_js_1.log.success("All checks passed");
    }
    else {
        if (failures.length > 0)
            logger_js_1.log.error(`${failures.length} check(s) failed`);
        if (warnings.length > 0)
            logger_js_1.log.warn(`${warnings.length} warning(s)`);
    }
    logger_js_1.log.blank();
}
//# sourceMappingURL=doctor.js.map