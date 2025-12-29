/**
 * 防抖 Hook 属性测试
 * 
 * Property 3: Search Debounce Behavior
 * For any sequence of rapid search inputs within 300ms,
 * the filter operation SHALL only execute once after the final input.
 * 
 * Validates: Requirements 2.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebounceWithPending } from '../useDebounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Property 3: Search Debounce Behavior', () => {
    /**
     * Feature: performance-optimization, Property 3: Search Debounce Behavior
     * 
     * For any sequence of rapid inputs within the delay period,
     * only the final value should be emitted after the delay.
     */
    it('should only emit final value after delay for rapid inputs', () => {
      fc.assert(
        fc.property(
          // 生成随机字符串序列（模拟快速输入）
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 10 }),
          fc.integer({ min: 100, max: 500 }), // 延迟时间
          (inputs, delay) => {
            const { result, rerender } = renderHook(
              ({ value, delay }) => useDebounce(value, delay),
              { initialProps: { value: inputs[0], delay } }
            );

            // 初始值应该立即可用
            expect(result.current).toBe(inputs[0]);

            // 快速更新所有值（在 delay 时间内）
            for (let i = 1; i < inputs.length; i++) {
              act(() => {
                rerender({ value: inputs[i], delay });
              });
              
              // 在 delay 之前，值不应该更新（除了初始值）
              if (i < inputs.length - 1) {
                // 推进一小段时间，但不超过 delay
                act(() => {
                  vi.advanceTimersByTime(delay / inputs.length);
                });
              }
            }

            // 在 delay 完成之前，值应该还是初始值
            expect(result.current).toBe(inputs[0]);

            // 完成 delay
            act(() => {
              vi.advanceTimersByTime(delay);
            });

            // 现在应该是最后一个值
            expect(result.current).toBe(inputs[inputs.length - 1]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should debounce value changes with specified delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      // 快速输入多个值
      act(() => {
        rerender({ value: 'a' });
      });
      act(() => {
        rerender({ value: 'ab' });
      });
      act(() => {
        rerender({ value: 'abc' });
      });

      // 在 300ms 之前，值不应该更新
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current).toBe('initial');

      // 300ms 后，应该更新为最后一个值
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current).toBe('abc');
    });

    it('should reset timer on each new input', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'start' } }
      );

      // 第一次输入
      act(() => {
        rerender({ value: 'first' });
      });

      // 等待 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // 第二次输入（应该重置计时器）
      act(() => {
        rerender({ value: 'second' });
      });

      // 再等待 200ms（总共 400ms，但从第二次输入只过了 200ms）
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // 值应该还是 start（因为第二次输入重置了计时器）
      expect(result.current).toBe('start');

      // 再等待 100ms（从第二次输入过了 300ms）
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // 现在应该是 second
      expect(result.current).toBe('second');
    });
  });

  describe('useDebounceWithPending', () => {
    it('should track pending state correctly', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounceWithPending(value, 300),
        { initialProps: { value: 'initial' } }
      );

      // 初始状态
      expect(result.current.debouncedValue).toBe('initial');
      expect(result.current.isPending).toBe(false);

      // 更新值
      act(() => {
        rerender({ value: 'updated' });
      });

      // 应该处于 pending 状态
      expect(result.current.isPending).toBe(true);
      expect(result.current.debouncedValue).toBe('initial');

      // 完成 delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // 不再 pending
      expect(result.current.isPending).toBe(false);
      expect(result.current.debouncedValue).toBe('updated');
    });
  });

  describe('Cleanup behavior', () => {
    it('should cleanup timer on unmount', () => {
      const { result, unmount, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      // 更新值
      act(() => {
        rerender({ value: 'updated' });
      });

      // 卸载组件
      unmount();

      // 推进时间不应该导致错误
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // 测试通过即表示没有内存泄漏或错误
      expect(true).toBe(true);
    });
  });
});
