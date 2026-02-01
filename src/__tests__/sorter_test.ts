import { assertEquals } from '@std/assert'
import { createUnsortedRepos } from '../sorter.ts'

Deno.test('sorter - createUnsortedRepos creates repos from provided list', () => {
  const testRepos = ['Apex-EHR/repo1', 'Apex-EHR/repo2', 'Apex-EHR/repo3']
  const repos = createUnsortedRepos(testRepos)

  assertEquals(repos.length, 3)
  assertEquals(repos[0].repo, 'Apex-EHR/repo1')
  assertEquals(repos[1].repo, 'Apex-EHR/repo2')
  assertEquals(repos[2].repo, 'Apex-EHR/repo3')
})

Deno.test('sorter - createUnsortedRepos initializes empty branches', () => {
  const testRepos = ['Apex-EHR/repo1']
  const repos = createUnsortedRepos(testRepos)

  for (const repo of repos) {
    assertEquals(repo.branches.length, 0)
    assertEquals(repo.needsWorkflow, false)
  }
})
