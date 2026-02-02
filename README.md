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

### Interactive Mode (Default)

Run the CLI with interactive prompts (you'll be asked about dry-run, sorting, repos, etc.):

```bash
deno task start
```

### Non-Interactive Mode (CI/CD)

Skip all prompts and apply changes directly:

```bash
deno task start --non-interactive
```

Preview changes without applying in non-interactive mode:

```bash
deno task start --dry-run --non-interactive
```

### Custom Workflow File

```bash
deno task start --workflow-file ./path/to/workflow.yml
```

If the workflow file is not found, you'll be prompted to enter a path.

### Verbose Output

```bash
deno task start -v
```

### Show Help

```bash
deno task start --help
```

## Workflow

The CLI follows an interactive workflow by default:

1. **Workflow Selection**: Auto-discovers workflow files or prompts for path
2. **Repository Selection**: Fetches your repos from GitHub and presents checkboxes to select
3. **Sorting Prompt**: Choose whether to sort repos by last commit date (defaults to no sorting)
4. **Branch Selection**: Choose which branches to target ⚠️ *applies to ALL repos*
5. **Status Check**: CLI checks all selected repos/branches
6. **Repository Confirmation**: Select which repos to actually process (from those needing workflows)
7. **Dry-Run Prompt**: Choose whether to preview changes only (defaults to yes)
8. **PR Creation**: Creates PRs for missing workflows (if not dry-run)

## Features

- **Interactive Repository Selection**: Users specify which repositories to process
- **Branch Selection**: Choose which branches to target across all selected repos
- **Smart Branch Warning**: Clearly warns that branches apply to ALL repositories
- **Auto-Merge**: Creates PRs and auto-merges them with squash
- **Dry-Run Mode**: Preview all changes before applying (default)
- **Graceful Handling**: Skips non-existent branches automatically
- **Workflow Discovery**: Auto-discovers workflow files in current directory
- **Semantic Versioning**: Follows SemVer for releases

## Project Structure

```
apex-gh-workflow-sync/
├── deno.json          # Deno configuration with fmt settings
├── main.ts            # CLI entry point
├── src/
│   ├── config.ts      # Default branches and GitHub host
│   ├── types.ts       # TypeScript interfaces
│   ├── github.ts      # GitHub CLI wrapper
│   ├── repo-checker.ts # Repository status checking
│   ├── sorter.ts      # Commit date sorting
│   ├── selector.ts    # Interactive UI (repos & branches)
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
    ├── compile-current.ts  # OS-detecting compile script
    └── bump-version.ts     # Semantic version bumping
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

- **config_test.ts**: Branches, default values
- **types_test.ts**: TypeScript interface validation
- **logger_test.ts**: Colored logging output
- **repo-checker_test.ts**: Repository status formatting
- **sorter_test.ts**: Sorting by commit date
- **selector_test.ts**: Interactive selection logic
- **pr-creator_test.ts**: PR creation and merge logic
- **github_test.ts**: GitHub CLI integration
- **integration_test.ts**: End-to-end workflow simulation

## Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** version: Incompatible API changes
- **MINOR** version: Added functionality (backwards compatible)
- **PATCH** version: Backwards compatible bug fixes

### Version Management

The version is defined in `deno.json` and read dynamically by the CLI.

**Bump version:**

```bash
# Bump patch version (1.0.0 -> 1.0.1)
deno run --allow-read --allow-write scripts/bump-version.ts patch

# Bump minor version (1.0.0 -> 1.1.0)
deno run --allow-read --allow-write scripts/bump-version.ts minor

# Bump major version (1.0.0 -> 2.0.0)
deno run --allow-read --allow-write scripts/bump-version.ts major
```

**Release process:**

```bash
# 1. Bump version
deno run --allow-read --allow-write scripts/bump-version.ts patch

# 2. Commit version bump
git add deno.json && git commit -m "chore: bump version to x.x.x"

# 3. Create annotated tag
git tag -a vx.x.x -m "Release vx.x.x"

# 4. Push to GitHub
git push origin main && git push origin vx.x.x
```

Pushing a version tag triggers the GitHub Actions workflow to build and create a release.

## License

MIT
