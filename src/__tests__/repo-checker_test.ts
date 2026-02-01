import { assertEquals } from '@std/assert'
import type { RepoStatus } from '../types.ts'
import { formatBranchStatus, formatRepoHeader, formatRepoStatus } from '../repo-checker.ts'

Deno.test('repo-checker - formatRepoHeader formats repo name with icon', () => {
  const header = formatRepoHeader('Apex-EHR/test-repo')
  assertEquals(header.includes('📁'), true)
  assertEquals(header.includes('Apex-EHR/test-repo'), true)
})

Deno.test('repo-checker - formatBranchStatus formats present status', () => {
  const formatted = formatBranchStatus('dev', 'present')
  assertEquals(formatted.includes('dev'), true)
  assertEquals(formatted.includes('present'), true)
  assertEquals(formatted.includes('✓'), true)
})

Deno.test('repo-checker - formatBranchStatus formats missing status', () => {
  const formatted = formatBranchStatus('qa', 'missing')
  assertEquals(formatted.includes('qa'), true)
  assertEquals(formatted.includes('missing'), true)
  assertEquals(formatted.includes('✗'), true)
})

Deno.test('repo-checker - formatBranchStatus formats not-found status', () => {
  const formatted = formatBranchStatus('stage', 'not-found')
  assertEquals(formatted.includes('stage'), true)
  assertEquals(formatted.includes('no branch'), true)
  assertEquals(formatted.includes('○'), true)
})

Deno.test('repo-checker - formatBranchStatus formats checking status', () => {
  const formatted = formatBranchStatus('main', 'checking')
  assertEquals(formatted.includes('main'), true)
  assertEquals(formatted.includes('checking'), true)
  assertEquals(formatted.includes('◌'), true)
})

Deno.test('repo-checker - formatRepoStatus formats complete repo status with all present', () => {
  const status: RepoStatus = {
    repo: 'Apex-EHR/test-repo',
    branches: [
      { branch: 'dev', status: 'present' },
      { branch: 'qa', status: 'present' },
    ],
    needsWorkflow: false,
  }

  const formatted = formatRepoStatus(status)
  assertEquals(formatted.includes('Apex-EHR/test-repo'), true)
  assertEquals(formatted.includes('All workflows present'), true)
})

Deno.test('repo-checker - formatRepoStatus formats repo with missing workflows', () => {
  const status: RepoStatus = {
    repo: 'Apex-EHR/test-repo',
    branches: [
      { branch: 'dev', status: 'missing' },
      { branch: 'qa', status: 'missing' },
    ],
    needsWorkflow: true,
  }

  const formatted = formatRepoStatus(status)
  assertEquals(formatted.includes('Apex-EHR/test-repo'), true)
  assertEquals(formatted.includes('Would create PRs for missing workflows'), true)
})

Deno.test('repo-checker - formatRepoStatus does not show PR message when all present', () => {
  const statusNoWorkflow: RepoStatus = {
    repo: 'Apex-EHR/test-repo',
    branches: [{ branch: 'dev', status: 'present' }],
    needsWorkflow: false,
  }

  const formatted = formatRepoStatus(statusNoWorkflow)
  assertEquals(formatted.includes('Would create PRs'), false)
  assertEquals(formatted.includes('All workflows present'), true)
})
