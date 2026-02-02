import { checkboxPrompt, confirmPrompt, textPrompt } from './prompts.ts'
import { BRANCHES } from './config.ts'
import type { RepoStatus } from './types.ts'
import { info, warn } from './logger.ts'

/**
 * Prompt user to input repository names (comma-separated)
 */
export async function promptForRepos(): Promise<string[]> {
  info('Enter repository names to process (comma-separated, format: owner/repo):')
  info('Example: Apex-EHR/apex-auth-service, Apex-EHR/apex-ehr-bff')

  const input = await textPrompt({
    message: 'Repositories',
    validate: (value) => {
      if (!value.trim()) return 'Please enter at least one repository'
      const repos = value.split(',').map((r) => r.trim()).filter(Boolean)
      if (repos.length === 0) return 'Please enter at least one repository'
      for (const repo of repos) {
        if (!repo.includes('/')) return `Invalid format: "${repo}". Use format: owner/repo`
      }
      return true
    },
  })

  return input.split(',').map((r) => r.trim()).filter(Boolean)
}

/**
 * Prompt whether to sort repositories by last commit date
 * Defaults to no sorting (false)
 */
export async function promptForSorting(): Promise<boolean> {
  return confirmPrompt({
    message: 'Sort repositories by last commit date (oldest first)?',
    defaultValue: false,
  })
}

/**
 * Select branches to target (applies to ALL selected repos)
 */
export async function selectBranches(): Promise<string[]> {
  warn('⚠️  Selected branches will be applied to ALL repositories')

  const options = BRANCHES.map((branch) => ({
    name: branch,
    value: branch,
    checked: true, // Default to all branches selected
  }))

  const selected = await checkboxPrompt({
    message: 'Select branches to target (applies to ALL repos)',
    options,
    hint: '[number] toggle, a (all), n (none), d (done)',
  })

  return selected
}

/**
 * Select repositories from a list of repo statuses (for when repos are already checked)
 */
export async function selectRepos(repos: RepoStatus[]): Promise<string[]> {
  info('Select repositories to process:')

  // Pre-select repos that need workflows
  const defaultSelected = repos
    .filter((r) => r.needsWorkflow)
    .map((r) => r.repo)

  const options = repos.map((repo) => {
    const missingCount = repo.branches.filter((b) => b.status === 'missing').length
    const notFoundCount = repo.branches.filter((b) => b.status === 'not-found').length
    const presentCount = repo.branches.filter((b) => b.status === 'present').length

    let hint = ''
    if (missingCount > 0) {
      hint = `${missingCount} missing`
      if (notFoundCount > 0) hint += `, ${notFoundCount} no branch`
    } else if (presentCount === repo.branches.length) {
      hint = 'all present'
    } else {
      hint = 'no action needed'
    }

    return {
      name: repo.repo,
      value: repo.repo,
      checked: defaultSelected.includes(repo.repo),
      hint,
    }
  })

  const selected = await checkboxPrompt({
    message: 'Select repositories to process',
    options,
    hint: '[number] toggle, a (all), n (none), d (done)',
  })

  return selected
}
