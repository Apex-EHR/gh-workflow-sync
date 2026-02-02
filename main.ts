#!/usr/bin/env -S deno run --allow-run=gh,git --allow-read --allow-write --allow-env

import { cac } from 'cac'
import { DEFAULT_GH_HOST } from './src/config.ts'
import { checkGhAuthenticated, checkGhInstalled } from './src/github.ts'
import { clearLine, debug, error, info, setVerbose, success, warn, write } from './src/logger.ts'
import { createWorkflowPRs } from './src/pr-creator.ts'
import { checkRepo, formatBranchStatus, formatRepoHeader } from './src/repo-checker.ts'
import { promptForRepos, promptForSorting, selectBranches } from './src/selector.ts'
import { confirmPrompt } from './src/prompts.ts'
import { sortReposByDate } from './src/sorter.ts'
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
  let inputRepos = await promptForRepos(options.ghHost)
  info(`\nWill process ${inputRepos.length} repositories`)

  // Step 2: Prompt for sorting (defaults to no sorting)
  const shouldSort = await promptForSorting()
  if (shouldSort && !options.nonInteractive) {
    info('Sorting repositories by last commit date...')
    const sortedRepoStatuses = await sortReposByDate(inputRepos, options.ghHost)
    inputRepos = sortedRepoStatuses.map((r) => r.repo)
    info(`Sorted ${inputRepos.length} repositories`)
  }

  // Step 3: Select branches to target
  const selectedBranches = await selectBranches()
  if (selectedBranches.length === 0) {
    warn('No branches selected. Exiting.')
    Deno.exit(0)
  }
  info(`Selected branches: ${selectedBranches.join(', ')}`)

  // Step 4: Check all repos with selected branches
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

  // Step 5: Filter to repos needing workflows and confirm processing
  // Step 6: Prompt for dry-run (interactive mode) or use flag (non-interactive)
  // Step 7: Apply changes (if not dry-run)
  let selectedRepos: string[]
  if (options.nonInteractive) {
    // Non-interactive mode: auto-select repos that need workflows
    selectedRepos = repoStatuses
      .filter((r) => r.needsWorkflow)
      .map((r) => r.repo)
    info(`Auto-selected ${selectedRepos.length} repositories needing workflows`)
  } else {
    // Interactive mode: filter to repos needing workflows from original selection
    selectedRepos = repoStatuses
      .filter((r) => r.needsWorkflow && inputRepos.includes(r.repo))
      .map((r) => r.repo)

    if (selectedRepos.length === 0) {
      info('No repositories need workflows. Nothing to do.')
      Deno.exit(0)
    }

    info(`\n${selectedRepos.length} repositories need workflows:`)
    for (const repo of selectedRepos) {
      const status = repoStatuses.find((r) => r.repo === repo)!
      const missingBranches = status.branches.filter((b) => b.status === 'missing').map((b) => b.branch)
      info(`  - ${repo} (branches: ${missingBranches.join(', ')})`)
    }
  }

  // Determine if this is a dry run
  let isDryRun: boolean
  if (options.nonInteractive) {
    // Non-interactive: use the flag value (default false = apply changes)
    isDryRun = options.dryRun
  } else {
    // Interactive: prompt user (default true = dry-run for safety)
    isDryRun = await confirmPrompt({
      message: 'Preview changes only (dry-run)?',
      defaultValue: true,
    })
  }

  // Exit if dry run
  if (isDryRun) {
    info('DRY-RUN mode: No changes were made.')
    Deno.exit(0)
  }

  // Apply changes
  if (selectedRepos.length > 0) {
    info(`\nWill create PRs for ${selectedRepos.length} repositories`)
    const failures: { repo: string; branch: string; error?: string }[] = []
    // Process selected repos
    for (const repoName of selectedRepos) {
      const repoStatus = repoStatuses.find((r) => r.repo === repoName)!
      for (const branch of repoStatus.branches) {
        if (branch.status === 'missing') {
          const result = await createWorkflowPRs(
            repoName,
            branch.branch,
            workflowFile,
            options.ghHost,
            isDryRun,
          )
          if (!result.success) {
            failures.push({ repo: result.repo, branch: result.branch, error: result.error })
            warn(`Failed for ${result.repo}@${result.branch}: ${result.error ?? 'unknown error'}`)
          }
        }
      }
    }

    if (failures.length > 0) {
      error(`\n${failures.length} operation(s) failed.`)
      Deno.exit(1)
    }
  }

  success('Completed!')
}

// Setup cac CLI - read version from deno.json
const { version: VERSION } = JSON.parse(await Deno.readTextFile('./deno.json'))

const cli = cac('apex-gh-workflow-sync')

cli
  .version(VERSION)
  .option('--dry-run', 'Preview changes without making them (default in interactive mode)')
  .option('--workflow-file <path>', 'Path to workflow file (auto-discovers if not specified)')
  .option('--gh-host <host>', 'GitHub Enterprise host (default: github.com)', { default: DEFAULT_GH_HOST })
  .option('-v, --verbose', 'Enable verbose debug output')
  .option('-y, --non-interactive', 'Skip all prompts and auto-select repos needing workflows')
  .help()

const parsed = cli.parse(Deno.args)

// Parse options
const dryRunFlag = parsed.options['dry-run'] ?? false
const nonInteractive = parsed.options['non-interactive'] ?? false

// In interactive mode: we'll prompt for dry-run later (default to true for safety)
// In non-interactive mode: use the flag value (default false - will apply changes)
const options: CLIOptions = {
  dryRun: dryRunFlag,
  workflowFile: parsed.options['workflow-file'],
  ghHost: parsed.options['gh-host'] || DEFAULT_GH_HOST,
  verbose: parsed.options['verbose'] ?? false,
  nonInteractive: nonInteractive,
}

await main(options)
