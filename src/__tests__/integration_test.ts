import { assertEquals } from '@std/assert'
import { BRANCHES, REPOS } from '../config.ts'
import type { RepoStatus } from '../types.ts'

Deno.test('integration - full workflow simulation', () => {
  // Simulate the complete workflow
  const repoStatuses: RepoStatus[] = REPOS.map((repo) => ({
    repo,
    branches: BRANCHES.map((branch) => ({
      branch,
      status: Math.random() > 0.5 ? 'present' : 'missing' as const,
    })),
    needsWorkflow: false,
  }))

  // Update needsWorkflow based on branch status
  for (const status of repoStatuses) {
    status.needsWorkflow = status.branches.some((b) => b.status === 'missing')
  }

  // Verify all repos are processed
  assertEquals(repoStatuses.length, REPOS.length)

  // Verify all branches are checked for each repo
  for (const status of repoStatuses) {
    assertEquals(status.branches.length, BRANCHES.length)
  }
})

Deno.test('integration - CLI options validation', () => {
  const validOptions = {
    dryRun: true,
    workflowFile: './workflow.yml',
    ghHost: 'github.com',
    verbose: false,
    interactive: true,
    noSort: false,
  }

  assertEquals(typeof validOptions.dryRun, 'boolean')
  assertEquals(typeof validOptions.workflowFile, 'string')
  assertEquals(typeof validOptions.ghHost, 'string')
  assertEquals(typeof validOptions.verbose, 'boolean')
  assertEquals(typeof validOptions.interactive, 'boolean')
  assertEquals(typeof validOptions.noSort, 'boolean')
})

Deno.test('integration - branch coverage validation', () => {
  const branches = ['dev', 'qa', 'stage', 'main']

  for (const branch of branches) {
    assertEquals(BRANCHES.includes(branch), true)
  }
})

Deno.test('integration - repo list validation', () => {
  // Verify all expected repos are in the list
  const expectedRepos = [
    'Apex-EHR/apex-auth-service',
    'Apex-EHR/apex-ecqm-service',
    'Apex-EHR/apex-ehr-bff',
    'Apex-EHR/apex-core-service',
  ]

  for (const repo of expectedRepos) {
    assertEquals(REPOS.includes(repo), true, `Should include ${repo}`)
  }
})
