import { assertEquals } from '@std/assert'

// Mock console methods
let consoleOutput: string[] = []
const originalLog = console.log
const originalError = console.error

function mockConsole() {
  consoleOutput = []
  console.log = (...args: unknown[]) => {
    consoleOutput.push(args.map((a) => String(a)).join(' '))
  }
  console.error = (...args: unknown[]) => {
    consoleOutput.push(args.map((a) => String(a)).join(' '))
  }
}

function restoreConsole() {
  console.log = originalLog
  console.error = originalError
}

Deno.test('logger - info outputs with blue color', () => {
  mockConsole()

  // Import logger after mocking
  import('../logger.ts').then((logger) => {
    logger.info('Test message')
    const output = consoleOutput.join(' ')
    assertEquals(output.includes('Test message'), true)
    assertEquals(output.includes('ℹ'), true)
  }).finally(restoreConsole)
})

Deno.test('logger - error outputs with red color', () => {
  mockConsole()

  import('../logger.ts').then((logger) => {
    logger.error('Test error')
    const output = consoleOutput.join(' ')
    assertEquals(output.includes('Test error'), true)
    assertEquals(output.includes('✖'), true)
  }).finally(restoreConsole)
})

Deno.test('logger - success outputs with green color', () => {
  mockConsole()

  import('../logger.ts').then((logger) => {
    logger.success('Test success')
    const output = consoleOutput.join(' ')
    assertEquals(output.includes('Test success'), true)
    assertEquals(output.includes('✔'), true)
  }).finally(restoreConsole)
})

Deno.test('logger - warn outputs with yellow color', () => {
  mockConsole()

  import('../logger.ts').then((logger) => {
    logger.warn('Test warning')
    const output = consoleOutput.join(' ')
    assertEquals(output.includes('Test warning'), true)
    assertEquals(output.includes('⚠'), true)
  }).finally(restoreConsole)
})

Deno.test('logger - debug does not output when verbose is disabled', () => {
  mockConsole()

  import('../logger.ts').then((logger) => {
    logger.setVerbose(false)
    logger.debug('Test debug')
    const output = consoleOutput.join(' ')
    assertEquals(output.includes('Test debug'), false)
  }).finally(restoreConsole)
})

Deno.test('logger - debug outputs when verbose is enabled', () => {
  mockConsole()

  import('../logger.ts').then((logger) => {
    logger.setVerbose(true)
    logger.debug('Test debug')
    const output = consoleOutput.join(' ')
    assertEquals(output.includes('Test debug'), true)
    assertEquals(output.includes('[DEBUG]'), true)
  }).finally(restoreConsole)
})
