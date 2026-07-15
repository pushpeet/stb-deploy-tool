export interface StbConfig {
    host: string;
    user: string;
    port: number;
    password: string;
    buildCommand: string;
    buildOutput: string;
    remotePath: string;
    service: string;
}
export interface DeployOptions {
    skipBuild?: boolean;
    skipRestart?: boolean;
}
export interface TimingResult {
    buildMs?: number;
    uploadMs?: number;
    restartMs?: number;
    totalMs: number;
}
export interface DoctorCheck {
    name: string;
    status: 'ok' | 'warn' | 'fail';
    message: string;
}
export declare const DEFAULTS: Omit<StbConfig, 'host'>;
//# sourceMappingURL=index.d.ts.map