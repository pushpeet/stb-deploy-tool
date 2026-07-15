"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SshService = void 0;
const execa_1 = __importDefault(require("execa"));
const child_process_1 = require("child_process");
class SshService {
    constructor(config) {
        this.config = config;
    }
    get hasPassword() {
        return (this.config.password ?? '') !== '';
    }
    sshArgs(extraArgs = []) {
        return [
            '-p', String(this.config.port),
            '-o', 'ConnectTimeout=5',
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'PasswordAuthentication=yes',
            ...extraArgs,
            `${this.config.user}@${this.config.host}`,
        ];
    }
    // Only wraps with sshpass when password is non-empty
    withPass(bin, args) {
        if (!this.hasPassword)
            return { bin, args };
        return { bin: 'sshpass', args: ['-p', this.config.password, bin, ...args] };
    }
    async isConnected() {
        try {
            const { bin, args } = this.withPass('ssh', [...this.sshArgs(), 'echo ok']);
            await (0, execa_1.default)(bin, args, { timeout: 6000 });
            return true;
        }
        catch {
            return false;
        }
    }
    async exec(command) {
        const { bin, args } = this.withPass('ssh', [...this.sshArgs(), command]);
        const result = await (0, execa_1.default)(bin, args);
        return result.stdout;
    }
    async execTimed(command) {
        const start = Date.now();
        const { bin, args } = this.withPass('ssh', [...this.sshArgs(), command]);
        const result = await (0, execa_1.default)(bin, args);
        return { stdout: result.stdout, elapsedMs: Date.now() - start };
    }
    openShell() {
        const sshArgs = [
            '-p', String(this.config.port),
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'PasswordAuthentication=yes',
            `${this.config.user}@${this.config.host}`,
        ];
        const { bin, args } = this.withPass('ssh', sshArgs);
        const child = (0, child_process_1.spawn)(bin, args, { stdio: 'inherit' });
        child.on('exit', (code) => process.exit(code ?? 0));
    }
    async streamLogs() {
        const { bin, args } = this.withPass('ssh', [...this.sshArgs(), 'journalctl -f']);
        const child = (0, child_process_1.spawn)(bin, args, { stdio: 'inherit' });
        const cleanup = () => {
            child.kill('SIGTERM');
            process.exit(0);
        };
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        return new Promise((_, reject) => {
            child.on('error', reject);
            child.on('exit', () => process.exit(0));
        });
    }
    async restartService() {
        const start = Date.now();
        await this.exec(`systemctl restart ${this.config.service}`);
        return Date.now() - start;
    }
    async serviceStatus() {
        try {
            return await this.exec(`systemctl is-active ${this.config.service}`);
        }
        catch {
            return 'unknown';
        }
    }
    async checkRemotePath() {
        try {
            await this.exec(`test -d ${this.config.remotePath}`);
            return true;
        }
        catch {
            return false;
        }
    }
    async checkRemoteWritable() {
        try {
            await this.exec(`test -w ${this.config.remotePath}`);
            return true;
        }
        catch {
            return false;
        }
    }
    buildSshCommand() {
        return `ssh -p ${this.config.port} ${this.config.user}@${this.config.host}`;
    }
}
exports.SshService = SshService;
//# sourceMappingURL=SshService.js.map