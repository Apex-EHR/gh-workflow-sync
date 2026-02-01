import { ensureDir } from '@std/fs'
import { join } from '@std/path'
import type { PRResult } from './types.ts'
import { cloneRepo, commitAndPush, createPR, mergePR } from './github.ts'
import { debug, error, info, success, warn } from './logger.ts'

export async function createWorkflowPRs(
  repo: string,
  branch: string,
  workflowFile: string,
  hostname: string,
  dryRun: boolean,
): Promise<PRResult> {
  const tmpdir = await Deno.makeTempDir()
  debug(`Created temp dir: ${tmpdir}`)

  try {
    if (dryRun) {
      info(`[DRY-RUN] Would create PR for ${repo}@${branch}`)
      return { repo, branch, success: true }
    }

    info(`Creating PR for ${repo}@${branch}`)

    // Clone repo
    const cloned = await cloneRepo(repo, branch, tmpdir, hostname)
    if (!cloned) {
      return { repo, branch, success: false, error: 'Failed to clone repository' }
    }

    // Create workflow directory and copy file
    const workflowDir = join(tmpdir, '.github', 'workflows')
    await ensureDir(workflowDir)
    await Deno.copyFile(workflowFile, join(workflowDir, 'pr-merged-notification.yml'))
    debug(`Copied workflow file to ${workflowDir}`)

    // Commit and push
    const pushed = await commitAndPush(
      tmpdir,
      branch,
      'chore: add pr merged notification workflow',
    )
    if (!pushed) {
      return { repo, branch, success: false, error: 'Failed to push changes' }
    }

    // Create PR
    const headBranch = `automation/pr-merged-notification/${branch}`
    const prNumber = await createPR(
      repo,
      branch,
      headBranch,
      'chore: add pr merged notification workflow',
      `Adds pr-merged-notification workflow to ${branch}.`,
      hostname,
    )

    if (!prNumber) {
      return { repo, branch, success: false, error: 'Failed to create PR' }
    }

    success(`Created PR #${prNumber} for ${repo}@${branch}`)

    // Merge PR
    const merged = await mergePR(prNumber, repo, hostname)
    if (merged) {
      success(`Merged PR #${prNumber} for ${repo}@${branch}`)
    } else {
      warn(`Failed to merge PR #${prNumber} for ${repo}@${branch}`)
    }

    return { repo, branch, success: true, prNumber }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e)
    error(`Error processing ${repo}@${branch}: ${errorMsg}`)
    return { repo, branch, success: false, error: errorMsg }
  } finally {
    // Cleanup
    try {
      await Deno.remove(tmpdir, { recursive: true })
      debug(`Cleaned up temp dir: ${tmpdir}`)
    } catch {
      // Ignore cleanup errors
    }
  }
}
