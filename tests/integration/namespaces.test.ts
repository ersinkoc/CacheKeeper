/**
 * Integration Tests - Namespaces
 *
 * Tests namespace isolation and hierarchical operations
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCache } from '../../src';

describe('Namespace Integration', () => {
  describe('Namespace Isolation', () => {
    it('should completely isolate namespace data', () => {
      const cache = createCache({ maxSize: 1000 });

      const usersNs = cache.namespace('users');
      const productsNs = cache.namespace('products');
      const ordersNs = cache.namespace('orders');

      usersNs.set('1', { type: 'user', name: 'Alice' });
      productsNs.set('1', { type: 'product', name: 'Laptop' });
      ordersNs.set('1', { type: 'order', total: 999 });

      expect(usersNs.get('1')).toEqual({ type: 'user', name: 'Alice' });
      expect(productsNs.get('1')).toEqual({ type: 'product', name: 'Laptop' });
      expect(ordersNs.get('1')).toEqual({ type: 'order', total: 999 });

      expect(usersNs.size).toBe(1);
      expect(productsNs.size).toBe(1);
      expect(ordersNs.size).toBe(1);

      usersNs.clear();
      expect(usersNs.size).toBe(0);
      expect(productsNs.size).toBe(1);
      expect(ordersNs.size).toBe(1);
    });

    it('should support nested namespaces', () => {
      const cache = createCache({ maxSize: 1000 });

      const apiNs = cache.namespace('api');
      const v1Ns = apiNs.namespace('v1');
      const v2Ns = apiNs.namespace('v2');

      v1Ns.set('users', { version: 1, data: ['alice', 'bob'] });
      v2Ns.set('users', { version: 2, data: [{ name: 'alice' }, { name: 'bob' }] });

      expect(v1Ns.get('users')).toEqual({ version: 1, data: ['alice', 'bob'] });
      expect(v2Ns.get('users')).toEqual({ version: 2, data: [{ name: 'alice' }, { name: 'bob' }] });

      apiNs.clear();
      expect(v1Ns.size).toBe(0);
      expect(v2Ns.size).toBe(0);
    });
  });

  describe('Namespace Operations', () => {
    it('should support basic cache operations within namespace', () => {
      const cache = createCache({ maxSize: 1000 });
      const ns = cache.namespace('test');

      ns.set('key1', 'value1');
      expect(ns.get('key1')).toBe('value1');
      expect(ns.has('key1')).toBe(true);
      ns.delete('key1');
      expect(ns.has('key1')).toBe(false);

      ns.set('key2', 'value2');
      ns.set('key3', 'value3');

      expect(ns.keys()).toContain('key2');
      expect(ns.keys()).toContain('key3');
      expect(ns.values()).toContain('value2');
      expect(ns.values()).toContain('value3');

      const entries = ns.entries();
      expect(entries).toContainEqual(['key2', 'value2']);
      expect(entries).toContainEqual(['key3', 'value3']);
    });
  });

  describe('Namespace TTL', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should respect TTL within namespace', () => {
      const cache = createCache({ maxSize: 1000, defaultTTL: 10000 });
      const ns = cache.namespace('ttl-test');

      ns.set('default-ttl', 'value');
      ns.set('custom-ttl', 'value', { ttl: 5000 });
      ns.set('no-ttl', 'value', { ttl: 0 });

      vi.advanceTimersByTime(6000);

      expect(ns.get('default-ttl')).toBe('value');
      expect(ns.get('custom-ttl')).toBeUndefined();
      expect(ns.get('no-ttl')).toBe('value');

      vi.advanceTimersByTime(5000);

      expect(ns.get('default-ttl')).toBeUndefined();
      expect(ns.get('no-ttl')).toBe('value');
    });
  });

  describe('Namespace Statistics', () => {
    it('should track namespace-specific statistics', () => {
      const cache = createCache({ maxSize: 1000 });

      const ns1 = cache.namespace('stats1');
      const ns2 = cache.namespace('stats2');

      ns1.set('a', 1);
      ns1.set('b', 2);
      ns2.set('x', 10);

      ns1.get('a');
      ns1.get('b');
      ns2.get('x');
      ns1.get('missing');
      ns2.get('missing');

      const stats1 = ns1.getStats();
      const stats2 = ns2.getStats();

      expect(stats1.size).toBe(2);
      expect(stats2.size).toBe(1);
    });
  });

  describe('Multi-tenant Scenario', () => {
    it('should support multi-tenant caching', () => {
      const cache = createCache({ maxSize: 10000 });

      function getTenantCache(tenantId: string) {
        return cache.namespace(`tenant:${tenantId}`);
      }

      const tenant1 = getTenantCache('acme');
      const tenant2 = getTenantCache('globex');

      tenant1.set('settings', { theme: 'blue', plan: 'premium' });
      tenant2.set('settings', { theme: 'green', plan: 'free' });

      tenant1.set('users:count', 100);
      tenant2.set('users:count', 50);

      expect(tenant1.get('settings')).toEqual({ theme: 'blue', plan: 'premium' });
      expect(tenant2.get('settings')).toEqual({ theme: 'green', plan: 'free' });

      expect(tenant1.get('users:count')).toBe(100);
      expect(tenant2.get('users:count')).toBe(50);

      tenant1.clear();
      expect(tenant1.size).toBe(0);
      expect(tenant2.size).toBe(2);
    });
  });

  describe('Namespace Events', () => {
    it('should emit events with namespace context', () => {
      const cache = createCache({ maxSize: 1000 });
      const ns = cache.namespace('events');

      const events: Array<{ type: string; key: string }> = [];

      cache.on('set', (e) => events.push({ type: 'set', key: e.key }));
      cache.on('hit', (e) => events.push({ type: 'hit', key: e.key }));
      cache.on('miss', (e) => events.push({ type: 'miss', key: e.key }));

      ns.set('test', 'value');
      ns.get('test');
      ns.get('missing');

      expect(events).toContainEqual({ type: 'set', key: 'events:test' });
      expect(events).toContainEqual({ type: 'hit', key: 'events:test' });
      expect(events).toContainEqual({ type: 'miss', key: 'events:missing' });
    });
  });
});
