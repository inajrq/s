/**
 * 国旗图标缓存模块
 * 
 * 功能：
 * 1. 内存缓存已加载的国旗组件，避免重复动态导入
 * 2. LRU 淘汰策略，最大缓存 50 条
 * 3. 预加载常用国家国旗
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FlagComponentType = any;

// 缓存配置
const MAX_CACHE_SIZE = 30; // 减少缓存大小以节省内存

// 常用国家列表（按使用频率排序）- 只预加载最常用的 5 个
const TOP_COUNTRIES = ['US', 'CN', 'HK', 'TW', 'JP'];

// Module-level 缓存 (Map 保持插入顺序，便于 LRU 淘汰)
const flagCache = new Map<string, FlagComponentType>();

// 加载中的 Promise 缓存，防止并发重复加载
const loadingPromises = new Map<string, Promise<FlagComponentType | null>>();

/**
 * 加载国旗图标组件
 * 
 * 优先从缓存获取，缓存未命中时动态导入
 * 支持并发请求去重
 */
export async function loadFlagIcon(
  countryCode: string
): Promise<FlagComponentType | null> {
  // 1. 检查缓存
  const cached = flagCache.get(countryCode);
  if (cached) {
    // LRU: 移到末尾（最近使用）
    flagCache.delete(countryCode);
    flagCache.set(countryCode, cached);
    return cached;
  }

  // 2. 检查是否正在加载
  const loading = loadingPromises.get(countryCode);
  if (loading) {
    return loading;
  }

  // 3. 动态导入
  const loadPromise = (async () => {
    try {
      const flags = await import('country-flag-icons/react/3x2');
      const FlagComponent = flags[countryCode as keyof typeof flags];

      if (FlagComponent && typeof FlagComponent === 'function') {
        // 4. 缓存大小限制 - LRU 淘汰最旧的
        if (flagCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = flagCache.keys().next().value;
          if (oldestKey) {
            flagCache.delete(oldestKey);
          }
        }

        // 5. 存入缓存
        flagCache.set(countryCode, FlagComponent as FlagComponentType);
        return FlagComponent as FlagComponentType;
      }
      return null;
    } catch {
      return null;
    } finally {
      // 清理 loading 状态
      loadingPromises.delete(countryCode);
    }
  })();

  loadingPromises.set(countryCode, loadPromise);
  return loadPromise;
}

/**
 * 预加载常用国家国旗
 * 
 * 在后台异步加载，不阻塞主线程
 */
export function preloadTopFlags(): void {
  // 使用 requestIdleCallback 或 setTimeout 延迟执行
  const preload = () => {
    TOP_COUNTRIES.forEach((code) => {
      // 不等待结果，后台加载
      loadFlagIcon(code);
    });
  };

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(preload, { timeout: 2000 });
  } else {
    setTimeout(preload, 100);
  }
}

/**
 * 获取当前缓存大小（用于测试）
 */
export function getCacheSize(): number {
  return flagCache.size;
}

/**
 * 清空缓存（用于测试）
 */
export function clearCache(): void {
  flagCache.clear();
  loadingPromises.clear();
}

/**
 * 检查是否已缓存（用于测试）
 */
export function isCached(countryCode: string): boolean {
  return flagCache.has(countryCode);
}

/**
 * 获取缓存的所有国家代码（用于测试）
 */
export function getCachedCodes(): string[] {
  return Array.from(flagCache.keys());
}
