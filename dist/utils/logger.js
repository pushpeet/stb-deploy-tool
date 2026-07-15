"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
exports.spinner = spinner;
exports.formatMs = formatMs;
exports.printTimings = printTimings;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
exports.log = {
    info: (msg) => console.log(chalk_1.default.cyan('ℹ'), msg),
    success: (msg) => console.log(chalk_1.default.green('✔'), msg),
    warn: (msg) => console.log(chalk_1.default.yellow('⚠'), msg),
    error: (msg) => console.log(chalk_1.default.red('✖'), msg),
    dim: (msg) => console.log(chalk_1.default.dim(msg)),
    blank: () => console.log(),
};
function spinner(text) {
    return (0, ora_1.default)({ text, color: 'cyan' });
}
function formatMs(ms) {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}
function printTimings(label, ms) {
    exports.log.dim(`  ${label}: ${formatMs(ms)}`);
}
//# sourceMappingURL=logger.js.map