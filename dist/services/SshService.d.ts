import { StbConfig } from '../types/index.js';
export declare class SshService {
    private readonly config;
    constructor(config: StbConfig);
    private get hasPassword();
    private sshArgs;
    private withPass;
    isConnected(): Promise<boolean>;
    exec(command: string): Promise<string>;
    execTimed(command: string): Promise<{
        stdout: string;
        elapsedMs: number;
    }>;
    openShell(): void;
    streamLogs(): Promise<void>;
    restartService(): Promise<number>;
    serviceStatus(): Promise<string>;
    checkRemotePath(): Promise<boolean>;
    checkRemoteWritable(): Promise<boolean>;
    buildSshCommand(): string;
}
//# sourceMappingURL=SshService.d.ts.map