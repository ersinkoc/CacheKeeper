/**
 * Integration Tests - Tags
 *
 * Tests tag-based cache invalidation and organization
 */
import { describe, it, expect } from 'vitest';
import { createCache } from '../../src';

describe('Tags Integration', () => {
  describe('Tag-based Invalidation', () => {
    it('should invalidate all entries with a specific tag', () => {
      const cache = createCache({ maxSize: 1000 });

      cache.set('user:1', { id: 1, name: 'Alice' }, { tags: ['users', 'active'] });
      cache.set('user:2', { id: 2, name: 'Bob' }, { tags: ['users', 'active'] });
      cache.set('user:3', { id: 3, name: 'Charlie' }, { tags: ['users', 'inactive'] });
      cache.set('product:1', { id: 1, name: 'Laptop' }, { tags: ['products'] });
      cache.set('config', { theme: 'dark' }, { tags: ['settings'] });

      expect(cache.size).toBe(5);

      cache.invalidateByTag('users');

      expect(cache.size).toBe(2);
      expect(cache.has('user:1')).toBe(false);
      expect(cache.has('user:2')).toBe(false);
      expect(cache.has('user:3')).toBe(false);
      expect(cache.has('product:1')).toBe(true);
      expect(cache.has('config')).toBe(true);
    });

    it('should invalidate entries with multiple tags', () => {
      const cache = createCache({ maxSize: 1000 });

      cache.set('post:1', { id: 1 }, { tags: ['posts', 'user:1', 'category:tech'] });
      cache.set('post:2', { id: 2 }, { tags: ['posts', 'user:1', 'category:news'] });
      cache.set('post:3', { id: 3 }, { tags: ['posts', 'user:2', 'category:tech'] });
      cache.set('comment:1', { id: 1 }, { tags: ['comments', 'user:1'] });

      cache.invalidateByTag('user:1');

      expect(cache.has('post:1')).toBe(false);
      expect(cache.has('post:2')).toBe(false);
      expect(cache.has('post:3')).toBe(true);
      expect(cache.has('comment:1')).toBe(false);
    });

    it('should invalidate by multiple tags using array', () => {
      const cache = createCache({ maxSize: 1000 });

      cache.set('item:1', 1, { tags: ['a'] });
      cache.set('item:2', 2, { tags: ['b'] });
      cache.set('item:3', 3, { tags: ['c'] });
      cache.set('item:4', 4, { tags: ['a', 'b'] });

      cache.invalidateByTag(['a', 'b']);

      expect(cache.has('item:1')).toBe(false);
      expect(cache.has('item:2')).toBe(false);
      expect(cache.has('item:3')).toBe(true);
      expect(cache.has('item:4')).toBe(false);
    });
  });

  describe('Tag Retrieval', () => {
    it('should get all keys by tag', () => {
      const cache = createCache({ maxSize: 1000 });

      cache.set('user:1', { id: 1 }, { tags: ['users', 'premium'] });
      cache.set('user:2', { id: 2 }, { tags: ['users', 'free'] });
      cache.set('user:3', { id: 3 }, { tags: ['users', 'premium'] });
      cache.set('product:1', { id: 1 }, { tags: ['products'] });

      const premiumUsers = cache.getKeysByTag('premium');
      expect(premiumUsers).toHaveLength(2);
      expect(premiumUsers).toContain('user:1');
      expect(premiumUsers).toContain('user:3');

      const allUsers = cache.getKeysByTag('users');
      expect(allUsers).toHaveLength(3);
    });

    it('should get tags for a specific key', () => {
      const cache = createCache({ maxSize: 1000 });

      cache.set('user:1', { id: 1 }, { tags: ['users', 'premium', 'active'] });

      const tags = cache.getTags('user:1');
      expect(tags).toHaveLength(3);
      expect(tags).toContain('users');
      expect(tags).toContain('premium');
      expect(tags).toContain('active');
    });
  });

  describe('Dynamic Tag Management', () => {
    it('should add tags to existing entries', () => {
      const cache = createCache({ maxSize: 1000 });

      cache.set('user:1', { id: 1 }, { tags: ['users'] });
      expect(cache.getTags('user:1')).toEqual(['users']);

      cache.addTags('user:1', ['premium', 'verified']);
      expect(cache.getTags('user:1')).toContain('users');
      expect(cache.getTags('user:1')).toContain('premium');
      expect(cache.getTags('user:1')).toContain('verified');
    });

    it('should remove tags from existing entries', () => {
      const cache = createCache({ maxSize: 1000 });

      cache.set('user:1', { id: 1 }, { tags: ['users', 'premium', 'verified'] });

      cache.removeTags('user:1', ['premium']);

      const tags = cache.getTags('user:1');
      expect(tags).toContain('users');
      expect(tags).toContain('verified');
      expect(tags).not.toContain('premium');

      expect(cache.getKeysByTag('users')).toContain('user:1');
      expect(cache.getKeysByTag('premium')).not.toContain('user:1');
    });
  });

  describe('Complex Tag Scenarios', () => {
    it('should handle hierarchical tag patterns', () => {
      const cache = createCache({ maxSize: 1000 });

      cache.set('post:1', { title: 'React Guide' }, { tags: ['posts', 'category:tech', 'author:alice'] });
      cache.set('post:2', { title: 'Cooking Tips' }, { tags: ['posts', 'category:lifestyle', 'author:bob'] });
      cache.set('post:3', { title: 'TypeScript Tips' }, { tags: ['posts', 'category:tech', 'author:alice'] });

      const techPosts = cache.getKeysByTag('category:tech');
      expect(techPosts).toHaveLength(2);

      const alicePosts = cache.getKeysByTag('author:alice');
      expect(alicePosts).toHaveLength(2);

      cache.invalidateByTag('author:alice');
      expect(cache.has('post:1')).toBe(false);
      expect(cache.has('post:2')).toBe(true);
      expect(cache.has('post:3')).toBe(false);
    });

    it('should handle e-commerce product tagging', () => {
      const cache = createCache({ maxSize: 1000 });

      cache.set('product:laptop-1', { name: 'MacBook Pro', price: 1999 }, { tags: ['products', 'category:electronics', 'brand:apple', 'in-stock'] });
      cache.set('product:phone-1', { name: 'iPhone 15', price: 999 }, { tags: ['products', 'category:electronics', 'brand:apple', 'in-stock'] });
      cache.set('product:shirt-1', { name: 'T-Shirt', price: 29 }, { tags: ['products', 'category:clothing', 'brand:generic', 'in-stock'] });

      const appleProducts = cache.getKeysByTag('brand:apple');
      expect(appleProducts).toHaveLength(2);

      cache.removeTags('product:phone-1', ['in-stock']);
      cache.addTags('product:phone-1', ['out-of-stock']);

      const inStockProducts = cache.getKeysByTag('in-stock');
      expect(inStockProducts).toHaveLength(2);
      expect(inStockProducts).not.toContain('product:phone-1');

      cache.invalidateByTag('brand:apple');
      expect(cache.has('product:laptop-1')).toBe(false);
      expect(cache.has('product:phone-1')).toBe(false);
      expect(cache.has('product:shirt-1')).toBe(true);
    });
  });

  describe('Tag with Namespaces', () => {
    it('should work with tags in namespaces using parent cache', () => {
      const cache = createCache({ maxSize: 1000 });
      const apiCache = cache.namespace('api');

      apiCache.set('users:list', [1, 2, 3], { tags: ['users', 'list'] });
      apiCache.set('users:1', { id: 1 }, { tags: ['users', 'detail'] });
      apiCache.set('products:list', [1, 2], { tags: ['products', 'list'] });

      cache.invalidateByTag('users');

      expect(apiCache.has('users:list')).toBe(false);
      expect(apiCache.has('users:1')).toBe(false);
      expect(apiCache.has('products:list')).toBe(true);
    });
  });

  describe('Tag Events', () => {
    it('should emit events on tag operations', () => {
      const cache = createCache({ maxSize: 1000 });

      const deletedKeys: string[] = [];
      cache.on('delete', (e) => deletedKeys.push(e.key));

      cache.set('item:1', 1, { tags: ['group-a'] });
      cache.set('item:2', 2, { tags: ['group-a'] });
      cache.set('item:3', 3, { tags: ['group-b'] });

      cache.invalidateByTag('group-a');

      expect(deletedKeys).toContain('item:1');
      expect(deletedKeys).toContain('item:2');
      expect(deletedKeys).not.toContain('item:3');
    });
  });

  describe('Tag Performance', () => {
    it('should handle large number of tags efficiently', () => {
      const cache = createCache({ maxSize: 10000 });

      for (let i = 0; i < 1000; i++) {
        const tags = [
          `category:${i % 10}`,
          `type:${i % 5}`,
          `group:${i % 20}`,
          i % 2 === 0 ? 'even' : 'odd',
        ];
        cache.set(`item:${i}`, { id: i }, { tags });
      }

      expect(cache.size).toBe(1000);

      const startTime = Date.now();
      cache.invalidateByTag('even');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
      expect(cache.size).toBe(500);

      const oddItems = cache.getKeysByTag('odd');
      expect(oddItems.length).toBe(500);
    });
  });
});
