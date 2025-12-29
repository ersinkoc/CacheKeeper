import { useState, useEffect } from 'react'
import { useCache } from './useCache'
import type { CacheStats, UseCacheStatsOptions } from '../../../types'

/**
 * Hook for real-time cache statistics
 *
 * @example
 * ```tsx
 * function CacheMonitor() {
 *   const stats = useCacheStats({ refreshInterval: 1000 })
 *
 *   return (
 *     <div className="cache-monitor">
 *       <div>
 *         <span>Hit Rate</span>
 *         <span>{(stats.hitRate * 100).toFixed(1)}%</span>
 *       </div>
 *
 *       <div>
 *         <span>Size</span>
 *         <span>{stats.size} / {stats.maxSize}</span>
 *       </div>
 *
 *       <div>
 *         <span>Memory</span>
 *         <span>{formatBytes(stats.memoryUsage)}</span>
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 */
export function useCacheStats(options: UseCacheStatsOptions = {}): CacheStats {
  const cache = useCache()
  const { refreshInterval = 0 } = options

  const [stats, setStats] = useState<CacheStats>(() => cache.getStats())

  useEffect(() => {
    // Update stats immediately
    setStats(cache.getStats())

    // If no refresh interval, just update on mount
    if (!refreshInterval) return

    // Setup interval for real-time updates
    const interval = setInterval(() => {
      setStats(cache.getStats())
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [cache, refreshInterval])

  return stats
}
