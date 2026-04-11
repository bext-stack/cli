# @bext-stack/cli

Thin npm wrapper around the [`bext`](https://github.com/bext-stack/bext) CLI binary. Downloads the right native binary for your platform on install.

## Install

```sh
npm i -g @bext-stack/cli
# or one-shot
npx @bext-stack/cli --help
```

## Usage

```sh
bext run          # auto-detect framework, build, serve
bext dev          # dev mode with file watching
bext build        # build the SSR bundle for production
bext deploy       # build + swap
bext cache purge  # purge the cache
bext health       # platform health check
```

See `bext --help` for the full command list.

## How it works

On install, `scripts/postinstall.js` downloads the right `bext` binary for your platform from [GitHub releases](https://github.com/bext-stack/bext/releases) and places it at `packages/cli/vendor/bext`. The `bin/bext.js` shim then execs that binary.

### Supported platforms

- `linux-x64`, `linux-arm64`
- `darwin-x64`, `darwin-arm64`
- `win32-x64`

### Overrides

- `BEXT_CLI_SKIP_DOWNLOAD=1` — skip the binary download (useful in CI images that already have `bext` on `PATH`).
- `BEXT_CLI_BINARY=/path/to/bext` — use a local binary instead of downloading.

## Alternatives

If you'd rather not use npm, install directly:

```sh
curl -fsSL https://bext.dev/install | sh
```

## License

MIT — Part of the [bext](https://github.com/bext-stack/bext) stack.
