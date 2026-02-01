import type { RepoStatus } from './types.ts'
import { getRepoLastCommitDate } from './github.ts'
import { debug, info } from './logger.ts'

export async function sortReposByDate(
  repos: string[],
  hostname: string,
): Promise<RepoStatus[]> {
  info('Sorting repos by last commit date (oldest first)...')
  debug('Starting repo sorting')

  const repoDates: { repo: string; date: string }[] = []

  // Fetch last commit dates for all repos in parallel
  const datePromises = repos.map(async (repo) => {
    const date = await getRepoLastCommitDate(repo, hostname)
    const effectiveDate = date || '9999-12-31T23:59:59Z'
    debug(`${repo}: ${effectiveDate}`)
    return { repo, date: effectiveDate }
  })

  const results = await Promise.all(datePromises)
  repoDates.push(...results)

  // Sort by date (oldest first)
  repoDates.sort((a, b) => a.date.localeCompare(b.date))

  // Create initial RepoStatus objects (branches will be checked later)
  const sortedRepos: RepoStatus[] = repoDates.map(({ repo, date }) => ({
    repo,
    branches: [],
    needsWorkflow: false,
    lastCommitDate: date,
  }))

  info(`Processing order determined (${sortedRepos.length} repos).`)
  debug(`Sorted order: ${sortedRepos.map((r) => r.repo).join(', ')}`)

  return sortedRepos
}

export function createUnsortedRepos(repos: string[]): RepoStatus[] {
  return repos.map((repo) => ({
    repo,
    branches: [],
    needsWorkflow: false,
  }))
}
