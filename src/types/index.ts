export interface StbConfig {
  host: string;
  user: string;
  port: number;
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

export const DEFAULTS: Omit<StbConfig, 'host'> = {
  user: 'root',
  port: 3333,
  buildCommand: 'lng dev',
  buildOutput: 'dist/es6',
  remotePath: '/usr/web/irdeto_app',
  service: 'residentapp',
};
