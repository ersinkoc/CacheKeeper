/**
 * Returns current timestamp in milliseconds
 */
export function now(): number {
  return Date.now()
}

/**
 * Checks if an entry is expired based on expiresAt timestamp
 */
export function isExpired(expiresAt: number | undefined): boolean {
  if (expiresAt === undefined) {
    return false
  }
  return now() >= expiresAt
}

/**
 * Checks if an entry is stale based on staleAt timestamp
 */
export function isStaleTime(staleAt: number | undefined): boolean {
  if (staleAt === undefined) {
    return false
  }
  return now() >= staleAt
}

/**
 * Calculates expiration timestamp from TTL
 */
export function calculateExpiresAt(ttl: number | undefined): number | undefined {
  if (ttl === undefined || ttl <= 0) {
    return undefined
  }
  return now() + ttl
}

/**
 * Calculates stale timestamp from stale time
 */
export function calculateStaleAt(staleTime: number | undefined): number | undefined {
  if (staleTime === undefined || staleTime <= 0) {
    return undefined
  }
  return now() + staleTime
}

/**
 * Calculates remaining TTL from expiresAt
 */
export function getRemainingTTL(expiresAt: number | undefined): number | undefined {
  if (expiresAt === undefined) {
    return undefined
  }
  const remaining = expiresAt - now()
  return remaining > 0 ? remaining : 0
}

/**
 * Converts expiration timestamp to Date object
 */
export function getExpirationDate(expiresAt: number | undefined): Date | null {
  if (expiresAt === undefined) {
    return null
  }
  return new Date(expiresAt)
}
