import type { BranchStatus, RepoStatus } from './types.ts'
import { BRANCHES } from './config.ts'
import { checkBranchExists, checkWorkflowExists } from './github.ts'
import { debug, statusColors, write } from './logger.ts'
import chalk from 'chalk'

export async function checkRepo(
  repo: string,
  hostname: string,
  onProgress?: (branch: string, status: string) => void,
): Promise<RepoStatus> {
  debug(`Checking repo: ${repo}`)
  const branches: BranchStatus[] = []
  let needsWorkflow = false

  for (const branch of BRANCHES) {
    // Show "checking" state
    if (onProgress) {
      onProgress(branch, 'checking')
    }

    debug(`  Checking branch: ${branch}`)
    const branchExists = await checkBranchExists(repo, branch, hostname)

    if (!branchExists) {
      branches.push({ branch, status: 'not-found' })
      if (onProgress) {
        onProgress(branch, 'not-found')
      }
      debug(`    Branch ${branch} not found`)
    } else {
      const workflowExists = await checkWorkflowExists(repo, branch, hostname)
      if (workflowExists) {
        branches.push({ branch, status: 'present' })
        if (onProgress) {
          onProgress(branch, 'present')
        }
        debug(`    Workflow present on ${branch}`)
      } else {
        branches.push({ branch, status: 'missing' })
        needsWorkflow = true
        if (onProgress) {
          onProgress(branch, 'missing')
        }
        debug(`    Workflow missing on ${branch}`)
      }
    }
  }

  return { repo, branches, needsWorkflow }
}

export function formatRepoHeader(repo: string): string {
  return chalk.cyan.bold(`📁 ${repo}`)
}

export function formatBranchStatus(branch: string, status: string): string {
  const paddedBranch = branch.padEnd(8)

  switch (status) {
    case 'checking':
      return `  ${statusColors.checking('◌')} ${paddedBranch}: ${statusColors.checking('checking...')}`
    case 'present':
      return `  ${statusColors.present('✓')} ${paddedBranch}: ${statusColors.present('present')}`
    case 'missing':
      return `  ${statusColors.missing('✗')} ${paddedBranch}: ${statusColors.missing('missing')}`
    case 'not-found':
      return `  ${statusColors.notFound('○')} ${paddedBranch}: ${statusColors.notFound('no branch')}`
    default:
      return `  ${paddedBranch}: ${status}`
  }
}

export function formatRepoStatus(status: RepoStatus): string {
  const lines: string[] = [formatRepoHeader(status.repo)]

  for (const branch of status.branches) {
    lines.push(formatBranchStatus(branch.branch, branch.status))
  }

  if (status.needsWorkflow) {
    lines.push(chalk.yellow('  → Would create PRs for missing workflows'))
  } else {
    lines.push(chalk.green('  → All workflows present'))
  }
  lines.push('')

  return lines.join('\n')
}
