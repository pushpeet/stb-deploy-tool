# stb-deploy-tool

Production-quality CLI for Smart TV / STB development with Lightning (`lng`) projects.

Automates the full deploy cycle: **clean → build → upload → restart**.

---

## Installation

### From npm

```bash
npm install -g stb-deploy-tool
```

### From source

```bash
git clone https://github.com/your-org/stb-deploy-tool.git
cd stb-deploy-tool
npm install
npm run build
npm link
```

---

## Quick Start

```bash
cd your-lng-project
stb init          # Enter your STB IP once
stb deploy        # Full deploy
```

---

## Commands

| Command          | Description                                      |
|------------------|--------------------------------------------------|
| `stb init`       | Initialize config — asks for STB host/IP         |
| `stb host`       | Show or interactively update the STB host        |
| `stb host <ip>`  | Directly set the STB host                        |
| `stb deploy`     | Clean → build → upload → restart                 |
| `stb sync`       | Upload existing build only (no build/restart)    |
| `stb restart`    | Restart `residentapp` on the STB                 |
| `stb ssh`        | Open an interactive SSH session                  |
| `stb logs`       | Stream `journalctl -f` from the STB              |
| `stb status`     | Show host, connectivity, paths, and service info |
| `stb doctor`     | Run all health checks                            |
| `stb watch`      | Watch source files and auto-deploy on change     |

---

## Defaults

| Setting        | Default                  |
|----------------|--------------------------|
| User           | `root`                   |
| Port           | `3333`                   |
| Build Command  | `lng dev`                |
| Build Output   | `dist/es6`               |
| Remote Path    | `/usr/web/irdeto_app`    |
| Service        | `residentapp`            |

Config is stored in `.stb/config.yml` in your project root.

---

## Watch Mode

`stb watch` monitors your `src/` and `static/` directories.

- 800ms debounce — only one deploy after rapid saves
- Never runs two deployments simultaneously
- Queues exactly one additional deploy if a save occurs mid-deploy

```bash
stb watch
# ℹ Watching for changes... (Ctrl+C to stop)
#   Debounce: 800ms
#   Target:   192.168.1.100
```

---

## Deployment

Uses `rsync --delete` by default for fast, incremental uploads.  
Automatically falls back to `scp` if `rsync` is not available.

---

## Architecture

```
src/
├── cli.ts                  # Commander.js entry point
├── types/
│   └── index.ts            # Shared interfaces and defaults
├── utils/
│   ├── config.ts           # YAML config read/write
│   └── logger.ts           # Chalk + Ora helpers
├── services/
│   ├── BuildService.ts     # Clean + build logic
│   ├── DeployService.ts    # rsync / scp upload
│   └── SshService.ts       # SSH exec, shell, logs
└── commands/
    ├── init.ts
    ├── host.ts
    ├── deploy.ts
    ├── sync.ts
    ├── restart.ts
    ├── ssh.ts
    ├── logs.ts
    ├── status.ts
    ├── doctor.ts
    └── watch.ts
```

**Principles:**
- Commands only orchestrate services — no business logic
- Services are single-responsibility and independently testable
- All config flows through `utils/config.ts`

---

## Troubleshooting

**`No config found. Run 'stb init' first.`**  
Run `stb init` from your project root.

**SSH connection fails**  
- Verify the STB is powered on and on the same network
- Run `stb doctor` to diagnose
- Try: `ssh -p 3333 root@<your-ip>`

**Build fails**  
- Ensure `lng` is installed: `npm install -g @lightningjs/cli`
- Check your `lng.config.js` is valid

**rsync not found**  
- Install rsync: `brew install rsync` (macOS) or `apt install rsync`
- Or let the tool fall back to `scp` automatically

**Permission denied on remote path**  
- Verify the user has write access: `stb doctor`
- The remote path `/usr/web/irdeto_app` must exist on the STB

---

## Roadmap

- `stb screenshot` — Capture STB screen via SSH
- `stb reboot` — Reboot the STB
- `stb rollback` — Roll back to previous deployment
- `stb profiles` — Manage multiple STB targets
- `stb update` — Self-update the CLI tool
