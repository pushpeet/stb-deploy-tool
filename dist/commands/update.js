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
exports.updateCommand = updateCommand;
const chalk_1 = __importDefault(require("chalk"));
const execa_1 = __importDefault(require("execa"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_js_1 = require("../utils/logger.js");
function loadPkg() {
    const pkgPath = path.join(__dirname, "..", "..", "package.json");
    return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
}
function normalizeRepoUrl(repo) {
    let url = typeof repo === "string" ? repo : (repo?.url ?? "");
    url = url.replace(/^git\+/, "");
    if (!url)
        throw new Error("Repository URL not found in package.json");
    return url;
}
function parseSemver(tag) {
    const m = tag.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
    if (!m)
        return null;
    return [Number(m[1]), Number(m[2]), Number(m[3])];
}
function compareSemver(a, b) {
    for (let i = 0; i < 3; i++) {
        if (a[i] !== b[i])
            return a[i] - b[i];
    }
    return 0;
}
async function latestTag(repoUrl) {
    const { stdout } = await (0, execa_1.default)("git", [
        "ls-remote",
        "--tags",
        "--refs",
        repoUrl,
    ]);
    let best = null;
    for (const line of stdout.split("\n")) {
        const tag = (line.split("/").pop() ?? "").trim();
        const ver = parseSemver(tag);
        if (!ver)
            continue;
        if (!best || compareSemver(ver, best.ver) > 0)
            best = { tag, ver };
    }
    return best?.tag ?? null;
}
async function updateCommand(targetTag) {
    const pkg = loadPkg();
    const current = pkg.version;
    const repoUrl = normalizeRepoUrl(pkg.repository);
    logger_js_1.log.info(`Current version: ${chalk_1.default.bold("v" + current)}`);
    let tag = targetTag;
    if (!tag) {
        const sp = (0, logger_js_1.spinner)("Checking for the latest version...").start();
        try {
            const latest = await latestTag(repoUrl);
            if (!latest) {
                sp.fail("Could not find any version tags on the remote");
                throw new Error("No semver tags found on remote repository");
            }
            tag = latest;
            sp.succeed(`Latest version: ${chalk_1.default.bold(tag)}`);
        }
        catch (err) {
            sp.fail("Failed to check the remote for the latest version");
            throw err;
        }
    }
    const targetVer = parseSemver(tag);
    const currentVer = parseSemver(current);
    if (!targetTag &&
        targetVer &&
        currentVer &&
        compareSemver(targetVer, currentVer) <= 0) {
        logger_js_1.log.success(`Already up to date (v${current}).`);
        return;
    }
    const spec = `git+${repoUrl}#${tag}`;
    logger_js_1.log.info(`Updating to ${chalk_1.default.bold(tag)}...`);
    logger_js_1.log.dim(`  npm install -g ${spec}`);
    logger_js_1.log.blank();
    try {
        await (0, execa_1.default)("npm", ["install", "-g", "--foreground-scripts", spec], {
            stdio: "inherit",
        });
    }
    catch (err) {
        logger_js_1.log.blank();
        logger_js_1.log.error("Update failed. Try clearing the npm cache and retry (do NOT use sudo):");
        logger_js_1.log.dim("  npm cache clean --force");
        logger_js_1.log.dim(`  npm install -g ${spec}`);
        throw err;
    }
    logger_js_1.log.blank();
    logger_js_1.log.success(`Updated to ${tag}. Run ${chalk_1.default.bold("stb --version")} to confirm.`);
}
//# sourceMappingURL=update.js.map