import chalk from 'chalk'

let verboseEnabled = false

export function setVerbose(enabled: boolean): void {
  verboseEnabled = enabled
}

export function info(message: string): void {
  console.log(chalk.bold.blue('ℹ'), message)
}

export function warn(message: string): void {
  console.log(chalk.bold.yellow('⚠'), message)
}

export function error(message: string): void {
  console.error(chalk.bold.red('✖'), message)
}

export function success(message: string): void {
  console.log(chalk.bold.green('✔'), message)
}

export function debug(message: string): void {
  if (verboseEnabled) {
    console.log(chalk.gray(`[DEBUG] ${message}`))
  }
}

export function log(message: string): void {
  console.log(message)
}

// Write without newline for in-place updates
export function write(message: string): void {
  Deno.stdout.writeSync(new TextEncoder().encode(message))
}

// Clear current line and move cursor to beginning
export function clearLine(): void {
  Deno.stdout.writeSync(new TextEncoder().encode('\r\x1b[K'))
}

// Status colors for branch states
export const statusColors = {
  present: chalk.green,
  missing: chalk.red,
  notFound: chalk.gray,
  checking: chalk.yellow,
}
