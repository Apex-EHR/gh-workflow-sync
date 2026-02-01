import { join } from '@std/path'
import { textPrompt } from './prompts.ts'
import { info, warn } from './logger.ts'

/**
 * Heuristic tests to identify GitHub workflow files
 */
function isWorkflowFile(content: string): boolean {
  // Check for common GitHub Actions workflow indicators
  const indicators = [
    /^name:\s/m, // name: at start of line
    /on:\s*\n\s+(push|pull_request|workflow_dispatch|schedule):/m, // trigger events
    /jobs:\s*\n/m, // jobs section
    /runs-on:\s/m, // runs-on keyword
    /steps:\s*\n/m, // steps section
    /uses:\s+actions\//m, // uses actions/
  ]

  return indicators.some((pattern) => pattern.test(content))
}

/**
 * Scan a directory for workflow files
 */
export async function scanForWorkflows(dir: string): Promise<string[]> {
  const workflows: string[] = []

  try {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml'))) {
        const filePath = join(dir, entry.name)
        try {
          const content = await Deno.readTextFile(filePath)
          if (isWorkflowFile(content)) {
            workflows.push(filePath)
          }
        } catch {
          // Skip files that can't be read
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return workflows
}

/**
 * Discover workflows in current directory or prompt for folder
 */
export async function discoverWorkflows(interactive: boolean): Promise<string[]> {
  const currentDir = Deno.cwd()
  info(`Scanning for workflow files in: ${currentDir}`)

  let workflows = await scanForWorkflows(currentDir)

  if (workflows.length > 0) {
    info(`Found ${workflows.length} workflow file(s)`)
    return workflows
  }

  warn('No workflow files found in current directory')

  if (!interactive) {
    throw new Error('No workflow files found. Run with --interactive to select a folder.')
  }

  // Prompt for folder path
  const folderPath = await textPrompt({
    message: 'Enter path to folder containing workflow files',
    validate: async (value) => {
      try {
        const stat = await Deno.stat(value)
        if (!stat.isDirectory) {
          return 'Path must be a directory'
        }
        return true
      } catch {
        return 'Directory not found'
      }
    },
  })

  info(`Scanning for workflow files in: ${folderPath}`)
  workflows = await scanForWorkflows(folderPath)

  if (workflows.length === 0) {
    throw new Error(`No workflow files found in: ${folderPath}`)
  }

  info(`Found ${workflows.length} workflow file(s)`)
  return workflows
}

/**
 * Select a single workflow file from discovered workflows
 */
export async function selectWorkflow(interactive: boolean, defaultPath?: string): Promise<string> {
  // If default path provided and it exists, use it
  if (defaultPath) {
    try {
      await Deno.stat(defaultPath)
      return defaultPath
    } catch {
      // Continue to discovery
    }
  }

  const workflows = await discoverWorkflows(interactive)

  if (workflows.length === 1) {
    return workflows[0]
  }

  // Multiple workflows found - need to select one
  if (!interactive) {
    // In non-interactive mode with multiple workflows, use the first one
    warn(`Multiple workflows found, using: ${workflows[0]}`)
    return workflows[0]
  }

  // Prompt user to select a workflow
  const { select } = await import('@inquirer/prompts')
  const selected = await select({
    message: 'Select a workflow file to use',
    choices: workflows.map((w) => ({
      name: w.split('/').pop() || w,
      value: w,
    })),
  })

  return selected
}
