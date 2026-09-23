/**
 * Centralized error handling for the package.
 */

export class PackageError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'PackageError'
  }
}

/**
 * Logs an error with context
 */
export function logError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString()
  const contextStr = context ? JSON.stringify(context) : ''
  const errorStr =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error)

  console.error(`[${timestamp}] ${message}`)
  if (errorStr) console.error(`  Error: ${errorStr}`)
  if (contextStr) console.error(`  Context: ${contextStr}`)
}

/**
 * Wraps an async operation with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallback?: T,
): Promise<T | undefined> {
  try {
    return await operation()
  } catch (error) {
    logError(`Failed to ${operationName}`, error, { operationName })
    if (fallback !== undefined) {
      console.warn(`Proceeding with fallback value for ${operationName}`)
      return fallback
    }
    throw new PackageError(`${operationName} failed`, { cause: error })
  }
}
