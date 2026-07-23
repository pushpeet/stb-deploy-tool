import * as net from "net";
import * as os from "os";
import { execSync } from "child_process";
import execa from "execa";
import { StbConfig } from "../types/index.js";

export interface DiscoveredDevice {
  ip: string;
  hostname: string;
  verified: boolean;
}

const CONCURRENCY = 30;
const TCP_TIMEOUT_MS = 800;

// ── Network helpers ──────────────────────────────────────────────────────────

export function getLocalSubnet(): { hostIp: string; subnet: string } | null {
  const ifaces = os.networkInterfaces();
  for (const iface of Object.values(ifaces)) {
    for (const addr of iface ?? []) {
      if (addr.family === "IPv4" && !addr.internal) {
        const parts = addr.address.split(".");
        return {
          hostIp: addr.address,
          subnet: `${parts[0]}.${parts[1]}.${parts[2]}`,
        };
      }
    }
  }
  return null;
}

function subnetIps(subnet: string): string[] {
  return Array.from({ length: 254 }, (_, i) => `${subnet}.${i + 1}`);
}

// ── Step 1: ARP table ────────────────────────────────────────────────────────

function getArpIps(subnet: string): string[] {
  try {
    const out = execSync("arp -a 2>/dev/null || ip neigh 2>/dev/null", {
      encoding: "utf8",
    });
    const regex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
    const matches = out.match(regex) ?? [];
    return [...new Set(matches.filter((ip) => ip.startsWith(subnet)))];
  } catch {
    return [];
  }
}

// ── Step 2: TCP probe on port 3333 ───────────────────────────────────────────

function tcpProbe(ip: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (result: boolean) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(TCP_TIMEOUT_MS);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
    socket.connect(port, ip);
  });
}

async function scanIps(
  ips: string[],
  port: number,
  onProgress: (done: number, total: number) => void,
): Promise<string[]> {
  const open: string[] = [];
  let done = 0;

  // Process in batches of CONCURRENCY
  for (let i = 0; i < ips.length; i += CONCURRENCY) {
    const batch = ips.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (ip) => {
        const isOpen = await tcpProbe(ip, port);
        done++;
        onProgress(done, ips.length);
        return isOpen ? ip : null;
      }),
    );
    open.push(...results.filter((ip): ip is string => ip !== null));
  }

  return open;
}

// ── Step 3: SSH verification ─────────────────────────────────────────────────

async function verifyStb(
  ip: string,
  config: Partial<StbConfig>,
): Promise<{ hostname: string; verified: boolean }> {
  const port = config.port ?? 3333;
  const user = config.user ?? "root";
  const password = config.password ?? "";
  const hasPassword = password !== "";

  const sshArgs = [
    "-p",
    String(port),
    "-o",
    "ConnectTimeout=4",
    "-o",
    "StrictHostKeyChecking=no",
    "-o",
    "PasswordAuthentication=yes",
    "-o",
    "BatchMode=no",
    `${user}@${ip}`,
    "hostname",
  ];

  try {
    let result;
    if (hasPassword) {
      result = await execa("sshpass", ["-p", password, "ssh", ...sshArgs], {
        timeout: 6000,
      });
    } else {
      result = await execa("ssh", sshArgs, { timeout: 6000 });
    }
    return { hostname: result.stdout.trim(), verified: true };
  } catch {
    return { hostname: "", verified: false };
  }
}

// ── Main discovery ────────────────────────────────────────────────────────────

export class DiscoverService {
  constructor(private readonly config: Partial<StbConfig>) {}

  async discover(
    onStatus: (msg: string) => void,
    onProgress: (done: number, total: number) => void,
  ): Promise<DiscoveredDevice[]> {
    const net = getLocalSubnet();
    if (!net) throw new Error("Could not detect local network interface.");

    onStatus(`Network: ${net.subnet}.0/24`);

    // Step 1 — try ARP first (fast)
    let candidates = getArpIps(net.subnet);
    let usedArp = candidates.length > 0;

    if (!usedArp) {
      // Step 2 — full subnet scan
      onStatus("ARP table empty — scanning subnet...");
      candidates = subnetIps(net.subnet);
    } else {
      onStatus(
        `ARP table found ${candidates.length} hosts — probing port ${this.config.port ?? 3333}...`,
      );
    }

    // Step 3 — TCP probe port 3333
    const openHosts = await scanIps(
      candidates,
      this.config.port ?? 3333,
      onProgress,
    );

    if (openHosts.length === 0 && usedArp) {
      // ARP gave no results on port 3333 — fall back to full scan
      onStatus("No results from ARP — falling back to full subnet scan...");
      const allIps = subnetIps(net.subnet);
      const fallback = await scanIps(
        allIps,
        this.config.port ?? 3333,
        onProgress,
      );
      openHosts.push(...fallback);
    }

    if (openHosts.length === 0) return [];

    // Step 4 — SSH verify each candidate concurrently
    onStatus(`Verifying ${openHosts.length} candidate(s) via SSH...`);
    const verified = await Promise.all(
      openHosts.map(async (ip) => {
        const { hostname, verified } = await verifyStb(ip, this.config);
        return { ip, hostname, verified };
      }),
    );

    return verified;
  }
}
