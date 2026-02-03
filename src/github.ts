import { debug, error } from './logger.ts'

function maybeHostnameArgs(hostname: string): string[] {
  // gh CLI defaults to github.com; passing --hostname github.com can fail on some gh versions.
  if (!hostname || hostname === 'github.com') return []
  return ['--hostname', hostname]
}

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
    const { success, stdout, stderr } = await command.output()
    if (success) {
      const date = new TextDecoder().decode(stdout).trim()
      debug(`Last commit date for ${repo}: ${date}`)
      return date
    } else {
      const err = new TextDecoder().decode(stderr).trim()
      debug(`gh api failed for ${repo}: ${err}`)
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
        ...maybeHostnameArgs(hostname),
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
    const { success, stdout, stderr } = await command.output()
    const output = new TextDecoder().decode(stdout).trim()
    const err = new TextDecoder().decode(stderr).trim()
    if (!success) {
      error(`Failed to create PR for ${repo}@${baseBranch}: ${err || output}`)
      return null
    }

    // gh usually prints a PR URL like https://github.com/org/repo/pull/123
    const match = output.match(/\/pull\/(\d+)/)
    const prNumber = match ? parseInt(match[1], 10) : null
    if (!prNumber) {
      error(`Failed to parse PR number for ${repo}@${baseBranch}: ${output}`)
      return null
    }

    debug(`Created PR #${prNumber} for ${repo}`)
    return prNumber
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
        ...maybeHostnameArgs(hostname),
        '--repo',
        repo,
        '--squash',
        '--delete-branch',
      ],
    })
    const { success, stdout, stderr } = await command.output()
    if (!success) {
      const out = new TextDecoder().decode(stdout).trim()
      const err = new TextDecoder().decode(stderr).trim()
      error(`Failed to merge PR #${prNumber} for ${repo}: ${err || out}`)
      return false
    }
    debug(`Merged PR #${prNumber} for ${repo}: true`)
    return true
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
    const { success, stderr } = await command.output()
    if (!success) {
      const err = new TextDecoder().decode(stderr).trim()
      error(`Git clone failed for ${repo}@${branch}: ${err}`)
    }
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
    const addResult = await addCommand.output()
    if (!addResult.success) {
      const err = new TextDecoder().decode(addResult.stderr).trim()
      error(`Git add failed: ${err}`)
      return false
    }

    // Commit
    const commitCommand = new Deno.Command('git', {
      args: ['-C', tmpdir, 'commit', '-m', message],
    })
    const commitResult = await commitCommand.output()
    if (!commitResult.success) {
      const err = new TextDecoder().decode(commitResult.stderr).trim()
      error(`Git commit failed: ${err}`)
      return false
    }

    // Push to new branch
    const headBranch = `automation/pr-merged-notification/${branch}`
    const pushCommand = new Deno.Command('git', {
      args: ['-C', tmpdir, 'push', 'origin', `HEAD:${headBranch}`],
    })
    const { success, stderr } = await pushCommand.output()
    if (!success) {
      const err = new TextDecoder().decode(stderr).trim()
      error(`Git push failed: ${err}`)
    }
    debug(`Pushed to ${headBranch}: ${success}`)
    return success
  } catch (e) {
    error(`Failed to commit and push: ${e}`)
    return false
  }
}

export async function getUserOrgs(limit = 100): Promise<string[]> {
  debug(`Fetching organizations for authenticated user`)
  try {
    const command = new Deno.Command('gh', {
      args: [
        'org',
        'list',
        '--limit',
        limit.toString(),
      ],
    })
    const { success, stdout, stderr } = await command.output()
    if (!success) {
      const err = new TextDecoder().decode(stderr)
      debug(`gh org list failed: ${err}`)
      return []
    }
    const output = new TextDecoder().decode(stdout).trim()
    // Parse output like "Showing 1 of 1 organization\n\nApex-EHR"
    const lines = output.split('\n').filter((line) => line && !line.startsWith('Showing'))
    const orgs = lines.map((line) => line.trim()).filter(Boolean)
    debug(`Found ${orgs.length} orgs: ${orgs.join(', ')}`)
    return orgs
  } catch (e) {
    debug(`Failed to fetch orgs: ${e}`)
  }
  return []
}

export async function getReposForOwner(owner: string, limit = 100): Promise<string[]> {
  debug(`Fetching repos for owner: ${owner}`)
  try {
    const command = new Deno.Command('gh', {
      args: [
        'repo',
        'list',
        owner,
        '--limit',
        limit.toString(),
        '--json',
        'nameWithOwner',
      ],
    })
    const { success, stdout, stderr } = await command.output()
    if (!success) {
      const err = new TextDecoder().decode(stderr)
      debug(`gh repo list failed: ${err}`)
      return []
    }
    const output = new TextDecoder().decode(stdout).trim()
    debug(`gh repo list output length: ${output.length}`)
    if (!output || output === '[]') {
      debug('Empty output from gh repo list')
      return []
    }
    const repos = JSON.parse(output) as Array<{ nameWithOwner: string }>
    const repoNames = repos.map((r) => r.nameWithOwner)
    debug(`Found ${repoNames.length} repos`)
    return repoNames
  } catch (e) {
    debug(`Failed to fetch repos: ${e}`)
  }
  return []
}
