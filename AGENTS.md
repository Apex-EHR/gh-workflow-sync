# AGENTS.md

This document describes how we work in the `apex-gh-workflow-sync` repository.

## Commands

- **Run the CLI (interactive mode)**
  - `deno task start`
  - You will be prompted whether to run in dry-run mode (default: yes)
- **Apply changes (interactive)**
  - `deno task start` then select "No" when asked about dry-run
- **Dry-run in non-interactive mode (CI/CD preview)**
  - `deno task start --dry-run --non-interactive`
- **Apply changes in non-interactive mode (CI/CD)**
  - `deno task start --non-interactive`
- **Verbose logging**
  - `deno task start -v`
- **Dev/watch mode**
  - `deno task dev`
- **Compile**
  - Current OS/arch:
    - `deno task compile`
  - Cross-target:
    - `deno task compile:linux`
    - `deno task compile:linux-arm64`
    - `deno task compile:windows`
    - `deno task compile:macos`
    - `deno task compile:macos-intel`
    - `deno task compile:all`
- **Format**
  - `deno fmt`

Notes:
- The CLI is **interactive by default**.
- In interactive mode, you will be prompted whether to run in dry-run mode (defaults to yes for safety).
- In non-interactive mode (`-y, --non-interactive`), use `--dry-run` flag to preview changes without applying them.
- Sorting is prompted interactively and **defaults to no sorting**.

## Testing

- **Run all tests**
  - `deno task test`
- **Watch tests**
  - `deno task test:watch`
- **Coverage**
  - `deno task test:coverage`

Testing is built on `deno test` and lives under `src/__tests__/`.

## Project Structure

- **`main.ts`**
  - CLI entrypoint (`cac`), reads version from `deno.json`, orchestrates the workflow.
- **`deno.json`**
  - Deno tasks, formatting configuration, package metadata.
- **`src/`**
  - `config.ts`: default branches (`dev`, `qa`, `stage`, `main`) and default GitHub host.
  - `types.ts`: shared TypeScript types.
  - `github.ts`: `gh` CLI wrapper / GitHub operations.
  - `repo-checker.ts`: checks workflow presence per repo/branch.
  - `sorter.ts`: last-commit-date based ordering.
  - `selector.ts`: interactive prompts (repos, sorting, branches, and final repo selection).
  - `prompts.ts`: prompt wrappers around `@inquirer/prompts`.
  - `pr-creator.ts`: PR creation/merge logic.
  - `logger.ts`: colored logging utilities.
  - `workflow-discovery.ts`: workflow file discovery/selection.
  - `__tests__/`: test suite.
- **`scripts/`**
  - `compile-current.ts`: compile for current OS/arch.
  - `bump-version.ts`: SemVer bump helper.
- **`.github/workflows/build.yml`**
  - CI build and release workflow.
- **Changelog**
  - `CHANGELOG.md` is generated from commits using `git-cliff` (`cliff.toml`).

## Code Style

- Use Deno formatter as the single source of truth:
  - `deno fmt`
- Formatting rules are configured in `deno.json`:
  - single quotes
  - no semicolons
  - 2-space indentation
  - line width 110
  - trailing commas for multi-line only

General guidelines:
- Keep modules small and single-purpose.
- Prefer typed interfaces in `src/types.ts` rather than ad-hoc objects.
- Avoid adding new runtime dependencies unless clearly justified.

## Git Workflow

We use **strict GitFlow** in this repo.

- **Long-lived branches**
  - `main`: production/releases
  - `dev`: integration branch for ongoing development

- **Feature work**
  - Branch from `dev`:
    - `feature/<short-description>`
  - Merge back into `dev` when complete.

- **Bug fixes**
  - Branch from `dev`:
    - `bugfix/<short-description>`
  - Merge back into `dev` when complete.

- **Releases**
  - Releases are cut from `main`.
  - Version tags follow SemVer: `vMAJOR.MINOR.PATCH`.
  - Tag pushes trigger CI release automation.

### Conventional Commits (Strict)

All commits must use **Conventional Commit** messages.

Examples:
- `feat: add interactive sorting prompt`
- `fix: handle missing branch gracefully`
- `docs: update README for non-interactive mode`
- `chore: bump version to 1.0.4`

Breaking changes:
- Use `!` and/or `BREAKING CHANGE:` in the body.

## Boundaries

- **Do not commit compiled binaries**
  - `bin/` is intentionally ignored; CI produces release artifacts.
- **Do not hardcode repository lists**
  - Repos are user-provided at runtime.
- **Do not bypass CI release automation**
  - Releases are driven by SemVer tags and GitHub Actions.
- **Do not change formatting rules** without explicit agreement
  - `deno fmt` settings are the canonical style.
- **Be careful with permissions**
  - The tool runs with `--allow-run=gh,git` and may create PRs/merge changes.
