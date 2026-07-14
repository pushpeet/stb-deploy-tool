import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { StbConfig, DEFAULTS } from '../types/index.js';

const CONFIG_DIR = '.stb';
const CONFIG_FILE = 'config.yml';

function configPath(): string {
  return path.join(process.cwd(), CONFIG_DIR, CONFIG_FILE);
}

export function configExists(): boolean {
  return fs.existsSync(configPath());
}

export function readConfig(): StbConfig {
  const filePath = configPath();
  if (!fs.existsSync(filePath)) {
    throw new Error(`No config found. Run 'stb init' first.`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = yaml.load(raw) as Partial<StbConfig>;
  return { ...DEFAULTS, ...parsed } as StbConfig;
}

export function writeConfig(config: StbConfig): void {
  const filePath = configPath();
  fs.ensureDirSync(path.dirname(filePath));
  fs.writeFileSync(filePath, yaml.dump(config), 'utf8');
}

export function updateConfig(partial: Partial<StbConfig>): StbConfig {
  const current = readConfig();
  const updated = { ...current, ...partial };
  writeConfig(updated);
  return updated;
}

export function getConfigPath(): string {
  return path.relative(process.cwd(), configPath());
}
