import { StbConfig } from '../types/index.js';
export interface DiscoveredDevice {
    ip: string;
    hostname: string;
    verified: boolean;
}
export declare function getLocalSubnet(): {
    hostIp: string;
    subnet: string;
} | null;
export declare class DiscoverService {
    private readonly config;
    constructor(config: Partial<StbConfig>);
    discover(onStatus: (msg: string) => void, onProgress: (done: number, total: number) => void): Promise<DiscoveredDevice[]>;
}
//# sourceMappingURL=DiscoverService.d.ts.map