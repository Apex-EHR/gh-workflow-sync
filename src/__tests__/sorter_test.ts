import { assertEquals } from '@std/assert'
import { createUnsortedRepos } from '../sorter.ts'
import { REPOS } from '../config.ts'

Deno.test('sorter - createUnsortedRepos creates repos in default order', () => {
  const repos = createUnsortedRepos()

  assertEquals(repos.length, REPOS.length)
  assertEquals(repos[0].repo, REPOS[0])
  assertEquals(repos[repos.length - 1].repo, REPOS[REPOS.length - 1])
})

Deno.test('sorter - createUnsortedRepos initializes empty branches', () => {
  const repos = createUnsortedRepos()

  for (const repo of repos) {
    assertEquals(repo.branches.length, 0)
    assertEquals(repo.needsWorkflow, false)
  }
})

Deno.test('sorter - createUnsortedRepos includes all repos', () => {
  const repos = createUnsortedRepos()

  for (const repoName of REPOS) {
    const found = repos.find((r) => r.repo === repoName)
    assertEquals(found !== undefined, true, `Should include ${repoName}`)
  }
})
