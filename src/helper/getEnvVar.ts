interface EnvVarOptions<T> {
  type?: 'string' | 'number' | 'boolean'
  defaultValue?: T
  required?: boolean
  parse?: (value: string) => T
  validate?: (value: T) => void
}

/**
 * Reads an environment variable, optionally parses and validates it.
 *
 * This function allows loading environment variables in a type-safe manner, parsing, and validation.
 * It supports various types such as `string`, `number`, `boolean`, and `Date`.
 * Custom parsing and validation functions can also be provided.
 *
 * @template T The expected return type of the environment variable after parsing.
 * @param {string} name - The name of the environment variable.
 * @param {EnvVarOptions<T>} [options={}] - Optional options object for configuring parsing and validation.
 * @returns {T} The parsed and validated value of the environment variable.
 * @throws {Error} If the environment variable is not set and `required` is `true`, or if parsing or validation fails.
 *
 * @example <caption>Reading a number with a default value and validation</caption>
 * const PORT = getEnvVar('PORT', {
 *   type: 'number',
 *   defaultValue: 3000,
 *   validate: (value) => {
 *     if (value < 1024 || value > 65535) {
 *       throw new Error('PORT must be between 1024 and 65535.');
 *     }
 *   },
 * });
 *
 * @example <caption>Reading a required string with pattern validation</caption>
 * const API_URL = getEnvVar('API_URL', {
 *   type: 'string',
 *   required: true,
 *   validate: (value) => {
 *     if (!/^https?:\/\//.test(value)) {
 *       throw new Error('API_URL must start with http:// or https://.');
 *     }
 *   },
 * });
 *
 * @example <caption>Reading a date with custom parsing</caption>
 * const START_DATE = getEnvVar('START_DATE', {
 *   parse: (value) => {
 *     const date = new Date(value);
 *     if (isNaN(date.getTime())) {
 *       throw new Error('Invalid date.');
 *     }
 *     return date;
 *   },
 *   defaultValue: new Date(),
 *   validate: (date) => {
 *     if (date < new Date()) {
 *       throw new Error('START_DATE cannot be in the past.');
 *     }
 *   },
 * });
 */
function getEnvVar(
  name: string,
  options: {
    type: 'string'
    defaultValue?: string
    required?: boolean
    validate?: (value: string) => void
  },
): string
function getEnvVar(
  name: string,
  options: {
    type: 'number'
    defaultValue?: number
    required?: boolean
    validate?: (value: number) => void
  },
): number
function getEnvVar(
  name: string,
  options: {
    type: 'boolean'
    defaultValue?: boolean
    required?: boolean
    validate?: (value: boolean) => void
  },
): boolean
function getEnvVar<T>(
  name: string,
  options: {
    parse: (value: string) => T
    defaultValue?: T
    required?: boolean
    validate?: (value: T) => void
  },
): T
function getEnvVar<T>(name: string, options?: EnvVarOptions<T>): T
function getEnvVar<T>(name: string, options: EnvVarOptions<T> = {}): T {
  const {
    type = 'string',
    defaultValue,
    required = true,
    parse,
    validate,
  } = options

  const value = process.env[name]

  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue
    } else if (required) {
      throw new Error(`Environment variable ${name} is required but not set.`)
    } else {
      return defaultValue as T
    }
  }

  let parsedValue: any

  try {
    if (parse) {
      parsedValue = parse(value)
    } else if (type === 'number') {
      parsedValue = Number(value)
      if (isNaN(parsedValue)) {
        throw new Error(`Environment variable ${name} must be a valid number.`)
      }
    } else if (type === 'boolean') {
      if (value.toLowerCase() === 'true') {
        parsedValue = true
      } else if (value.toLowerCase() === 'false') {
        parsedValue = false
      } else {
        throw new Error(
          `Environment variable ${name} must be 'true' or 'false'.`,
        )
      }
    } else {
      parsedValue = value
    }

    if (validate) {
      validate(parsedValue)
    }
  } catch (error: any) {
    throw new Error(
      `Error processing environment variable ${name}: ${error.message}`,
    )
  }

  return parsedValue
}

export { getEnvVar }
