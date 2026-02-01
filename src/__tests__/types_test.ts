import { assertEquals, assertExists } from '@std/assert'
import type { BranchStatus, CLIOptions, PRResult, RepoStatus } from '../types.ts'

Deno.test('types - BranchStatus interface works correctly', () => {
  const branchStatus: BranchStatus = {
    branch: 'dev',
    status: 'present',
  }

  assertEquals(branchStatus.branch, 'dev')
  assertEquals(branchStatus.status, 'present')
})

Deno.test('types - BranchStatus supports all status values', () => {
  const present: BranchStatus = { branch: 'dev', status: 'present' }
  const missing: BranchStatus = { branch: 'qa', status: 'missing' }
  const notFound: BranchStatus = { branch: 'stage', status: 'not-found' }

  assertEquals(present.status, 'present')
  assertEquals(missing.status, 'missing')
  assertEquals(notFound.status, 'not-found')
})

Deno.test('types - RepoStatus interface works correctly', () => {
  const repoStatus: RepoStatus = {
    repo: 'Apex-EHR/test-repo',
    branches: [
      { branch: 'dev', status: 'present' },
      { branch: 'main', status: 'missing' },
    ],
    needsWorkflow: true,
    lastCommitDate: '2024-01-01T00:00:00Z',
  }

  assertEquals(repoStatus.repo, 'Apex-EHR/test-repo')
  assertEquals(repoStatus.branches.length, 2)
  assertEquals(repoStatus.needsWorkflow, true)
  assertEquals(repoStatus.lastCommitDate, '2024-01-01T00:00:00Z')
})

Deno.test('types - RepoStatus without optional lastCommitDate', () => {
  const repoStatus: RepoStatus = {
    repo: 'Apex-EHR/test-repo',
    branches: [],
    needsWorkflow: false,
  }

  assertEquals(repoStatus.lastCommitDate, undefined)
})

Deno.test('types - CLIOptions interface works correctly', () => {
  const options: CLIOptions = {
    dryRun: true,
    workflowFile: './workflow.yml',
    ghHost: 'github.com',
    verbose: false,
    nonInteractive: false,
  }

  assertEquals(options.dryRun, true)
  assertEquals(options.workflowFile, './workflow.yml')
  assertEquals(options.ghHost, 'github.com')
  assertEquals(options.verbose, false)
  assertEquals(options.nonInteractive, false)
})

Deno.test('types - PRResult interface with success', () => {
  const result: PRResult = {
    repo: 'Apex-EHR/test-repo',
    branch: 'dev',
    success: true,
    prNumber: 42,
  }

  assertEquals(result.success, true)
  assertEquals(result.prNumber, 42)
  assertEquals(result.error, undefined)
})

Deno.test('types - PRResult interface with failure', () => {
  const result: PRResult = {
    repo: 'Apex-EHR/test-repo',
    branch: 'main',
    success: false,
    error: 'Failed to create PR',
  }

  assertEquals(result.success, false)
  assertEquals(result.error, 'Failed to create PR')
  assertEquals(result.prNumber, undefined)
})
