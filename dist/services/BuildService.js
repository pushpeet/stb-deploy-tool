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
exports.BuildService = void 0;
const fs = __importStar(require("fs-extra"));
const execa_1 = __importDefault(require("execa"));
const logger_js_1 = require("../utils/logger.js");
class BuildService {
    constructor(config) {
        this.config = config;
    }
    async clean() {
        const sp = (0, logger_js_1.spinner)('Cleaning dist folder...').start();
        try {
            await fs.remove(this.config.buildOutput);
            sp.succeed('Dist folder cleaned');
        }
        catch (err) {
            sp.fail('Failed to clean dist folder');
            throw err;
        }
    }
    async build() {
        const [cmd, ...args] = this.config.buildCommand.split(' ');
        const sp = (0, logger_js_1.spinner)(`Running ${this.config.buildCommand}...`).start();
        const start = Date.now();
        try {
            await (0, execa_1.default)(cmd, args, { stdio: 'pipe' });
            const elapsed = Date.now() - start;
            sp.succeed(`Build complete`);
            return elapsed;
        }
        catch (err) {
            const execaErr = err;
            const output = `${execaErr.stderr ?? ''} ${execaErr.stdout ?? ''}`;
            const isHeapError = output.includes('heap out of memory') || output.includes('JavaScript heap');
            if (isHeapError) {
                sp.text = 'Heap error detected — retrying with increased memory...';
                try {
                    await (0, execa_1.default)(cmd, args, {
                        stdio: 'pipe',
                        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
                    });
                    const elapsed = Date.now() - start;
                    sp.succeed('Build complete (with increased memory)');
                    return elapsed;
                }
                catch (retryErr) {
                    sp.fail('Build failed even with increased memory');
                    const retryExecaErr = retryErr;
                    if (retryExecaErr.stderr)
                        logger_js_1.log.error(retryExecaErr.stderr);
                    if (retryExecaErr.stdout)
                        logger_js_1.log.dim(retryExecaErr.stdout);
                    throw new Error('Build failed — aborting deployment');
                }
            }
            sp.fail('Build failed');
            if (execaErr.stderr)
                logger_js_1.log.error(execaErr.stderr);
            if (execaErr.stdout)
                logger_js_1.log.dim(execaErr.stdout);
            throw new Error('Build failed — aborting deployment');
        }
    }
    buildOutputExists() {
        return fs.existsSync(this.config.buildOutput);
    }
}
exports.BuildService = BuildService;
//# sourceMappingURL=BuildService.js.map