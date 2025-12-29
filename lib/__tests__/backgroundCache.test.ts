/**
 * 背景缓存属性测试
 * 
 * Property 4: Background Cache Validity
 * For any cached background URL, if the cache timestamp is within 24 hours,
 * the cached URL SHALL be used; if expired, a new URL SHALL be fetched.
 * 
 * Validates: Requirements 3.2, 3.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  isCacheValid,
  getCachedBackground,
  setCachedBackground,
  clearBackgroundCache,
  getCacheExpireTime,
} from '../backgroundContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

describe('Background Cache', () => {
  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Property 4: Background Cache Validity', () => {
    const EXPIRE_TIME = getCacheExpireTime(); // 24 hours in ms

    /**
     * Feature: performance-optimization, Property 4: Background Cache Validity
     * 
     * For any cache timestamp within 24 hours, the cache should be valid.
     * For any cache timestamp older than 24 hours, the cache should be invalid.
     */
    it('should validate cache based on 24-hour expiration', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }), // URL
          fc.integer({ min: 0, max: EXPIRE_TIME * 2 }),  // age in ms
          (url, age) => {
            const now = Date.now();
            const timestamp = now - age;
            
            const cache = {
              url,
              timestamp,
              version: 'v1',
            };

            const isValid = isCacheValid(cache, now);

            if (age < EXPIRE_TIME) {
              // 未过期，应该有效
              expect(isValid).toBe(true);
            } else {
              // 已过期，应该无效
              expect(isValid).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for expired cache', () => {
      const expiredTimestamp = Date.now() - EXPIRE_TIME - 1000; // 过期 1 秒
      
      localStorageMock.setItem('app_background_cache', JSON.stringify({
        url: 'https://example.com/old-image.jpg',
        timestamp: expiredTimestamp,
        version: 'v1',
      }));

      const result = getCachedBackground();
      
      // 过期缓存应该返回 null
      expect(result).toBeNull();
      
      // 过期缓存应该被清除
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('app_background_cache');
    });

    it('should return cached URL for valid cache', () => {
      const validTimestamp = Date.now() - 1000; // 1 秒前
      const cachedUrl = 'https://example.com/valid-image.jpg';
      
      localStorageMock.setItem('app_background_cache', JSON.stringify({
        url: cachedUrl,
        timestamp: validTimestamp,
        version: 'v1',
      }));

      const result = getCachedBackground();
      
      // 有效缓存应该返回 URL
      expect(result).toBe(cachedUrl);
    });

    it('should invalidate cache with wrong version', () => {
      const validTimestamp = Date.now() - 1000;
      
      localStorageMock.setItem('app_background_cache', JSON.stringify({
        url: 'https://example.com/image.jpg',
        timestamp: validTimestamp,
        version: 'v0', // 旧版本
      }));

      const result = getCachedBackground();
      
      // 版本不匹配应该返回 null
      expect(result).toBeNull();
    });
  });

  describe('Cache operations', () => {
    it('should set and get cache correctly', () => {
      const testUrl = 'https://example.com/test-image.jpg';
      
      setCachedBackground(testUrl);
      
      const result = getCachedBackground();
      
      expect(result).toBe(testUrl);
    });

    it('should clear cache correctly', () => {
      setCachedBackground('https://example.com/image.jpg');
      
      expect(getCachedBackground()).not.toBeNull();
      
      clearBackgroundCache();
      
      expect(getCachedBackground()).toBeNull();
    });

    it('should handle invalid JSON in cache gracefully', () => {
      localStorageMock.setItem('app_background_cache', 'invalid json');
      
      const result = getCachedBackground();
      
      // 应该返回 null 而不是抛出错误
      expect(result).toBeNull();
    });

    it('should handle missing cache gracefully', () => {
      const result = getCachedBackground();
      
      expect(result).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle cache at exact expiration boundary', () => {
      const expireTime = getCacheExpireTime();
      const now = Date.now();
      const exactlyExpired = now - expireTime;
      
      const cache = {
        url: 'https://example.com/image.jpg',
        timestamp: exactlyExpired,
        version: 'v1',
      };

      // 刚好过期应该无效
      expect(isCacheValid(cache, now)).toBe(false);
    });

    it('should handle cache just before expiration', () => {
      const expireTime = getCacheExpireTime();
      const now = Date.now();
      const almostExpired = now - expireTime + 1; // 差 1ms 过期
      
      const cache = {
        url: 'https://example.com/image.jpg',
        timestamp: almostExpired,
        version: 'v1',
      };

      // 还没过期应该有效
      expect(isCacheValid(cache, now)).toBe(true);
    });

    it('should handle null cache', () => {
      expect(isCacheValid(null)).toBe(false);
    });

    it('should handle cache with future timestamp', () => {
      const now = Date.now();
      const futureTimestamp = now + 1000000; // 未来时间
      
      const cache = {
        url: 'https://example.com/image.jpg',
        timestamp: futureTimestamp,
        version: 'v1',
      };

      // 未来时间戳应该有效（age 为负数，小于过期时间）
      expect(isCacheValid(cache, now)).toBe(true);
    });
  });
});
