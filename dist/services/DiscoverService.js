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
exports.DiscoverService = void 0;
exports.getLocalSubnet = getLocalSubnet;
const net = __importStar(require("net"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const execa_1 = __importDefault(require("execa"));
const CONCURRENCY = 30;
const TCP_TIMEOUT_MS = 800;
// ── Network helpers ──────────────────────────────────────────────────────────
function getLocalSubnet() {
    const ifaces = os.networkInterfaces();
    for (const iface of Object.values(ifaces)) {
        for (const addr of iface ?? []) {
            if (addr.family === 'IPv4' && !addr.internal) {
                const parts = addr.address.split('.');
                return {
                    hostIp: addr.address,
                    subnet: `${parts[0]}.${parts[1]}.${parts[2]}`,
                };
            }
        }
    }
    return null;
}
function subnetIps(subnet) {
    return Array.from({ length: 254 }, (_, i) => `${subnet}.${i + 1}`);
}
// ── Step 1: ARP table ────────────────────────────────────────────────────────
function getArpIps(subnet) {
    try {
        const out = (0, child_process_1.execSync)('arp -a 2>/dev/null || ip neigh 2>/dev/null', { encoding: 'utf8' });
        const regex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
        const matches = out.match(regex) ?? [];
        return [...new Set(matches.filter((ip) => ip.startsWith(subnet)))];
    }
    catch {
        return [];
    }
}
// ── Step 2: TCP probe on port 3333 ───────────────────────────────────────────
function tcpProbe(ip, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        const done = (result) => {
            socket.destroy();
            resolve(result);
        };
        socket.setTimeout(TCP_TIMEOUT_MS);
        socket.on('connect', () => done(true));
        socket.on('timeout', () => done(false));
        socket.on('error', () => done(false));
        socket.connect(port, ip);
    });
}
async function scanIps(ips, port, onProgress) {
    const open = [];
    let done = 0;
    // Process in batches of CONCURRENCY
    for (let i = 0; i < ips.length; i += CONCURRENCY) {
        const batch = ips.slice(i, i + CONCURRENCY);
        const results = await Promise.all(batch.map(async (ip) => {
            const isOpen = await tcpProbe(ip, port);
            done++;
            onProgress(done, ips.length);
            return isOpen ? ip : null;
        }));
        open.push(...results.filter((ip) => ip !== null));
    }
    return open;
}
// ── Step 3: SSH verification ─────────────────────────────────────────────────
async function verifyStb(ip, config) {
    const port = config.port ?? 3333;
    const user = config.user ?? 'root';
    const password = config.password ?? '';
    const hasPassword = password !== '';
    const sshArgs = [
        '-p', String(port),
        '-o', 'ConnectTimeout=4',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'PasswordAuthentication=yes',
        '-o', 'BatchMode=no',
        `${user}@${ip}`,
        'hostname',
    ];
    try {
        let result;
        if (hasPassword) {
            result = await (0, execa_1.default)('sshpass', ['-p', password, 'ssh', ...sshArgs], { timeout: 6000 });
        }
        else {
            result = await (0, execa_1.default)('ssh', sshArgs, { timeout: 6000 });
        }
        return { hostname: result.stdout.trim() || ip, verified: true };
    }
    catch {
        return { hostname: ip, verified: false };
    }
}
// ── Main discovery ────────────────────────────────────────────────────────────
class DiscoverService {
    constructor(config) {
        this.config = config;
    }
    async discover(onStatus, onProgress) {
        const net = getLocalSubnet();
        if (!net)
            throw new Error('Could not detect local network interface.');
        onStatus(`Network: ${net.subnet}.0/24`);
        // Step 1 — try ARP first (fast)
        let candidates = getArpIps(net.subnet);
        let usedArp = candidates.length > 0;
        if (!usedArp) {
            // Step 2 — full subnet scan
            onStatus('ARP table empty — scanning subnet...');
            candidates = subnetIps(net.subnet);
        }
        else {
            onStatus(`ARP table found ${candidates.length} hosts — probing port ${this.config.port ?? 3333}...`);
        }
        // Step 3 — TCP probe port 3333
        const openHosts = await scanIps(candidates, this.config.port ?? 3333, onProgress);
        if (openHosts.length === 0 && usedArp) {
            // ARP gave no results on port 3333 — fall back to full scan
            onStatus('No results from ARP — falling back to full subnet scan...');
            const allIps = subnetIps(net.subnet);
            const fallback = await scanIps(allIps, this.config.port ?? 3333, onProgress);
            openHosts.push(...fallback);
        }
        if (openHosts.length === 0)
            return [];
        // Step 4 — SSH verify each candidate concurrently
        onStatus(`Verifying ${openHosts.length} candidate(s) via SSH...`);
        const verified = await Promise.all(openHosts.map(async (ip) => {
            const { hostname, verified } = await verifyStb(ip, this.config);
            return { ip, hostname, verified };
        }));
        return verified;
    }
}
exports.DiscoverService = DiscoverService;
//# sourceMappingURL=DiscoverService.js.map