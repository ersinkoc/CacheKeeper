import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createCache } from '../../../src/core/cache'
import { TagIndex, createTagIndex } from '../../../src/core/tags'
import type { CacheInstance } from '../../../src/types'

describe('Tags', () => {
  let cache: CacheInstance<unknown>

  beforeEach(() => {
    vi.useFakeTimers()
    cache = createCache()
  })

  afterEach(() => {
    cache.destroy()
    vi.useRealTimers()
  })

  describe('Setting Tags', () => {
    it('should set tags when creating entry', () => {
      cache.set('product:1', { name: 'Widget' }, {
        tags: ['products', 'electronics'],
      })

      const tags = cache.getTags('product:1')
      expect(tags).toContain('products')
      expect(tags).toContain('electronics')
    })

    it('should return empty array for entry without tags', () => {
      cache.set('key1', 'value1')
      expect(cache.getTags('key1')).toEqual([])
    })

    it('should return empty array for nonexistent key', () => {
      expect(cache.getTags('nonexistent')).toEqual([])
    })
  })

  describe('Adding Tags', () => {
    it('should add tags to existing entry', () => {
      cache.set('product:1', { name: 'Widget' }, {
        tags: ['products'],
      })

      cache.addTags('product:1', ['featured', 'sale'])

      const tags = cache.getTags('product:1')
      expect(tags).toContain('products')
      expect(tags).toContain('featured')
      expect(tags).toContain('sale')
    })

    it('should not duplicate tags', () => {
      cache.set('product:1', { name: 'Widget' }, {
        tags: ['products'],
      })

      cache.addTags('product:1', ['products', 'featured'])

      const tags = cache.getTags('product:1')
      const productsCount = tags.filter((t) => t === 'products').length
      expect(productsCount).toBe(1)
    })

    it('should return false for nonexistent key', () => {
      expect(cache.addTags('nonexistent', ['tag1'])).toBe(false)
    })
  })

  describe('Removing Tags', () => {
    it('should remove tags from entry', () => {
      cache.set('product:1', { name: 'Widget' }, {
        tags: ['products', 'electronics', 'featured'],
      })

      cache.removeTags('product:1', ['featured'])

      const tags = cache.getTags('product:1')
      expect(tags).toContain('products')
      expect(tags).toContain('electronics')
      expect(tags).not.toContain('featured')
    })

    it('should handle removing nonexistent tags', () => {
      cache.set('product:1', { name: 'Widget' }, {
        tags: ['products'],
      })

      cache.removeTags('product:1', ['nonexistent'])

      const tags = cache.getTags('product:1')
      expect(tags).toEqual(['products'])
    })

    it('should return false for nonexistent key', () => {
      expect(cache.removeTags('nonexistent', ['tag1'])).toBe(false)
    })
  })

  describe('Invalidation by Tag', () => {
    it('should invalidate entries by single tag', () => {
      cache.set('product:1', { name: 'Widget' }, { tags: ['products', 'electronics'] })
      cache.set('product:2', { name: 'Gadget' }, { tags: ['products', 'clothing'] })
      cache.set('category:1', { name: 'Tech' }, { tags: ['categories', 'electronics'] })

      const invalidated = cache.invalidateByTag('electronics')

      expect(invalidated).toBe(2)
      expect(cache.has('product:1')).toBe(false)
      expect(cache.has('product:2')).toBe(true)
      expect(cache.has('category:1')).toBe(false)
    })

    it('should invalidate entries by multiple tags (OR logic)', () => {
      cache.set('product:1', { name: 'Widget' }, { tags: ['products', 'electronics'] })
      cache.set('product:2', { name: 'Gadget' }, { tags: ['products', 'clothing'] })
      cache.set('product:3', { name: 'Thing' }, { tags: ['products', 'home'] })

      const invalidated = cache.invalidateByTag(['electronics', 'clothing'])

      expect(invalidated).toBe(2)
      expect(cache.has('product:1')).toBe(false)
      expect(cache.has('product:2')).toBe(false)
      expect(cache.has('product:3')).toBe(true)
    })

    it('should return 0 for nonexistent tag', () => {
      cache.set('product:1', { name: 'Widget' }, { tags: ['products'] })
      expect(cache.invalidateByTag('nonexistent')).toBe(0)
    })
  })

  describe('Getting Keys by Tag', () => {
    it('should get keys by single tag', () => {
      cache.set('product:1', { name: 'Widget' }, { tags: ['products', 'electronics'] })
      cache.set('product:2', { name: 'Gadget' }, { tags: ['products', 'clothing'] })
      cache.set('category:1', { name: 'Tech' }, { tags: ['categories'] })

      const keys = cache.getKeysByTag('products')
      expect(keys).toContain('product:1')
      expect(keys).toContain('product:2')
      expect(keys).not.toContain('category:1')
    })

    it('should get keys by multiple tags (intersection)', () => {
      cache.set('product:1', { name: 'Widget' }, { tags: ['products', 'electronics', 'featured'] })
      cache.set('product:2', { name: 'Gadget' }, { tags: ['products', 'electronics'] })
      cache.set('product:3', { name: 'Thing' }, { tags: ['products', 'featured'] })

      const keys = cache.getKeysByTag(['products', 'electronics'])
      expect(keys).toContain('product:1')
      expect(keys).toContain('product:2')
      expect(keys).not.toContain('product:3')
    })

    it('should return empty array for nonexistent tag', () => {
      expect(cache.getKeysByTag('nonexistent')).toEqual([])
    })
  })

  describe('Tag Cleanup', () => {
    it('should clean up tags when entry is deleted', () => {
      cache.set('product:1', { name: 'Widget' }, { tags: ['products'] })

      cache.delete('product:1')

      const keys = cache.getKeysByTag('products')
      expect(keys).not.toContain('product:1')
    })

    it('should clean up tags when cache is cleared', () => {
      cache.set('product:1', { name: 'Widget' }, { tags: ['products'] })
      cache.set('product:2', { name: 'Gadget' }, { tags: ['products'] })

      cache.clear()

      expect(cache.getKeysByTag('products')).toEqual([])
    })
  })
})

describe('TagIndex Direct Tests', () => {
  let tagIndex: TagIndex

  beforeEach(() => {
    tagIndex = new TagIndex()
  })

  describe('getAllTags', () => {
    it('should return empty array when no tags exist', () => {
      expect(tagIndex.getAllTags()).toEqual([])
    })

    it('should return all unique tags', () => {
      tagIndex.setTags('key1', ['tag1', 'tag2'])
      tagIndex.setTags('key2', ['tag2', 'tag3'])

      const allTags = tagIndex.getAllTags()
      expect(allTags).toContain('tag1')
      expect(allTags).toContain('tag2')
      expect(allTags).toContain('tag3')
      expect(allTags.length).toBe(3)
    })
  })

  describe('createTagIndex factory', () => {
    it('should create a new TagIndex instance', () => {
      const index = createTagIndex()
      expect(index).toBeInstanceOf(TagIndex)
    })

    it('should create independent instances', () => {
      const index1 = createTagIndex()
      const index2 = createTagIndex()

      index1.setTags('key1', ['tag1'])
      expect(index2.getAllTags()).toEqual([])
    })
  })

  describe('removeTags edge cases', () => {
    it('should remove tag from tagToKeys when last key is removed', () => {
      // Add tag to a key
      tagIndex.setTags('key1', ['tag1', 'tag2'])
      expect(tagIndex.getAllTags()).toContain('tag1')

      // Remove tag1 from key1 - this should delete tag1 from tagToKeys
      tagIndex.removeTags('key1', ['tag1'])

      // tag1 should no longer exist in getAllTags
      expect(tagIndex.getAllTags()).not.toContain('tag1')
      expect(tagIndex.getAllTags()).toContain('tag2')
    })

    it('should remove key from keyToTags when all tags are removed', () => {
      tagIndex.setTags('key1', ['tag1'])

      // Remove the only tag
      tagIndex.removeTags('key1', ['tag1'])

      // Key should no longer have any tags
      expect(tagIndex.getTags('key1')).toEqual([])
      expect(tagIndex.getAllTags()).toEqual([])
    })

    it('should handle removing tags from nonexistent key', () => {
      // Should not throw
      tagIndex.removeTags('nonexistent', ['tag1'])
      expect(tagIndex.getAllTags()).toEqual([])
    })
  })

  describe('hasTag', () => {
    it('should return true when key has the tag', () => {
      tagIndex.setTags('key1', ['tag1', 'tag2'])
      expect(tagIndex.hasTag('key1', 'tag1')).toBe(true)
    })

    it('should return false when key does not have the tag', () => {
      tagIndex.setTags('key1', ['tag1'])
      expect(tagIndex.hasTag('key1', 'tag2')).toBe(false)
    })

    it('should return false for nonexistent key', () => {
      expect(tagIndex.hasTag('nonexistent', 'tag1')).toBe(false)
    })
  })

  describe('getKeysByTags intersection', () => {
    it('should return empty array for empty tags array', () => {
      tagIndex.setTags('key1', ['tag1'])
      expect(tagIndex.getKeysByTags([])).toEqual([])
    })

    it('should return single key when only one matches all tags', () => {
      tagIndex.setTags('key1', ['tag1', 'tag2', 'tag3'])
      tagIndex.setTags('key2', ['tag1', 'tag2'])

      const keys = tagIndex.getKeysByTags(['tag1', 'tag2', 'tag3'])
      expect(keys).toEqual(['key1'])
    })

    it('should return empty when first tag has no keys', () => {
      tagIndex.setTags('key1', ['tag2'])
      expect(tagIndex.getKeysByTags(['tag1', 'tag2'])).toEqual([])
    })

    it('should return empty when subsequent tag has no keys', () => {
      tagIndex.setTags('key1', ['tag1'])
      expect(tagIndex.getKeysByTags(['tag1', 'tag2'])).toEqual([])
    })
  })

  describe('removeKey edge cases', () => {
    it('should handle removing nonexistent key', () => {
      // Should not throw
      tagIndex.removeKey('nonexistent')
    })

    it('should clean up empty tag sets when removing key', () => {
      tagIndex.setTags('key1', ['tag1'])
      tagIndex.setTags('key2', ['tag1', 'tag2'])

      // Remove key1 - tag1 should still exist because key2 has it
      tagIndex.removeKey('key1')
      expect(tagIndex.getAllTags()).toContain('tag1')

      // Remove key2 - now tag1 and tag2 should be gone
      tagIndex.removeKey('key2')
      expect(tagIndex.getAllTags()).toEqual([])
    })
  })

  describe('setTags', () => {
    it('should clear previous tags when setting new tags', () => {
      tagIndex.setTags('key1', ['tag1', 'tag2'])
      tagIndex.setTags('key1', ['tag3'])

      expect(tagIndex.getTags('key1')).toEqual(['tag3'])
      expect(tagIndex.getAllTags()).not.toContain('tag1')
      expect(tagIndex.getAllTags()).not.toContain('tag2')
    })

    it('should handle setting empty tags array', () => {
      tagIndex.setTags('key1', ['tag1'])
      tagIndex.setTags('key1', [])

      expect(tagIndex.getTags('key1')).toEqual([])
    })
  })

  describe('addTags', () => {
    it('should create new tag set when adding to key without tags', () => {
      tagIndex.addTags('key1', ['tag1'])
      expect(tagIndex.getTags('key1')).toEqual(['tag1'])
    })

    it('should not add duplicate tags', () => {
      tagIndex.setTags('key1', ['tag1'])
      tagIndex.addTags('key1', ['tag1', 'tag2'])

      const tags = tagIndex.getTags('key1')
      expect(tags.filter(t => t === 'tag1').length).toBe(1)
      expect(tags).toContain('tag2')
    })
  })

  describe('getKeysByAnyTag', () => {
    it('should return empty array for empty tags', () => {
      tagIndex.setTags('key1', ['tag1'])
      expect(tagIndex.getKeysByAnyTag([])).toEqual([])
    })

    it('should return union of keys for multiple tags', () => {
      tagIndex.setTags('key1', ['tag1'])
      tagIndex.setTags('key2', ['tag2'])
      tagIndex.setTags('key3', ['tag3'])

      const keys = tagIndex.getKeysByAnyTag(['tag1', 'tag2'])
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).not.toContain('key3')
    })
  })

  describe('clear', () => {
    it('should remove all tags and key associations', () => {
      tagIndex.setTags('key1', ['tag1', 'tag2'])
      tagIndex.setTags('key2', ['tag2', 'tag3'])

      tagIndex.clear()

      expect(tagIndex.getAllTags()).toEqual([])
      expect(tagIndex.getTags('key1')).toEqual([])
      expect(tagIndex.getTags('key2')).toEqual([])
    })
  })
})
