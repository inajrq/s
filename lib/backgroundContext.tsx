'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface BackgroundContextType {
  backgroundUrl: string;
  isLoaded: boolean;
  setLoaded: () => void;
  refreshBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

const BG_CACHE_KEY = 'app_background_cache';
const BG_CACHE_VERSION = 'v1'; // 缓存版本，用于强制刷新
const BG_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时过期

interface BackgroundCache {
  url: string;
  timestamp: number;
  version: string;
}

/**
 * 检查缓存是否有效
 * 
 * @param cache - 缓存数据
 * @param now - 当前时间戳
 * @returns 缓存是否有效
 */
export function isCacheValid(cache: BackgroundCache | null, now: number = Date.now()): boolean {
  if (!cache) return false;
  
  // 版本不匹配，缓存无效
  if (cache.version !== BG_CACHE_VERSION) return false;
  
  // 检查是否过期（24小时）
  const age = now - cache.timestamp;
  return age < BG_EXPIRE_TIME;
}

/**
 * 获取缓存的背景图片
 */
export function getCachedBackground(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(BG_CACHE_KEY);
    if (!cached) return null;
    
    const data: BackgroundCache = JSON.parse(cached);
    
    // 使用统一的验证函数
    if (!isCacheValid(data)) {
      localStorage.removeItem(BG_CACHE_KEY);
      return null;
    }
    
    return data.url;
  } catch {
    // 解析失败，清除无效缓存
    try {
      localStorage.removeItem(BG_CACHE_KEY);
    } catch {
      // 忽略清除失败
    }
    return null;
  }
}

/**
 * 保存背景图片到缓存
 */
export function setCachedBackground(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    const data: BackgroundCache = {
      url,
      timestamp: Date.now(),
      version: BG_CACHE_VERSION,
    };
    localStorage.setItem(BG_CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 可能已满或不可用，静默失败
  }
}

/**
 * 清除背景缓存（用于测试）
 */
export function clearBackgroundCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(BG_CACHE_KEY);
  } catch {
    // 忽略错误
  }
}

/**
 * 获取缓存过期时间常量（用于测试）
 */
export function getCacheExpireTime(): number {
  return BG_EXPIRE_TIME;
}

/**
 * 获取新的随机背景图片（移动端优化）
 */
function fetchNewBackground(): string {
  const timestamp = Date.now();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // 移动端使用更小尺寸
  return isMobile
    ? `https://loliapi.com/acg/?w=800&${timestamp}`
    : `https://loliapi.com/acg/?${timestamp}`;
}

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 首次加载时获取背景图片
    const cached = getCachedBackground();
    
    if (cached) {
      // 使用缓存的图片
      setBackgroundUrl(cached);
    } else {
      // 直接加载高质量图片
      const highQualityUrl = fetchNewBackground();
      setBackgroundUrl(highQualityUrl);
      setCachedBackground(highQualityUrl);
    }
  }, []);

  const setLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const refreshBackground = useCallback(() => {
    const newUrl = fetchNewBackground();
    setBackgroundUrl(newUrl);
    setCachedBackground(newUrl);
    setIsLoaded(false);
  }, []);

  return (
    <BackgroundContext.Provider value={{ backgroundUrl, isLoaded, setLoaded, refreshBackground }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}