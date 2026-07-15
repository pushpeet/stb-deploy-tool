import { StbConfig } from '../types/index.js';
export declare function configExists(): boolean;
export declare function readConfig(): StbConfig;
export declare function writeConfig(config: StbConfig): void;
export declare function updateConfig(partial: Partial<StbConfig>): StbConfig;
export declare function getConfigPath(): string;
//# sourceMappingURL=config.d.ts.map