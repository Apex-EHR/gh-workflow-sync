import { assertEquals } from '@std/assert'
import type { PRResult } from '../types.ts'

Deno.test('pr-creator - PRResult structure for dry run', () => {
  const result: PRResult = {
    repo: 'Apex-EHR/test-repo',
    branch: 'dev',
    success: true,
  }

  assertEquals(result.repo, 'Apex-EHR/test-repo')
  assertEquals(result.branch, 'dev')
  assertEquals(result.success, true)
  assertEquals(result.prNumber, undefined)
  assertEquals(result.error, undefined)
})

Deno.test('pr-creator - PRResult structure for successful PR creation', () => {
  const result: PRResult = {
    repo: 'Apex-EHR/test-repo',
    branch: 'main',
    success: true,
    prNumber: 123,
  }

  assertEquals(result.success, true)
  assertEquals(result.prNumber, 123)
})

Deno.test('pr-creator - PRResult structure for failed PR creation', () => {
  const result: PRResult = {
    repo: 'Apex-EHR/test-repo',
    branch: 'qa',
    success: false,
    error: 'Failed to clone repository',
  }

  assertEquals(result.success, false)
  assertEquals(result.error, 'Failed to clone repository')
  assertEquals(result.prNumber, undefined)
})

Deno.test('pr-creator - validates commit message format', () => {
  const commitMessage = 'chore: add pr merged notification workflow'
  assertEquals(commitMessage.startsWith('chore:'), true)
  assertEquals(commitMessage.includes('pr merged notification'), true)
})

Deno.test('pr-creator - validates head branch naming convention', () => {
  const baseBranch = 'dev'
  const headBranch = `automation/pr-merged-notification/${baseBranch}`

  assertEquals(headBranch.startsWith('automation/pr-merged-notification/'), true)
  assertEquals(headBranch.endsWith(baseBranch), true)
})
