import { StbConfig } from "../types/index.js";
export declare class BuildService {
    private readonly config;
    constructor(config: StbConfig);
    clean(): Promise<void>;
    build(): Promise<number>;
    buildOutputExists(): boolean;
}
//# sourceMappingURL=BuildService.d.ts.map