import type { CachePlugin, CacheInstance, CacheEntry, SetOptions } from '../types'

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Logger interface
 */
export interface Logger {
  debug: (message: string, ...args: unknown[]) => void
  info: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
}

/**
 * Logging plugin options
 */
export interface LoggingPluginOptions {
  /**
   * Logger instance (defaults to console)
   */
  logger?: Logger

  /**
   * Minimum log level to output
   * Default: 'info'
   */
  level?: LogLevel

  /**
   * Prefix for log messages
   * Default: '[Cache]'
   */
  prefix?: string

  /**
   * Whether to log values (may expose sensitive data)
   * Default: false
   */
  logValues?: boolean
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Creates a logging plugin for cache debugging
 */
export function loggingPlugin<T = unknown>(
  options: LoggingPluginOptions = {}
): CachePlugin<T> {
  const logger = options.logger ?? console
  const minLevel = LOG_LEVELS[options.level ?? 'info']
  const prefix = options.prefix ?? '[Cache]'
  const logValues = options.logValues ?? false

  const shouldLog = (level: LogLevel): boolean => {
    return LOG_LEVELS[level] >= minLevel
  }

  const log = (level: LogLevel, message: string, ...args: unknown[]): void => {
    if (!shouldLog(level)) return
    const logFn = logger[level]
    logFn(`${prefix} ${message}`, ...args)
  }

  return {
    name: 'logging',

    onInit(cache: CacheInstance<T>): void {
      log('info', 'Cache initialized', {
        maxSize: cache.maxSize,
      })
    },

    onDestroy(_cache: CacheInstance<T>): void {
      log('info', 'Cache destroyed')
    },

    beforeGet(key: string): void {
      log('debug', `GET ${key}`)
    },

    afterGet(key: string, value: T | undefined): T | undefined {
      if (value !== undefined) {
        log('debug', `HIT ${key}`, logValues ? { value } : undefined)
      } else {
        log('debug', `MISS ${key}`)
      }
      return value
    },

    beforeSet(
      key: string,
      value: T,
      setOptions?: SetOptions
    ): { value: T; options?: SetOptions } | void {
      log('debug', `SET ${key}`, {
        ...(logValues ? { value } : {}),
        ttl: setOptions?.ttl,
        tags: setOptions?.tags,
      })
      return undefined
    },

    afterSet(key: string, entry: CacheEntry<T>): void {
      log('debug', `STORED ${key}`, {
        size: entry.size,
        ttl: entry.ttl,
        tags: entry.tags,
      })
    },

    beforeDelete(key: string): boolean {
      log('debug', `DELETE ${key}`)
      return true
    },

    afterDelete(key: string, _value: T): void {
      log('debug', `DELETED ${key}`)
    },
  }
}
