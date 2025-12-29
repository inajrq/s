/**
 * IP 检测回退属性测试
 * 
 * Property 5: IP Detection Fallback
 * For any IP detection request that fails or times out after 3 seconds,
 * the system SHALL use the default country (US) and continue initialization.
 * 
 * Validates: Requirements 5.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// IP 检测逻辑的纯函数提取
interface IpDetectionResult {
  ip: string;
  country: string;
  isDefault: boolean;
}

const DEFAULT_COUNTRY = 'US';
const DEFAULT_IP = '检测失败';
const TIMEOUT_MS = 3000;

/**
 * 模拟 IP 检测逻辑
 * 
 * @param fetchFn - fetch 函数（可模拟）
 * @param timeoutMs - 超时时间
 * @returns IP 检测结果
 */
async function detectIp(
  fetchFn: () => Promise<Response>,
  timeoutMs: number = TIMEOUT_MS
): Promise<IpDetectionResult> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('timeout')), timeoutMs);
  });

  try {
    const response = await Promise.race([fetchFn(), timeoutPromise]);
    const data = await response.json();
    
    return {
      ip: data.ip || DEFAULT_IP,
      country: data.country || DEFAULT_COUNTRY,
      isDefault: !data.ip || !data.country,
    };
  } catch {
    return {
      ip: DEFAULT_IP,
      country: DEFAULT_COUNTRY,
      isDefault: true,
    };
  }
}

describe('IP Detection Fallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Property 5: IP Detection Fallback', () => {
    /**
     * Feature: performance-optimization, Property 5: IP Detection Fallback
     * 
     * For any failed or timed-out IP request, the system should
     * use default country (US) and continue without blocking.
     */
    it('should use default country on timeout', async () => {
      // 模拟永不返回的请求
      const neverResolveFetch = () => new Promise<Response>(() => {});
      
      const resultPromise = detectIp(neverResolveFetch, 100); // 使用短超时便于测试
      
      // 推进时间超过超时
      vi.advanceTimersByTime(150);
      
      const result = await resultPromise;
      
      expect(result.country).toBe(DEFAULT_COUNTRY);
      expect(result.ip).toBe(DEFAULT_IP);
      expect(result.isDefault).toBe(true);
    });

    it('should use default country on network error', async () => {
      const errorFetch = () => Promise.reject(new Error('Network error'));
      
      const result = await detectIp(errorFetch);
      
      expect(result.country).toBe(DEFAULT_COUNTRY);
      expect(result.ip).toBe(DEFAULT_IP);
      expect(result.isDefault).toBe(true);
    });

    it('should use default country on invalid response', async () => {
      const invalidResponseFetch = () => Promise.resolve({
        json: () => Promise.resolve({}), // 空响应
      } as Response);
      
      const result = await detectIp(invalidResponseFetch);
      
      expect(result.country).toBe(DEFAULT_COUNTRY);
      expect(result.ip).toBe(DEFAULT_IP);
      expect(result.isDefault).toBe(true);
    });

    it('should use detected country on successful response', async () => {
      const successFetch = () => Promise.resolve({
        json: () => Promise.resolve({
          ip: '1.2.3.4',
          country: 'CN',
          accurate: true,
        }),
      } as Response);
      
      const result = await detectIp(successFetch);
      
      expect(result.country).toBe('CN');
      expect(result.ip).toBe('1.2.3.4');
      expect(result.isDefault).toBe(false);
    });

    /**
     * 属性测试：任何失败场景都应该回退到默认值
     */
    it('should always fallback to default on any error', async () => {
      // 对于这个测试，我们不使用 fake timers，因为 fc.asyncProperty 内部处理异步
      vi.useRealTimers();
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'network_error',
            'invalid_json',
            'empty_response',
            'server_error'
          ),
          async (errorType) => {
            let fetchFn: () => Promise<Response>;
            
            switch (errorType) {
              case 'network_error':
                fetchFn = () => Promise.reject(new Error('Network error'));
                break;
              case 'invalid_json':
                fetchFn = () => Promise.resolve({
                  json: () => Promise.reject(new Error('Invalid JSON')),
                } as Response);
                break;
              case 'empty_response':
                fetchFn = () => Promise.resolve({
                  json: () => Promise.resolve({}),
                } as Response);
                break;
              case 'server_error':
                fetchFn = () => Promise.resolve({
                  json: () => Promise.resolve({ error: 'Server error' }),
                } as Response);
                break;
              default:
                fetchFn = () => Promise.reject(new Error('Unknown error'));
            }
            
            const result = await detectIp(fetchFn, 50);
            
            // 所有错误场景都应该回退到默认值
            expect(result.country).toBe(DEFAULT_COUNTRY);
          }
        ),
        { numRuns: 100 }
      );
      
      // 恢复 fake timers
      vi.useFakeTimers();
    });

    /**
     * 属性测试：成功响应应该使用返回的值
     */
    it('should use response values when available', async () => {
      vi.useRealTimers();
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 7, maxLength: 15 }), // IP
          fc.constantFrom('US', 'CN', 'JP', 'KR', 'GB', 'DE', 'FR'), // Country
          async (ip, country) => {
            const successFetch = () => Promise.resolve({
              json: () => Promise.resolve({ ip, country, accurate: true }),
            } as Response);
            
            const result = await detectIp(successFetch);
            
            expect(result.ip).toBe(ip);
            expect(result.country).toBe(country);
            expect(result.isDefault).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
      
      vi.useFakeTimers();
    });
  });

  describe('Timeout behavior', () => {
    it('should timeout after specified duration', async () => {
      const slowFetch = () => new Promise<Response>((resolve) => {
        setTimeout(() => {
          resolve({
            json: () => Promise.resolve({ ip: '1.2.3.4', country: 'CN' }),
          } as Response);
        }, 5000); // 5 秒后才返回
      });
      
      const resultPromise = detectIp(slowFetch, 100); // 100ms 超时
      
      // 推进 150ms（超过超时）
      vi.advanceTimersByTime(150);
      
      const result = await resultPromise;
      
      // 应该超时并使用默认值
      expect(result.isDefault).toBe(true);
    });

    it('should not timeout if response is fast enough', async () => {
      const fastFetch = () => Promise.resolve({
        json: () => Promise.resolve({ ip: '1.2.3.4', country: 'JP' }),
      } as Response);
      
      const result = await detectIp(fastFetch, 1000);
      
      expect(result.country).toBe('JP');
      expect(result.isDefault).toBe(false);
    });
  });
});
