import { StbConfig } from '../types/index.js';
export declare class DeployService {
    private readonly config;
    constructor(config: StbConfig);
    private cleanRemote;
    upload(): Promise<number>;
}
//# sourceMappingURL=DeployService.d.ts.map