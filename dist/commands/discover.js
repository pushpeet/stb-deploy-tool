"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverCommand = discoverCommand;
const chalk_1 = __importDefault(require("chalk"));
const prompts_1 = __importDefault(require("prompts"));
const DiscoverService_js_1 = require("../services/DiscoverService.js");
const config_js_1 = require("../utils/config.js");
const index_js_1 = require("../types/index.js");
const logger_js_1 = require("../utils/logger.js");
const BAR_WIDTH = 30;
function renderBar(done, total) {
    const pct = total > 0 ? Math.min(1, done / total) : 0;
    const filled = Math.round(BAR_WIDTH * pct);
    const empty = BAR_WIDTH - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${Math.round(pct * 100)}%`;
}
async function discoverCommand() {
    logger_js_1.log.blank();
    logger_js_1.log.info("Detecting network...");
    logger_js_1.log.blank();
    const net = (0, DiscoverService_js_1.getLocalSubnet)();
    if (!net) {
        logger_js_1.log.error("Could not detect local network. Are you connected to Wi-Fi or LAN?");
        process.exit(1);
    }
    // Use existing config credentials if available, otherwise use defaults
    const config = (0, config_js_1.configExists)() ? (0, config_js_1.readConfig)() : { ...index_js_1.DEFAULTS, host: "" };
    const service = new DiscoverService_js_1.DiscoverService(config);
    let lastBar = "";
    const onStatus = (msg) => {
        process.stdout.write(`\r\x1b[K`);
        logger_js_1.log.dim(`  ${msg}`);
    };
    const onProgress = (done, total) => {
        const bar = renderBar(done, total);
        if (bar !== lastBar) {
            process.stdout.write(`\r  ${bar}`);
            lastBar = bar;
        }
    };
    logger_js_1.log.info("Scanning...");
    logger_js_1.log.blank();
    const devices = await service.discover(onStatus, onProgress);
    // Clear progress bar line
    process.stdout.write(`\r\x1b[K`);
    logger_js_1.log.blank();
    if (devices.length === 0) {
        logger_js_1.log.error("No STBs were found on the local network.");
        logger_js_1.log.blank();
        logger_js_1.log.dim("  Please ensure:");
        logger_js_1.log.dim("  • STB is powered on");
        logger_js_1.log.dim("  • STB is connected to the same Wi-Fi/LAN");
        logger_js_1.log.dim(`  • SSH is enabled on port ${config.port}`);
        logger_js_1.log.blank();
        process.exit(1);
    }
    logger_js_1.log.success(chalk_1.default.bold(`Found ${devices.length} STB${devices.length > 1 ? "s" : ""}`));
    logger_js_1.log.blank();
    // Display all found devices
    devices.forEach((device, i) => {
        const name = device.hostname && device.hostname !== device.ip
            ? device.hostname
            : chalk_1.default.dim("Unknown");
        console.log(`  ${chalk_1.default.bold(`${i + 1})`)} `);
        console.log(`     Name : ${chalk_1.default.cyan(name)}`);
        console.log(`     IP   : ${chalk_1.default.cyan(device.ip)}`);
        console.log(`     SSH  : ${device.verified ? chalk_1.default.green("Verified") : chalk_1.default.yellow("Unverified (port open)")}`);
        logger_js_1.log.blank();
    });
    let selectedIp;
    if (devices.length === 1) {
        // Single device — ask to confirm
        const { use } = await (0, prompts_1.default)({
            type: "confirm",
            name: "use",
            message: `Use ${chalk_1.default.bold(devices[0].ip)} as default STB?`,
            initial: true,
        });
        if (!use) {
            logger_js_1.log.info("Aborted.");
            return;
        }
        selectedIp = devices[0].ip;
    }
    else {
        // Multiple devices — prompt selection
        const { index } = await (0, prompts_1.default)({
            type: "select",
            name: "index",
            message: "Select a device:",
            choices: devices.map((d, i) => ({
                title: `${d.ip}  ${chalk_1.default.dim(d.hostname && d.hostname !== d.ip ? d.hostname : "Unknown")}  ${d.verified ? chalk_1.default.green("✔ SSH") : chalk_1.default.yellow("⚠ unverified")}`,
                value: i,
            })),
        });
        if (index === undefined) {
            logger_js_1.log.info("Aborted.");
            return;
        }
        selectedIp = devices[index].ip;
    }
    // Save to config
    if ((0, config_js_1.configExists)()) {
        (0, config_js_1.updateConfig)({ host: selectedIp });
    }
    else {
        (0, config_js_1.writeConfig)({ ...index_js_1.DEFAULTS, host: selectedIp });
    }
    logger_js_1.log.blank();
    logger_js_1.log.success(chalk_1.default.bold("Default STB saved."));
    logger_js_1.log.blank();
    logger_js_1.log.dim(`  Future deploy commands will use ${chalk_1.default.cyan(selectedIp)}`);
    logger_js_1.log.blank();
}
//# sourceMappingURL=discover.js.map