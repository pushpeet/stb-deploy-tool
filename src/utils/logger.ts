import chalk from 'chalk';
import ora, { Ora } from 'ora';

export const log = {
  info: (msg: string) => console.log(chalk.cyan('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✔'), msg),
  warn: (msg: string) => console.log(chalk.yellow('⚠'), msg),
  error: (msg: string) => console.log(chalk.red('✖'), msg),
  dim: (msg: string) => console.log(chalk.dim(msg)),
  blank: () => console.log(),
};

export function spinner(text: string): Ora {
  return ora({ text, color: 'cyan' });
}

export function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export function printTimings(label: string, ms: number): void {
  log.dim(`  ${label}: ${formatMs(ms)}`);
}
