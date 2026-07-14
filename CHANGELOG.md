# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-14

### Added
- `stb init` — interactive config initialisation (host/IP prompt)
- `stb host [ip]` — show or update the STB host
- `stb deploy` — full cycle: clean → build → upload → restart
- `stb sync` — upload existing build without rebuilding or restarting
- `stb restart` — restart `residentapp` service via SSH
- `stb ssh` — open an interactive SSH shell to the STB
- `stb logs` — stream `journalctl -f` from the STB
- `stb status` — display host, connectivity, paths, and service info
- `stb doctor` — run all health checks (SSH, build tool, remote path, service, rsync)
- `stb watch` — watch `src/` and `static/` with 800 ms debounce, auto-deploy on change
- `rsync --delete` upload with automatic `scp` fallback
- YAML config stored in `.stb/config.yml`
- Timing output for build, upload, and restart phases
