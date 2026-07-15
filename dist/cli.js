#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const init_js_1 = require("./commands/init.js");
const host_js_1 = require("./commands/host.js");
const deploy_js_1 = require("./commands/deploy.js");
const sync_js_1 = require("./commands/sync.js");
const restart_js_1 = require("./commands/restart.js");
const ssh_js_1 = require("./commands/ssh.js");
const logs_js_1 = require("./commands/logs.js");
const status_js_1 = require("./commands/status.js");
const doctor_js_1 = require("./commands/doctor.js");
const watch_js_1 = require("./commands/watch.js");
const program = new commander_1.Command();
program
    .name('stb')
    .description('Smart TV/STB deployment CLI for Lightning (lng) projects')
    .version('1.0.0');
program
    .command('init')
    .description('Initialize STB config (asks for host/IP)')
    .action(wrap(init_js_1.initCommand));
program
    .command('host [ip]')
    .description('Show or update the STB host/IP')
    .action((ip) => wrap(() => (0, host_js_1.hostCommand)(ip))());
program
    .command('deploy')
    .description('Clean, build, upload, and restart service')
    .action(wrap(deploy_js_1.deployCommand));
program
    .command('sync')
    .description('Upload existing build without rebuilding or restarting')
    .action(wrap(sync_js_1.syncCommand));
program
    .command('restart')
    .description('Restart the residentapp service on STB')
    .action(wrap(restart_js_1.restartCommand));
program
    .command('ssh')
    .description('Open an interactive SSH session to the STB')
    .action(() => {
    try {
        (0, ssh_js_1.sshCommand)();
    }
    catch (err) {
        handleError(err);
    }
});
program
    .command('logs')
    .description('Stream journalctl logs from the STB')
    .action(wrap(logs_js_1.logsCommand));
program
    .command('status')
    .description('Show STB connection and project status')
    .action(wrap(status_js_1.statusCommand));
program
    .command('doctor')
    .description('Run health checks on your STB setup')
    .action(wrap(doctor_js_1.doctorCommand));
program
    .command('watch')
    .description('Watch source files and auto-deploy on changes')
    .action(wrap(watch_js_1.watchCommand));
program.parse(process.argv);
function wrap(fn) {
    return () => {
        fn().catch(handleError);
    };
}
function handleError(err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(chalk_1.default.red('✖'), message);
    process.exit(1);
}
//# sourceMappingURL=cli.js.map