/**
 * Tag index manager for efficient tag-based operations
 */
export class TagIndex {
  // Tag -> Set of keys
  private tagToKeys = new Map<string, Set<string>>()
  // Key -> Set of tags
  private keyToTags = new Map<string, Set<string>>()

  /**
   * Associates tags with a key
   */
  setTags(key: string, tags: string[]): void {
    // Remove old tags for this key
    this.removeKey(key)

    if (tags.length === 0) {
      return
    }

    // Add new tags
    const tagSet = new Set(tags)
    this.keyToTags.set(key, tagSet)

    for (const tag of tagSet) {
      if (!this.tagToKeys.has(tag)) {
        this.tagToKeys.set(tag, new Set())
      }
      this.tagToKeys.get(tag)!.add(key)
    }
  }

  /**
   * Gets tags for a key
   */
  getTags(key: string): string[] {
    const tags = this.keyToTags.get(key)
    return tags ? Array.from(tags) : []
  }

  /**
   * Adds tags to a key
   */
  addTags(key: string, tags: string[]): void {
    const existingTags = this.keyToTags.get(key) ?? new Set<string>()

    for (const tag of tags) {
      if (!existingTags.has(tag)) {
        existingTags.add(tag)

        if (!this.tagToKeys.has(tag)) {
          this.tagToKeys.set(tag, new Set())
        }
        this.tagToKeys.get(tag)!.add(key)
      }
    }

    this.keyToTags.set(key, existingTags)
  }

  /**
   * Removes tags from a key
   */
  removeTags(key: string, tags: string[]): void {
    const existingTags = this.keyToTags.get(key)
    if (!existingTags) return

    for (const tag of tags) {
      existingTags.delete(tag)

      const keysForTag = this.tagToKeys.get(tag)
      if (keysForTag) {
        keysForTag.delete(key)
        if (keysForTag.size === 0) {
          this.tagToKeys.delete(tag)
        }
      }
    }

    if (existingTags.size === 0) {
      this.keyToTags.delete(key)
    }
  }

  /**
   * Removes a key from the index
   */
  removeKey(key: string): void {
    const tags = this.keyToTags.get(key)
    if (!tags) return

    for (const tag of tags) {
      const keysForTag = this.tagToKeys.get(tag)
      if (keysForTag) {
        keysForTag.delete(key)
        if (keysForTag.size === 0) {
          this.tagToKeys.delete(tag)
        }
      }
    }

    this.keyToTags.delete(key)
  }

  /**
   * Gets all keys for a single tag
   */
  getKeysByTag(tag: string): string[] {
    const keys = this.tagToKeys.get(tag)
    return keys ? Array.from(keys) : []
  }

  /**
   * Gets keys that have ALL of the specified tags (intersection)
   */
  getKeysByTags(tags: string[]): string[] {
    if (tags.length === 0) return []
    if (tags.length === 1) return this.getKeysByTag(tags[0]!)

    // Start with keys from first tag
    const firstTag = tags[0]!
    const firstKeys = this.tagToKeys.get(firstTag)
    if (!firstKeys || firstKeys.size === 0) return []

    // Intersect with remaining tags
    const result = new Set(firstKeys)
    for (let i = 1; i < tags.length; i++) {
      const tag = tags[i]!
      const tagKeys = this.tagToKeys.get(tag)
      if (!tagKeys) return []

      for (const key of result) {
        if (!tagKeys.has(key)) {
          result.delete(key)
        }
      }

      if (result.size === 0) return []
    }

    return Array.from(result)
  }

  /**
   * Gets keys that have ANY of the specified tags (union)
   */
  getKeysByAnyTag(tags: string[]): string[] {
    const result = new Set<string>()

    for (const tag of tags) {
      const keys = this.tagToKeys.get(tag)
      if (keys) {
        for (const key of keys) {
          result.add(key)
        }
      }
    }

    return Array.from(result)
  }

  /**
   * Checks if a key has a specific tag
   */
  hasTag(key: string, tag: string): boolean {
    const tags = this.keyToTags.get(key)
    return tags ? tags.has(tag) : false
  }

  /**
   * Gets all unique tags
   */
  getAllTags(): string[] {
    return Array.from(this.tagToKeys.keys())
  }

  /**
   * Clears the entire index
   */
  clear(): void {
    this.tagToKeys.clear()
    this.keyToTags.clear()
  }
}

/**
 * Creates a new tag index
 */
export function createTagIndex(): TagIndex {
  return new TagIndex()
}
