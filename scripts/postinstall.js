#!/usr/bin/env node
// Downloads the bext binary for the current platform from GitHub releases
// and places it at packages/cli/vendor/bext. Runs automatically on `npm install`.
//
// Release asset naming: bext-<version>-<platform>-<arch>[.exe]
//   e.g. bext-0.2.0-linux-x64, bext-0.2.0-darwin-arm64, bext-0.2.0-win32-x64.exe
//
// Environment overrides:
//   BEXT_CLI_SKIP_DOWNLOAD=1       Skip the download entirely (useful for CI)
//   BEXT_CLI_BINARY=/path/to/bext  Use a local binary instead of downloading

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const { pipeline } = require("node:stream/promises");

const pkg = require("../package.json");
const VERSION = pkg.version;
const REPO = "bext-stack/bext";

const PLATFORM_MAP = {
  "linux:x64": "linux-x64",
  "linux:arm64": "linux-arm64",
  "darwin:x64": "darwin-x64",
  "darwin:arm64": "darwin-arm64",
  "win32:x64": "win32-x64",
};

async function main() {
  if (process.env.BEXT_CLI_SKIP_DOWNLOAD === "1") {
    log("BEXT_CLI_SKIP_DOWNLOAD=1, skipping binary download.");
    return;
  }

  const key = `${process.platform}:${process.arch}`;
  const target = PLATFORM_MAP[key];
  if (!target) {
    log(`Unsupported platform ${key}. Falling back to manual install.`);
    log(`Run: curl -fsSL https://bext.dev/install | sh`);
    return;
  }

  const vendorDir = path.join(__dirname, "..", "vendor");
  fs.mkdirSync(vendorDir, { recursive: true });

  const binaryName = process.platform === "win32" ? "bext.exe" : "bext";
  const destPath = path.join(vendorDir, binaryName);

  if (process.env.BEXT_CLI_BINARY) {
    const src = process.env.BEXT_CLI_BINARY;
    if (!fs.existsSync(src)) {
      log(`BEXT_CLI_BINARY=${src} does not exist.`);
      process.exit(0);
    }
    fs.copyFileSync(src, destPath);
    fs.chmodSync(destPath, 0o755);
    log(`Copied local binary from ${src}`);
    return;
  }

  const assetName = `bext-${VERSION}-${target}${process.platform === "win32" ? ".exe" : ""}`;
  const url = `https://github.com/${REPO}/releases/download/v${VERSION}/${assetName}`;

  log(`Downloading ${assetName} from ${url}`);

  try {
    await download(url, destPath);
    fs.chmodSync(destPath, 0o755);
    log(`Installed bext binary at ${destPath}`);
  } catch (err) {
    log(`Download failed: ${err.message}`);
    log(`You can install bext manually:`);
    log(`  curl -fsSL https://bext.dev/install | sh`);
    // Exit 0 so npm install doesn't fail — the bin/bext.js shim will report
    // the missing binary with actionable instructions if invoked.
    process.exit(0);
  }
}

function download(url, destPath, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error("Too many redirects"));
    https
      .get(url, { headers: { "User-Agent": `@bext-stack/cli ${VERSION}` } }, async (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          res.resume();
          return resolve(download(res.headers.location, destPath, redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        try {
          await pipeline(res, fs.createWriteStream(destPath));
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on("error", reject);
  });
}

function log(msg) {
  console.log(`[@bext-stack/cli] ${msg}`);
}

main().catch((err) => {
  log(`postinstall error: ${err.message}`);
  process.exit(0);
});
