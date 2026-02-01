import { assertEquals, assertExists } from '@std/assert'
import { BRANCHES, DEFAULT_GH_HOST, REPOS } from '../config.ts'

Deno.test('config - REPOS array has 24 repositories', () => {
  assertEquals(REPOS.length, 24)
})

Deno.test('config - REPOS contains expected repositories', () => {
  assertExists(REPOS.find((r) => r === 'Apex-EHR/apex-auth-service'))
  assertExists(REPOS.find((r) => r === 'Apex-EHR/apex-ecqm-service'))
  assertExists(REPOS.find((r) => r === 'Apex-EHR/apex-ehr-bff'))
})

Deno.test('config - BRANCHES has correct values', () => {
  assertEquals(BRANCHES, ['dev', 'qa', 'stage', 'main'])
})

Deno.test('config - DEFAULT_GH_HOST is github.com', () => {
  assertEquals(DEFAULT_GH_HOST, 'github.com')
})
