import { checkbox, confirm, input } from '@inquirer/prompts'

/**
 * Prompt for text input with validation
 */
export async function textPrompt(options: {
  message: string
  validate?: (value: string) => boolean | string | Promise<boolean | string>
}): Promise<string> {
  return input({
    message: options.message,
    validate: options.validate,
  })
}

/**
 * Confirm yes/no prompt
 */
export async function confirmPrompt(options: {
  message: string
  defaultValue?: boolean
}): Promise<boolean> {
  return confirm({
    message: options.message,
    default: options.defaultValue ?? false,
  })
}

/**
 * Checkbox selection prompt
 * Returns array of selected values
 */
export async function checkboxPrompt<
  T extends { name: string; value: string; checked?: boolean; hint?: string },
>(
  options: {
    message: string
    options: T[]
    search?: boolean
    hint?: string
  },
): Promise<string[]> {
  const choices = options.options.map((opt) => ({
    name: opt.hint ? `${opt.name} (${opt.hint})` : opt.name,
    value: opt.value,
    checked: opt.checked ?? false,
  }))

  return checkbox({
    message: options.message,
    choices,
    instructions: options.hint,
  })
}
