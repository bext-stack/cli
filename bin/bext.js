#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const binaryPath = path.join(__dirname, "..", "vendor", process.platform === "win32" ? "bext.exe" : "bext");

if (!existsSync(binaryPath)) {
  console.error("[@bext-stack/cli] bext binary not found at " + binaryPath);
  console.error("[@bext-stack/cli] The postinstall step may have failed. Run:");
  console.error("    node " + path.join(__dirname, "..", "scripts", "postinstall.js"));
  console.error("[@bext-stack/cli] Or install manually:");
  console.error("    curl -fsSL https://bext.dev/install | sh");
  process.exit(1);
}

const result = spawnSync(binaryPath, process.argv.slice(2), { stdio: "inherit" });
process.exit(result.status ?? 1);
