#!/usr/bin/env node
"use strict";

// Runs automatically after `npm install` (postinstall).
// Only checks for required system tools and prints guidance.
// It NEVER fails the install (always exits 0), so a missing tool
// or any unexpected error cannot break `npm install`.

const { execSync } = require("child_process");

function has(bin) {
  try {
    execSync(`command -v ${bin}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

try {
  const isMac = process.platform === "darwin";

  const checks = [
    {
      bin: "ssh",
      required: true,
      hint: "Preinstalled on macOS. If missing run: xcode-select --install",
    },
    {
      bin: "scp",
      required: true,
      hint: "Preinstalled on macOS. If missing run: xcode-select --install",
    },
    {
      bin: "rsync",
      required: false,
      hint: isMac
        ? "Optional (stb falls back to scp). Install: brew install rsync"
        : "Optional (stb falls back to scp).",
    },
    {
      bin: "sshpass",
      required: false,
      hint: isMac
        ? "Needed for password auth. Install: brew install hudochenkov/sshpass/sshpass"
        : "Needed for password auth. Install sshpass via your package manager.",
    },
  ].map((c) => ({ ...c, ok: has(c.bin) }));

  console.log("\n[stb] Checking required system tools:");
  for (const c of checks) {
    const label = c.ok
      ? "OK"
      : c.required
        ? "MISSING (required)"
        : "missing (optional)";
    console.log(`  - ${c.bin.padEnd(8)} ${label}`);
    if (!c.ok) console.log(`      -> ${c.hint}`);
  }

  const missingRequired = checks.filter((c) => c.required && !c.ok);
  const missingOptional = checks.filter((c) => !c.required && !c.ok);

  if (missingRequired.length) {
    console.log(
      "\n[stb] Some REQUIRED tools are missing. Install them before using stb.",
    );
  } else if (missingOptional.length) {
    console.log(
      "\n[stb] Optional tools missing — install them if you need password auth (sshpass) or rsync.",
    );
  } else {
    console.log("\n[stb] All required tools found.");
  }
  console.log(
    "[stb] After configuring your STB, run `stb doctor` to verify connectivity.\n",
  );
} catch {
  // Never fail the install because of this checker.
}

process.exit(0);
