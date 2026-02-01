# apex-gh-workflow-sync

A type-safe, interactive CLI tool built with Deno 2.x to manage GitHub Actions workflows across multiple
repositories.

## Prerequisites

- [Deno](https://deno.land/) 2.x or later
- [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated

## Installation

```bash
cd /home/jagged/work/apex-ehr/tools/apex-gh-workflow-sync
```

## Usage

### Dry Run (Default)

Preview changes without making them:

```bash
deno task start
```

### Apply Changes

```bash
deno task start --no-dry-run
```

### Interactive Mode

Select repositories via checkbox UI:

```bash
deno task start --interactive
```

### Disable Sorting

Use default repo order instead of sorting by commit date:

```bash
deno task start --no-sort
```

### Custom Workflow File

```bash
deno task start --workflow-file ./path/to/workflow.yml
```

If the workflow file is not found, you'll be prompted to enter a path (in interactive mode).

### Verbose Output

```bash
deno task start -v
```

### Show Help

```bash
deno task start --help
```

## Features

- **Multi-Repository Support**: Manages 24 Apex-EHR repositories
- **Branch Coverage**: Checks `dev`, `qa`, `stage`, and `main` branches
- **Smart Sorting**: Repositories sorted by last commit date (oldest first)
- **Interactive Selection**: Beautiful checkbox UI for selecting target repos
- **Auto-Merge**: Creates PRs and auto-merges them with squash
- **Dry-Run Mode**: Preview all changes before applying
- **Graceful Handling**: Skips non-existent branches automatically

## Project Structure

```
apex-gh-workflow-sync/
├── deno.json          # Deno configuration with fmt settings
├── main.ts            # CLI entry point
├── src/
│   ├── config.ts      # Repository list and defaults
│   ├── types.ts       # TypeScript interfaces
│   ├── github.ts      # GitHub CLI wrapper
│   ├── repo-checker.ts # Repository status checking
│   ├── sorter.ts      # Commit date sorting
│   ├── selector.ts    # Interactive UI
│   ├── pr-creator.ts  # PR creation logic
│   ├── logger.ts      # Colored logging
│   ├── workflow-discovery.ts # Workflow file discovery and selection
│   └── __tests__/     # Comprehensive test suite
│       ├── config_test.ts
│       ├── github_test.ts
│       ├── integration_test.ts
│       ├── logger_test.ts
│       ├── pr-creator_test.ts
│       ├── repo-checker_test.ts
│       ├── selector_test.ts
│       ├── sorter_test.ts
│       └── types_test.ts
└── scripts/
    └── compile-current.ts  # OS-detecting compile script
```

## Development

```bash
# Run in watch mode
deno task dev

# Compile to standalone binary (auto-detects current OS/arch)
deno task compile  # Outputs: linux-x64, linux-arm64, windows, macos, or macos-intel

# Cross-platform compilation (for specific targets)
deno task compile:linux        # bin/apex-gh-workflow-sync-linux-x64
deno task compile:linux-arm64  # bin/apex-gh-workflow-sync-linux-arm64
deno task compile:windows      # bin/apex-gh-workflow-sync-windows.exe
deno task compile:macos        # bin/apex-gh-workflow-sync-macos (ARM)
deno task compile:macos-intel  # bin/apex-gh-workflow-sync-macos-intel (macOS only)

# Compile all platforms
deno task compile:all

# Format code (single quotes, no semicolons, 2-space indent)
deno fmt
```

**Note:** Compiled binaries are output to the `bin/` directory. The `compile:macos-intel` target can only be
built on macOS due to a [Deno cross-compilation limitation](https://github.com/denoland/deno/issues/31698).
The `compile:all` task builds Linux, Windows, and macOS ARM binaries.

## Code Style

This project uses Deno's built-in formatter with custom configuration:

- **Single quotes** (no double quotes)
- **No semicolons**
- **2-space indentation**
- **110 character line width**
- **Trailing commas** (only for multi-line)

Configuration in `deno.json`:

```json
{
  "fmt": {
    "semiColons": false,
    "indentWidth": 2,
    "useTabs": false,
    "lineWidth": 110,
    "trailingCommas": "onlyMultiLine",
    "singleQuote": true
  }
}
```

Run `deno fmt` to format all files.

## Testing

Comprehensive test suite covering all modules:

```bash
# Run all tests
deno task test

# Run tests in watch mode
deno task test:watch

# Run tests with coverage report
deno task test:coverage
```

### Test Coverage

- **config_test.ts**: Repository list, branches, default values
- **types_test.ts**: TypeScript interface validation
- **logger_test.ts**: Colored logging output
- **repo-checker_test.ts**: Repository status formatting
- **sorter_test.ts**: Sorting by commit date
- **selector_test.ts**: Interactive selection logic
- **pr-creator_test.ts**: PR creation and merge logic
- **github_test.ts**: GitHub CLI integration
- **integration_test.ts**: End-to-end workflow simulation

## License

MIT
