import { checkboxPrompt } from './prompts.ts'
import type { RepoStatus } from './types.ts'
import { info } from './logger.ts'

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
