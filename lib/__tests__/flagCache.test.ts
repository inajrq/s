/**
 * 国旗缓存模块属性测试
 * 
 * Property 1: Flag Cache Hit - 重复请求应从缓存返回
 * Property 6: Flag Cache Size Limit - 缓存大小不超过 50
 * 
 * Validates: Requirements 1.1, 1.2, 6.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  loadFlagIcon,
  getCacheSize,
  clearCache,
  isCached,
  getCachedCodes,
} from '../flagCache';

// 有效的国家代码列表（用于生成测试数据）
const VALID_COUNTRY_CODES = [
  'US', 'CN', 'HK', 'TW', 'JP', 'KR', 'GB', 'DE', 'FR', 'AU',
  'CA', 'IT', 'ES', 'NL', 'SE', 'CH', 'PL', 'TR', 'RU', 'IN',
  'BR', 'MX', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'NZ', 'IE',
  'AT', 'BE', 'DK', 'FI', 'NO', 'PT', 'GR', 'CZ', 'HU', 'RO',
  'UA', 'ZA', 'EG', 'NG', 'KE', 'AR', 'CL', 'CO', 'PE', 'VE',
  'SA', 'AE', 'IL', 'PK', 'BD',
];

// 国家代码生成器
const countryCodeArb = fc.constantFrom(...VALID_COUNTRY_CODES);

describe('Flag Cache Module', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('Property 1: Flag Cache Hit', () => {
    /**
     * Feature: performance-optimization, Property 1: Flag Cache Hit
     * 
     * For any country code that has been previously loaded,
     * subsequent requests SHALL return the cached component
     * without triggering a new dynamic import.
     */
    it('should return cached component for repeated requests', async () => {
      await fc.assert(
        fc.asyncProperty(countryCodeArb, async (countryCode) => {
          // 清空缓存
          clearCache();
          
          // 第一次加载
          const firstResult = await loadFlagIcon(countryCode);
          
          // 如果加载成功，验证缓存行为
          if (firstResult !== null) {
            // 应该已缓存
            expect(isCached(countryCode)).toBe(true);
            
            // 第二次加载应该返回相同的组件
            const secondResult = await loadFlagIcon(countryCode);
            expect(secondResult).toBe(firstResult);
            
            // 缓存仍然存在
            expect(isCached(countryCode)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should serve from cache without new import for same country', async () => {
      // 加载一个国旗
      const result1 = await loadFlagIcon('US');
      expect(result1).not.toBeNull();
      expect(isCached('US')).toBe(true);
      
      // 记录缓存大小
      const sizeAfterFirst = getCacheSize();
      
      // 再次加载同一个国旗
      const result2 = await loadFlagIcon('US');
      
      // 应该返回相同的组件引用
      expect(result2).toBe(result1);
      
      // 缓存大小不应增加
      expect(getCacheSize()).toBe(sizeAfterFirst);
    });
  });

  describe('Property 6: Flag Cache Size Limit', () => {
    /**
     * Feature: performance-optimization, Property 6: Flag Cache Size Limit
     * 
     * For any sequence of flag loads, the cache size SHALL never
     * exceed MAX_CACHE_SIZE (50 entries). When the limit is reached,
     * the oldest entry SHALL be evicted.
     */
    it('should never exceed maximum cache size of 30', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(countryCodeArb, { minLength: 1, maxLength: 60 }),
          async (countryCodes) => {
            clearCache();
            
            // 加载所有国旗
            for (const code of countryCodes) {
              await loadFlagIcon(code);
            }
            
            // 缓存大小不应超过 30
            expect(getCacheSize()).toBeLessThanOrEqual(30);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should evict oldest entry when cache is full', async () => {
      clearCache();
      
      // 加载 30 个不同的国旗
      const codes = VALID_COUNTRY_CODES.slice(0, 30);
      for (const code of codes) {
        await loadFlagIcon(code);
      }
      
      expect(getCacheSize()).toBe(30);
      
      // 记录第一个加载的国家
      const firstCode = codes[0];
      expect(isCached(firstCode)).toBe(true);
      
      // 加载一个新的国旗（不在前 30 个中）
      const newCode = VALID_COUNTRY_CODES[35];
      await loadFlagIcon(newCode);
      
      // 缓存大小仍然是 30
      expect(getCacheSize()).toBe(30);
      
      // 新的应该在缓存中
      expect(isCached(newCode)).toBe(true);
      
      // 最旧的应该被淘汰
      expect(isCached(firstCode)).toBe(false);
    });

    it('should maintain LRU order - recently used items stay in cache', async () => {
      clearCache();
      
      // 加载 50 个国旗
      const codes = VALID_COUNTRY_CODES.slice(0, 50);
      for (const code of codes) {
        await loadFlagIcon(code);
      }
      
      // 访问第一个（使其成为最近使用）
      await loadFlagIcon(codes[0]);
      
      // 加载一个新的
      const newCode = VALID_COUNTRY_CODES[54];
      await loadFlagIcon(newCode);
      
      // 第一个应该仍在缓存中（因为刚被访问）
      expect(isCached(codes[0])).toBe(true);
      
      // 第二个应该被淘汰（因为是最旧的未访问项）
      expect(isCached(codes[1])).toBe(false);
    });
  });

  describe('Cache Utility Functions', () => {
    it('getCachedCodes should return all cached country codes', async () => {
      clearCache();
      
      await loadFlagIcon('US');
      await loadFlagIcon('CN');
      await loadFlagIcon('JP');
      
      const cachedCodes = getCachedCodes();
      expect(cachedCodes).toContain('US');
      expect(cachedCodes).toContain('CN');
      expect(cachedCodes).toContain('JP');
      expect(cachedCodes.length).toBe(3);
    });

    it('clearCache should remove all entries', async () => {
      await loadFlagIcon('US');
      await loadFlagIcon('CN');
      
      expect(getCacheSize()).toBeGreaterThan(0);
      
      clearCache();
      
      expect(getCacheSize()).toBe(0);
      expect(isCached('US')).toBe(false);
      expect(isCached('CN')).toBe(false);
    });
  });
});
