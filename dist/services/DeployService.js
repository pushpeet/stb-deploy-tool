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
exports.DeployService = void 0;
const execa_1 = __importDefault(require("execa"));
const fs = __importStar(require("fs-extra"));
const SshService_js_1 = require("./SshService.js");
const logger_js_1 = require("../utils/logger.js");
class DeployService {
    constructor(config) {
        this.config = config;
    }
    async cleanRemote() {
        const sp = (0, logger_js_1.spinner)('Cleaning remote folder...').start();
        try {
            const ssh = new SshService_js_1.SshService(this.config);
            await ssh.exec(`rm -rf ${this.config.remotePath}/* ${this.config.remotePath}/.[!.]* 2>/dev/null || true`);
            sp.succeed('Remote folder cleaned');
        }
        catch (err) {
            sp.fail('Failed to clean remote folder');
            throw err;
        }
    }
    async upload() {
        const { user, host, port, buildOutput, remotePath, password } = this.config;
        const pass = password ?? '';
        const hasPassword = pass !== '';
        if (!fs.existsSync(buildOutput)) {
            throw new Error(`Build output not found at ${buildOutput}. Run 'stb deploy' first.`);
        }
        await this.cleanRemote();
        // Calculate total size of build output
        const duResult = await (0, execa_1.default)('du', ['-sk', buildOutput]).catch(() => ({ stdout: '0' }));
        const totalKb = parseInt(duResult.stdout.split('\t')[0], 10) || 0;
        const totalMb = (totalKb / 1024).toFixed(1);
        const scpArgs = [
            '-r', '-O', '-v', '-P', String(port),
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'PasswordAuthentication=yes',
        ];
        const dest = `${user}@${host}:${remotePath}/`;
        const scpCmd = hasPassword
            ? `sshpass -p '${pass}' scp ${scpArgs.join(' ')} ${buildOutput}/* ${dest}`
            : `scp ${scpArgs.join(' ')} ${buildOutput}/* ${dest}`;
        const sp = (0, logger_js_1.spinner)(`Uploading to STB... 0.0 MB / ${totalMb} MB (0%)`).start();
        const start = Date.now();
        const child = (0, execa_1.default)('sh', ['-c', scpCmd]);
        let transferredKb = 0;
        child.stderr?.on('data', (chunk) => {
            // scp -v outputs file sizes like: Sending file modes: C0644 12345 filename
            const matches = [...chunk.toString().matchAll(/Sending file modes: \S+ (\d+)/g)];
            if (matches.length > 0) {
                for (const match of matches) {
                    transferredKb += parseInt(match[1], 10) / 1024;
                }
                const transferredMb = (transferredKb / 1024).toFixed(1);
                const pct = totalKb > 0 ? Math.min(100, Math.round((transferredKb / totalKb) * 100)) : 0;
                sp.text = `Uploading to STB... ${transferredMb} MB / ${totalMb} MB (${pct}%)`;
            }
        });
        try {
            await child;
            sp.succeed(`Upload complete — ${totalMb} MB transferred`);
        }
        catch (err) {
            sp.fail('Upload failed');
            throw err;
        }
        return Date.now() - start;
    }
}
exports.DeployService = DeployService;
//# sourceMappingURL=DeployService.js.map