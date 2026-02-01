import { assertEquals } from '@std/assert'
import { BRANCHES, DEFAULT_GH_HOST } from '../config.ts'

Deno.test('config - BRANCHES has correct values', () => {
  assertEquals(BRANCHES, ['dev', 'qa', 'stage', 'main'])
})

Deno.test('config - DEFAULT_GH_HOST is github.com', () => {
  assertEquals(DEFAULT_GH_HOST, 'github.com')
})
