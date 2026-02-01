#!/usr/bin/env -S deno run --allow-run=gh,git --allow-read --allow-write --allow-env

import { cac } from 'cac'
import { DEFAULT_GH_HOST } from './src/config.ts'
import { checkGhAuthenticated, checkGhInstalled } from './src/github.ts'
import { clearLine, debug, error, info, setVerbose, success, warn, write } from './src/logger.ts'
import { createWorkflowPRs } from './src/pr-creator.ts'
import { checkRepo, formatBranchStatus, formatRepoHeader } from './src/repo-checker.ts'
import { promptForRepos, selectBranches, selectRepos } from './src/selector.ts'
import { selectWorkflow } from './src/workflow-discovery.ts'
import type { CLIOptions, RepoStatus } from './src/types.ts'

async function main(options: CLIOptions) {
  setVerbose(options.verbose)

  debug(`Options: ${JSON.stringify(options)}`)

  // Validate gh CLI
  const ghInstalled = await checkGhInstalled()
  if (!ghInstalled) {
    error('gh CLI is not installed. Please install it from https://cli.github.com/')
    Deno.exit(1)
  }

  const ghAuthenticated = await checkGhAuthenticated(options.ghHost)
  if (!ghAuthenticated) {
    error(`Not authenticated with gh CLI for ${options.ghHost}. Run: gh auth login`)
    Deno.exit(1)
  }

  // Validate/prompt for workflow file using discovery
  const workflowFile = await selectWorkflow(true, options.workflowFile)
  info(`Using workflow file: ${workflowFile}`)

  info(`GH_HOST=${options.ghHost}; DRY_RUN=${options.dryRun}`)

  // Step 1: Prompt for repositories
  const inputRepos = await promptForRepos()
  info(`\nWill process ${inputRepos.length} repositories`)

  // Step 2: Select branches to target
  const selectedBranches = await selectBranches()
  if (selectedBranches.length === 0) {
    warn('No branches selected. Exiting.')
    Deno.exit(0)
  }
  info(`Selected branches: ${selectedBranches.join(', ')}`)

  // Step 3: Check all repos with selected branches
  const repoStatuses: RepoStatus[] = []

  info(`\nChecking ${inputRepos.length} repositories...\n`)

  for (const repoName of inputRepos) {
    console.log(formatRepoHeader(repoName))

    // Track current branch being checked for in-place updates
    const branchLines = new Map<string, number>()
    let currentLine = 0

    const status = await checkRepo(
      repoName,
      options.ghHost,
      selectedBranches,
      (branch, state) => {
        if (state === 'checking') {
          // First time seeing this branch
          branchLines.set(branch, currentLine)
          write(formatBranchStatus(branch, state) + '\n')
          currentLine++
        } else {
          // Update existing line - move cursor up and overwrite
          const lineNum = branchLines.get(branch)
          if (lineNum !== undefined) {
            const linesToMove = currentLine - lineNum
            // Move cursor up to the branch line
            write(`\x1b[${linesToMove}A`)
            // Clear line and write new status
            write('\r\x1b[K' + formatBranchStatus(branch, state))
            // Move cursor back down
            write(`\x1b[${linesToMove}B\r`)
          }
        }
      },
    )

    repoStatuses.push(status)

    // Print final summary for this repo
    if (status.needsWorkflow) {
      console.log('  ' + '\x1b[33m→\x1b[0m Would create PRs for missing workflows\n')
    } else {
      console.log('  ' + '\x1b[32m→\x1b[0m All workflows present\n')
    }
  }

  // Step 4: Interactive selection of repos to actually process
  let selectedRepos: string[]
  if (options.nonInteractive) {
    // Non-interactive mode: auto-select repos that need workflows
    selectedRepos = repoStatuses
      .filter((r) => r.needsWorkflow)
      .map((r) => r.repo)
    info(`Auto-selected ${selectedRepos.length} repositories needing workflows`)
  } else {
    // Interactive mode: let user choose
    selectedRepos = await selectRepos(repoStatuses)
    if (selectedRepos.length === 0) {
      warn('No repositories selected. Exiting.')
      Deno.exit(0)
    }
    info(`Selected ${selectedRepos.length} repositories`)
  }

  // Exit if dry run
  if (options.dryRun) {
    info('DRY-RUN mode: No changes were made.')
    Deno.exit(0)
  }

  // Confirm before making changes if not in dry-run
  if (!options.dryRun && selectedRepos.length > 0) {
    info(`\nWill create PRs for ${selectedRepos.length} repositories`)
    // Process selected repos
    for (const repoName of selectedRepos) {
      const repoStatus = repoStatuses.find((r) => r.repo === repoName)!
      for (const branch of repoStatus.branches) {
        if (branch.status === 'missing') {
          await createWorkflowPRs(
            repoName,
            branch.branch,
            workflowFile,
            options.ghHost,
            options.dryRun,
          )
        }
      }
    }
  }

  success('Completed!')
}

// Setup cac CLI - read version from deno.json
const { version: VERSION } = JSON.parse(await Deno.readTextFile('./deno.json'))

const cli = cac('apex-gh-workflow-sync')

cli
  .version(VERSION)
  .option('--dry-run', 'Preview changes without making them', { default: true })
  .option('--no-dry-run', 'Apply changes (disable dry-run)')
  .option('--workflow-file <path>', 'Path to workflow file (auto-discovers if not specified)')
  .option('--gh-host <host>', 'GitHub host', { default: DEFAULT_GH_HOST })
  .option('-v, --verbose', 'Enable verbose output')
  .option('-y, --non-interactive', 'Skip interactive prompts (auto-select repos needing workflows)')
  .help()

const parsed = cli.parse(Deno.args)

// Parse options
const options: CLIOptions = {
  dryRun: parsed.options['no-dry-run'] ? false : parsed.options['dry-run'] ?? true,
  workflowFile: parsed.options['workflow-file'],
  ghHost: parsed.options['gh-host'] || DEFAULT_GH_HOST,
  verbose: parsed.options['verbose'] ?? false,
  nonInteractive: parsed.options['non-interactive'] ?? false,
}

await main(options)
