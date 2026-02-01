import { checkbox, input } from '@inquirer/prompts'

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
