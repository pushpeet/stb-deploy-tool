import { Ora } from 'ora';
export declare const log: {
    info: (msg: string) => void;
    success: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
    dim: (msg: string) => void;
    blank: () => void;
};
export declare function spinner(text: string): Ora;
export declare function formatMs(ms: number): string;
export declare function printTimings(label: string, ms: number): void;
//# sourceMappingURL=logger.d.ts.map