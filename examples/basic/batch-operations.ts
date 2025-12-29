/**
 * Batch Operations Example
 *
 * Demonstrates efficient batch get, set, and delete operations
 */
import { createCache } from '@oxog/cachekeeper';

const cache = createCache({
  maxSize: 1000,
  defaultTTL: 60000,
});

// Batch set multiple values at once
cache.setMany([
  { key: 'product:1', value: { id: 1, name: 'Laptop', price: 999 } },
  { key: 'product:2', value: { id: 2, name: 'Mouse', price: 29 } },
  { key: 'product:3', value: { id: 3, name: 'Keyboard', price: 79 } },
  { key: 'product:4', value: { id: 4, name: 'Monitor', price: 299 }, ttl: 30000 },
]);

console.log('Set 4 products');

// Batch get multiple values
const products = cache.getMany(['product:1', 'product:2', 'product:5']);
console.log('Batch get results:');
console.log('  product:1:', products.get('product:1'));
console.log('  product:2:', products.get('product:2'));
console.log('  product:5:', products.get('product:5')); // undefined

// Batch delete
cache.deleteMany(['product:1', 'product:2']);
console.log('\nDeleted product:1 and product:2');
console.log('Remaining keys:', cache.keys());

// Batch check existence
const exists = cache.hasMany(['product:3', 'product:4', 'product:1']);
console.log('\nExistence check:');
console.log('  product:3:', exists.get('product:3')); // true
console.log('  product:4:', exists.get('product:4')); // true
console.log('  product:1:', exists.get('product:1')); // false
