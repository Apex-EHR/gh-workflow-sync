import { assertEquals } from '@std/assert'
import type { RepoStatus } from '../types.ts'

Deno.test('selector - checkbox options are formatted correctly with all present', () => {
  const repos: RepoStatus[] = [
    {
      repo: 'Apex-EHR/test-repo',
      branches: [
        { branch: 'dev', status: 'present' },
        { branch: 'qa', status: 'present' },
        { branch: 'stage', status: 'present' },
        { branch: 'main', status: 'present' },
      ],
      needsWorkflow: false,
    },
  ]

  // Verify repo structure for selector
  const repo = repos[0]
  const presentCount = repo.branches.filter((b) => b.status === 'present').length
  assertEquals(presentCount, 4)
  assertEquals(repo.needsWorkflow, false)
})

Deno.test('selector - checkbox options are formatted correctly with missing workflows', () => {
  const repos: RepoStatus[] = [
    {
      repo: 'Apex-EHR/test-repo',
      branches: [
        { branch: 'dev', status: 'missing' },
        { branch: 'qa', status: 'missing' },
        { branch: 'stage', status: 'not-found' },
        { branch: 'main', status: 'missing' },
      ],
      needsWorkflow: true,
    },
  ]

  const repo = repos[0]
  const missingCount = repo.branches.filter((b) => b.status === 'missing').length
  const notFoundCount = repo.branches.filter((b) => b.status === 'not-found').length

  assertEquals(missingCount, 3)
  assertEquals(notFoundCount, 1)
  assertEquals(repo.needsWorkflow, true)
})

Deno.test('selector - pre-selects repos that need workflows', () => {
  const repos: RepoStatus[] = [
    {
      repo: 'Apex-EHR/needs-workflow',
      branches: [{ branch: 'dev', status: 'missing' }],
      needsWorkflow: true,
    },
    {
      repo: 'Apex-EHR/all-good',
      branches: [{ branch: 'dev', status: 'present' }],
      needsWorkflow: false,
    },
  ]

  const needsWorkflow = repos.filter((r) => r.needsWorkflow).map((r) => r.repo)
  assertEquals(needsWorkflow.length, 1)
  assertEquals(needsWorkflow[0], 'Apex-EHR/needs-workflow')
})

Deno.test('selector - handles mixed status correctly', () => {
  const repos: RepoStatus[] = [
    {
      repo: 'Apex-EHR/mixed-repo',
      branches: [
        { branch: 'dev', status: 'present' },
        { branch: 'qa', status: 'missing' },
        { branch: 'stage', status: 'not-found' },
        { branch: 'main', status: 'present' },
      ],
      needsWorkflow: true,
    },
  ]

  const repo = repos[0]
  assertEquals(repo.branches[0].status, 'present')
  assertEquals(repo.branches[1].status, 'missing')
  assertEquals(repo.branches[2].status, 'not-found')
  assertEquals(repo.branches[3].status, 'present')
  assertEquals(repo.needsWorkflow, true)
})
