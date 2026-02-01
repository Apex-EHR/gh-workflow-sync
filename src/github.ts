import { debug, error } from './logger.ts'

export async function checkGhInstalled(): Promise<boolean> {
  try {
    const command = new Deno.Command('gh', { args: ['--version'] })
    const { success } = await command.output()
    return success
  } catch {
    return false
  }
}

export async function checkGhAuthenticated(hostname: string): Promise<boolean> {
  try {
    const command = new Deno.Command('gh', {
      args: ['auth', 'status', '--hostname', hostname],
    })
    const { success } = await command.output()
    return success
  } catch {
    return false
  }
}

export async function getRepoLastCommitDate(
  repo: string,
  hostname: string,
): Promise<string | null> {
  debug(`Getting last commit date for ${repo}`)
  try {
    const command = new Deno.Command('gh', {
      args: [
        'api',
        '--hostname',
        hostname,
        `repos/${repo}/commits/HEAD`,
        '--jq',
        '.commit.committer.date',
      ],
    })
    const { success, stdout } = await command.output()
    if (success) {
      const date = new TextDecoder().decode(stdout).trim()
      debug(`Last commit date for ${repo}: ${date}`)
      return date
    }
  } catch (e) {
    debug(`Failed to get last commit date for ${repo}: ${e}`)
  }
  return null
}

export async function checkBranchExists(
  repo: string,
  branch: string,
  hostname: string,
): Promise<boolean> {
  debug(`Checking if branch ${branch} exists in ${repo}`)
  try {
    const command = new Deno.Command('gh', {
      args: [
        'api',
        '--hostname',
        hostname,
        '--silent',
        `repos/${repo}/branches/${branch}`,
      ],
    })
    const { success } = await command.output()
    debug(`Branch ${branch} in ${repo} exists: ${success}`)
    return success
  } catch {
    debug(`Branch ${branch} in ${repo} not found`)
    return false
  }
}

export async function checkWorkflowExists(
  repo: string,
  branch: string,
  hostname: string,
  workflowPath = '.github/workflows/pr-merged-notification.yml',
): Promise<boolean> {
  debug(`Checking if workflow exists in ${repo}@${branch}`)
  try {
    const command = new Deno.Command('gh', {
      args: [
        'api',
        '--hostname',
        hostname,
        '--silent',
        `repos/${repo}/contents/${workflowPath}?ref=${branch}`,
      ],
    })
    const { success } = await command.output()
    debug(`Workflow in ${repo}@${branch} exists: ${success}`)
    return success
  } catch {
    debug(`Workflow in ${repo}@${branch} not found`)
    return false
  }
}

export async function createPR(
  repo: string,
  baseBranch: string,
  headBranch: string,
  title: string,
  body: string,
  hostname: string,
): Promise<number | null> {
  debug(`Creating PR for ${repo}: ${title}`)
  try {
    const command = new Deno.Command('gh', {
      args: [
        'pr',
        'create',
        '--hostname',
        hostname,
        '--repo',
        repo,
        '--base',
        baseBranch,
        '--head',
        headBranch,
        '--title',
        title,
        '--body',
        body,
      ],
    })
    const { success, stdout } = await command.output()
    if (success) {
      const output = new TextDecoder().decode(stdout)
      const match = output.match(/\/pull\/(\d+)$/m)
      const prNumber = match ? parseInt(match[1], 10) : null
      debug(`Created PR #${prNumber} for ${repo}`)
      return prNumber
    }
  } catch (e) {
    error(`Failed to create PR for ${repo}: ${e}`)
  }
  return null
}

export async function mergePR(
  prNumber: number,
  repo: string,
  hostname: string,
): Promise<boolean> {
  debug(`Merging PR #${prNumber} for ${repo}`)
  try {
    const command = new Deno.Command('gh', {
      args: [
        'pr',
        'merge',
        prNumber.toString(),
        '--hostname',
        hostname,
        '--repo',
        repo,
        '--squash',
        '--delete-branch',
      ],
    })
    const { success } = await command.output()
    debug(`Merged PR #${prNumber} for ${repo}: ${success}`)
    return success
  } catch (e) {
    error(`Failed to merge PR #${prNumber} for ${repo}: ${e}`)
    return false
  }
}

export async function cloneRepo(
  repo: string,
  branch: string,
  tmpdir: string,
  hostname: string,
): Promise<boolean> {
  debug(`Cloning ${repo}@${branch} to ${tmpdir}`)
  try {
    const command = new Deno.Command('git', {
      args: [
        'clone',
        '--depth',
        '1',
        '--branch',
        branch,
        `git@${hostname}:${repo}.git`,
        tmpdir,
      ],
    })
    const { success } = await command.output()
    debug(`Cloned ${repo}@${branch}: ${success}`)
    return success
  } catch (e) {
    error(`Failed to clone ${repo}@${branch}: ${e}`)
    return false
  }
}

export async function commitAndPush(
  tmpdir: string,
  branch: string,
  message: string,
): Promise<boolean> {
  debug(`Committing and pushing from ${tmpdir}`)
  try {
    // Add files
    const addCommand = new Deno.Command('git', {
      args: ['-C', tmpdir, 'add', '.'],
    })
    await addCommand.output()

    // Commit
    const commitCommand = new Deno.Command('git', {
      args: ['-C', tmpdir, 'commit', '-m', message],
    })
    await commitCommand.output()

    // Push to new branch
    const headBranch = `automation/pr-merged-notification/${branch}`
    const pushCommand = new Deno.Command('git', {
      args: ['-C', tmpdir, 'push', 'origin', `HEAD:${headBranch}`],
    })
    const { success } = await pushCommand.output()
    debug(`Pushed to ${headBranch}: ${success}`)
    return success
  } catch (e) {
    error(`Failed to commit and push: ${e}`)
    return false
  }
}
