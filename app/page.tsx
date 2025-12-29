'use client';

import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import { FreeNoticeModal } from './FreeNoticeModal';
import { NavigationMenu, MenuButton } from '@/components/NavigationMenu';
import { countries, CountryConfig } from '@/lib/countryData';
import { Icon } from '@/components/Icon';
import { haptic } from '@/lib/utils';
import { loadFlagIcon, preloadTopFlags } from '@/lib/flagCache';
import {
  generateName,
  generateBirthday,
  generatePhone,
  generatePassword,
  generateEmail,
  getCountryConfig,
  getAllDomains
} from '@/lib/generator';
import { addIdentity, isIdentitySaved } from '@/lib/identityData';

// 预加载常用国旗（模块加载时执行一次）
if (typeof window !== 'undefined') {
  preloadTopFlags();
}

// 菜单引导提示组件
const MenuGuide = memo(({ onDismiss }: { onDismiss: () => void }) => {
  return (
    <div className="fixed top-[52px] desktop:top-[64px] right-4 desktop:right-8 z-50 animate-fadeIn">
      <div className="relative bg-[#34C759] rounded-2xl px-4 py-3 shadow-lg max-w-[200px]">
        {/* 箭头 */}
        <div className="absolute -top-2 right-4 w-4 h-4 bg-[#34C759] rotate-45" />
        <p className="text-white text-[13px] font-medium leading-relaxed">
          点击这里发现更多功能 ☝️
        </p>
        <button
          onClick={onDismiss}
          className="mt-2 w-full py-1.5 bg-white/20 rounded-lg text-white text-[12px] font-semibold active:scale-95 transition-transform"
        >
          知道了
        </button>
      </div>
    </div>
  );
});
MenuGuide.displayName = 'MenuGuide';

const CountryFlag = memo(({ countryCode, className = "w-8 h-6" }: { countryCode: string; className?: string }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [FlagComponent, setFlagComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    loadFlagIcon(countryCode)
      .then((component) => {
        if (isMounted) {
          setFlagComponent(component ? () => component : null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFlagComponent(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [countryCode]);

  if (isLoading || !FlagComponent) {
    return (
      <div className={`${className} bg-gradient-to-br from-[#007AFF] to-[#0055b3] rounded flex items-center justify-center`}>
        <Icon name="globe" className="w-4 h-4 text-white" />
      </div>
    );
  }

  return (
    <div className={`${className} rounded overflow-hidden shadow-md border border-white/20`}>
      <FlagComponent className="w-full h-full object-cover" title={countryCode} />
    </div>
  );
});
CountryFlag.displayName = 'CountryFlag';

// --- 类型定义 ---
interface UserInfo {
  firstName: string;
  lastName: string;
  birthday: string;
  phone: string;
  password: string;
  email: string;
}

// --- 信息行组件 ---
// --- 信息行组件 ---
// 自定义比较函数，只在关键 props 变化时重渲染
const infoRowPropsAreEqual = (
  prevProps: { label: string; value: string; isCopied: boolean; isLast?: boolean },
  nextProps: { label: string; value: string; isCopied: boolean; isLast?: boolean }
) => {
  return (
    prevProps.label === nextProps.label &&
    prevProps.value === nextProps.value &&
    prevProps.isCopied === nextProps.isCopied &&
    prevProps.isLast === nextProps.isLast
  );
};

const InfoRow = memo(({ label, value, onCopy, isCopied, isLast = false }: {
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
  isLast?: boolean;
}) => (
  <div 
    onClick={onCopy}
    className={`group relative flex items-center justify-between py-4 desktop:py-5 pl-5 desktop:pl-6 pr-5 desktop:pr-6 cursor-pointer transition-all duration-200 touch-manipulation active:scale-[0.99] ${
      isCopied ? 'bg-blue-500/20' : 'bg-transparent active:bg-white/15'
    }`}
  >
    <span className="text-[14px] desktop:text-[16px] font-medium text-white/70 w-16 desktop:w-20 shrink-0 tracking-tight">
      {label}
    </span>
    
    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end h-6 desktop:h-7 relative overflow-hidden">
      <span 
        className={`absolute right-0 text-[16px] desktop:text-[18px] font-bold truncate tracking-tight transition-all duration-300 ${
          isCopied ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100 text-white'
        }`}
      >
        {value || '---'}
      </span>

      <div 
        className={`absolute right-0 flex items-center gap-1.5 transition-all duration-300 ${
          isCopied ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-90 pointer-events-none'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <div className="bg-[#34C759] rounded-full p-0.5 shadow-[0_0_6px_rgba(52,199,89,0.8)]">
          <Icon name="check" className="w-3 h-3 desktop:w-3.5 desktop:h-3.5 text-white" />
        </div>
        <span className="text-[14px] desktop:text-[16px] font-semibold text-[#34C759]">
          已复制
        </span>
      </div>
    </div>
    
    {!isLast && <div className="absolute bottom-0 left-5 desktop:left-6 right-0 h-[0.5px] bg-white/20" />}
  </div>
), infoRowPropsAreEqual);
InfoRow.displayName = 'InfoRow';

// --- 底部弹窗 ---
const BottomSheet = memo(({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  rightAction 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity duration-300 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <div 
        className="relative w-full max-w-md bg-black/40 border border-white/20 rounded-t-[24px] sm:rounded-[24px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ 
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform'
        }}
      >
        <div className="p-4 border-b border-white/10 sticky top-0 z-10 shrink-0 bg-black/40 backdrop-blur-xl">
          <div className="w-10 h-1.5 bg-white/30 rounded-full mx-auto mb-4" />
          <div className="relative flex items-center justify-center min-h-[24px]">
            <h3 className="text-[17px] font-semibold text-white tracking-tight drop-shadow-md">
              {title}
            </h3>
            {rightAction ? (
              <div className="absolute right-0 top-1/2 -translate-y-1/2">{rightAction}</div>
            ) : (
              <button 
                onClick={onClose}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/10 p-1.5 rounded-full text-white/60 hover:bg-white/20 active:scale-95 transition-all touch-manipulation"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>
  );
});
BottomSheet.displayName = 'BottomSheet';

// --- 列表项 ---
const ListItem = memo(({ label, isSelected, onClick, icon }: { 
  label: string; 
  isSelected: boolean; 
  onClick: () => void; 
  icon?: string;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation border ${
      isSelected 
        ? 'bg-white/10 border-white/10 shadow-lg text-[#409CFF] font-semibold' 
        : 'bg-transparent border-transparent text-white/80 active:bg-white/10'
    }`}
  >
    <div className="flex items-center gap-2.5">
      {icon && (
        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#007AFF]/20' : 'bg-white/10'}`}>
          <Icon name={icon} className={`w-3.5 h-3.5 ${isSelected ? 'text-[#409CFF]' : 'text-white/50'}`} />
        </div>
      )}
      <span className="text-[15px] tracking-tight text-left drop-shadow-sm">{label}</span>
    </div>
    {isSelected && <Icon name="check" className="w-5 h-5 text-[#409CFF]" />}
  </button>
));
ListItem.displayName = 'ListItem';

// --- 国家和域名列表 ---
const CountryList = memo(({ countries, selectedCode, onSelect }: {
  countries: CountryConfig[];
  selectedCode: string;
  onSelect: (c: CountryConfig) => void;
}) => (
  <div className="p-3.5 space-y-1.5">
    {countries.map((country) => (
      <button
        key={country.code}
        onClick={() => onSelect(country)}
        className={`w-full flex items-center justify-between p-3.5 rounded-[14px] transition-all duration-200 active:scale-[0.98] touch-manipulation border ${
          selectedCode === country.code
            ? 'bg-white/10 border-white/20 shadow-lg'
            : 'bg-black/30 border-white/10 active:bg-white/15'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CountryFlag countryCode={country.code} className="w-9 h-6 shrink-0" />
          <span className="text-white font-semibold text-[15px] tracking-tight truncate">
            {country.name}
          </span>
        </div>
        {selectedCode === country.code && (
          <Icon name="check" className="w-5 h-5 text-[#34C759] shrink-0 ml-2" />
        )}
      </button>
    ))}
  </div>
));
CountryList.displayName = 'CountryList';

const DomainList = memo(({ allDomains, selectedDomain, onSelect }: {
  allDomains: string[];
  selectedDomain: string;
  onSelect: (d: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 搜索防抖 - 使用 ref 避免重复创建 timer
  const [filteredQuery, setFilteredQuery] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setFilteredQuery(searchQuery);
      setVisibleCount(50);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // 过滤域名（使用防抖后的查询）
  const filteredDomains = useMemo(() => {
    if (!filteredQuery) return allDomains;
    const query = filteredQuery.toLowerCase();
    return allDomains.filter(d => d.toLowerCase().includes(query));
  }, [allDomains, filteredQuery]);

  // 可见域名（分页加载）
  const visibleDomains = useMemo(() => {
    return filteredDomains.slice(0, visibleCount);
  }, [filteredDomains, visibleCount]);

  // IntersectionObserver 懒加载下一批 - 优化配置
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredDomains.length) {
          setVisibleCount(prev => Math.min(prev + 50, filteredDomains.length));
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: '300px' // 增加预加载距离
      }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleCount, filteredDomains.length]);

  // 清理搜索
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // 处理搜索输入
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3.5 pb-2 sticky top-0 z-10 bg-black/40 backdrop-blur-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="search" className="w-4 h-4 text-white/40" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="搜索域名"
            className="w-full pl-9 pr-8 py-2 bg-black/30 border border-white/10 rounded-xl text-[15px] text-white placeholder-white/30 focus:ring-2 focus:ring-white/20 focus:bg-black/40 transition-colors caret-[#007AFF] outline-none"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center touch-manipulation active:scale-90 transition-transform"
            >
              <div className="bg-white/20 rounded-full p-0.5">
                <Icon name="close" className="w-3 h-3 text-white" />
              </div>
            </button>
          )}
        </div>
      </div>
      <div 
        className="p-3.5 pt-2 space-y-1.5 overflow-y-auto flex-1" 
        style={{ 
          contentVisibility: 'auto',
          containIntrinsicSize: '0 500px'
        }}
      >
        {!filteredQuery && (
          <ListItem
            label="随机域名"
            isSelected={selectedDomain === 'random'}
            onClick={() => onSelect('random')}
            icon="sparkles"
          />
        )}
        {visibleDomains.map((domain) => (
          <ListItem
            key={domain}
            label={domain}
            isSelected={selectedDomain === domain}
            onClick={() => onSelect(domain)}
          />
        ))}
        {visibleCount < filteredDomains.length && (
          <div ref={sentinelRef} className="py-4 text-center">
            <div className="inline-block w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          </div>
        )}
        {filteredDomains.length === 0 && filteredQuery && (
          <div className="text-center py-8 text-white/30 text-sm">无匹配结果</div>
        )}
      </div>
    </div>
  );
});
DomainList.displayName = 'DomainList';

// --- 主组件 ---
export default function GlassStylePage() {
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(countries[0]);
  const [selectedDomain, setSelectedDomain] = useState<string>('random');
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: '', lastName: '', birthday: '', phone: '', password: '', email: ''
  });
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showDomainSheet, setShowDomainSheet] = useState(false);
  const [ipInfo, setIpInfo] = useState({ ip: '...', country: 'US' });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [inboxStatus, setInboxStatus] = useState<'idle' | 'opening'>('idle');
  const [showMenu, setShowMenu] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isSaved, setIsSaved] = useState(false);
  const [showMenuGuide, setShowMenuGuide] = useState(false);

  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 检查是否首次访问，显示菜单引导
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenMenuGuide');
    if (!hasSeenGuide) {
      // 延迟显示，让用户先看到主界面
      const timer = setTimeout(() => {
        setShowMenuGuide(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismissGuide = useCallback(() => {
    setShowMenuGuide(false);
    localStorage.setItem('hasSeenMenuGuide', 'true');
  }, []);

  const toggleImmersive = useCallback(() => {
    haptic(20);
    setIsImmersive(prev => !prev);
  }, []);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    haptic(30);
    try {
      await navigator.clipboard.writeText(text);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopiedField(label);
      copyTimerRef.current = setTimeout(() => setCopiedField(null), 1500);
    } catch { 
      haptic(50); 
    }
  }, []);

  const generate = useCallback(() => {
    haptic(50);
    setCopiedField(null);
    setSaveStatus('idle');
    setIsSaved(false);
    
    try {
      const { firstName, lastName } = generateName(selectedCountry.code);
      const birthday = generateBirthday();
      const phone = generatePhone(selectedCountry);
      const password = generatePassword();
      const customDomain = selectedDomain === 'random' ? undefined : selectedDomain;
      const email = generateEmail(firstName, lastName, customDomain);
      setUserInfo({ firstName, lastName, birthday, phone, password, email });
    } catch (error) { 
      console.error(error); 
    }
  }, [selectedCountry, selectedDomain]);

  // 保存身份信息
  const handleSaveIdentity = useCallback(() => {
    if (saveStatus === 'saving' || isSaved || !userInfo.email) return;
    
    haptic(30);
    setSaveStatus('saving');
    
    // 模拟保存动画
    setTimeout(() => {
      addIdentity({
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        birthday: userInfo.birthday,
        phone: userInfo.phone,
        password: userInfo.password,
        email: userInfo.email,
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
      });
      
      setSaveStatus('saved');
      setIsSaved(true);
      
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 300);
  }, [userInfo, selectedCountry, saveStatus, isSaved]);

  // 检查当前身份是否已保存
  useEffect(() => {
    if (userInfo.email) {
      setIsSaved(isIdentitySaved(userInfo.email));
    }
  }, [userInfo.email]);
  
  const handleInboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (inboxStatus === 'opening') return;
    haptic(30);
    setInboxStatus('opening');
    const emailName = userInfo.email.split('@')[0];
    setTimeout(() => {
      window.open(`https://yopmail.net/?login=${emailName}`, '_blank');
      setInboxStatus('idle');
    }, 600);
  }, [userInfo.email, inboxStatus]);

  useEffect(() => {
    let isMounted = true;
    const initializeApp = async () => {
      // 创建超时 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('IP detection timeout')), 3000);
      });

      try {
        // 使用 Promise.race 实现 3 秒超时
        const response = await Promise.race([
          fetch('/api/ip-info'),
          timeoutPromise,
        ]);
        
        const data = await response.json();
        
        if (!isMounted) return;
        
        setIpInfo({ ip: data.ip || '未知', country: data.country || 'US' });
        
        if (data.country && data.accurate) {
          const detectedCountry = getCountryConfig(data.country);
          if (detectedCountry) setSelectedCountry(detectedCountry);
        }
      } catch {
        // 超时或请求失败，使用默认值
        if (isMounted) {
          setIpInfo({ ip: '检测失败', country: 'US' });
        }
      } finally {
        // 无论成功失败，都标记为已初始化，不阻塞 UI
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };
    
    initializeApp();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isInitialized && !userInfo.firstName) {
      try {
        const { firstName, lastName } = generateName(selectedCountry.code);
        const birthday = generateBirthday();
        const phone = generatePhone(selectedCountry);
        const password = generatePassword();
        const customDomain = selectedDomain === 'random' ? undefined : selectedDomain;
        const email = generateEmail(firstName, lastName, customDomain);
        setUserInfo({ firstName, lastName, birthday, phone, password, email });
      } catch (e) { 
        console.error(e); 
      }
    }
  }, [isInitialized, userInfo.firstName, selectedCountry, selectedDomain]);

  useEffect(() => {
    if (isInitialized && userInfo.firstName) generate();
  }, [selectedCountry.code]);

  const allDomains = useMemo(() => getAllDomains(), []);
  const displayDomain = selectedDomain === 'random' ? '随机' : selectedDomain;

  const handleCountrySelect = useCallback((country: CountryConfig) => {
    haptic(20); 
    setSelectedCountry(country); 
    setShowCountrySheet(false);
  }, []);

  const handleDomainSelect = useCallback((domain: string) => {
    haptic(20); 
    setSelectedDomain(domain); 
    setShowDomainSheet(false);
  }, []);

  // 优化：将内联回调提取为 useCallback
  const handleExitImmersive = useCallback(() => {
    setIsImmersive(false);
  }, []);

  const handleOpenMenu = useCallback(() => {
    haptic(20);
    setShowMenu(true);
  }, []);

  const handleOpenCountrySheet = useCallback(() => {
    haptic(20);
    setShowCountrySheet(true);
  }, []);

  const handleOpenDomainSheet = useCallback(() => {
    haptic(20);
    setShowDomainSheet(true);
  }, []);

  const handleCloseDomainSheet = useCallback(() => {
    setShowDomainSheet(false);
  }, []);

  const handleCloseCountrySheet = useCallback(() => {
    setShowCountrySheet(false);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const handleCopyEmail = useCallback(() => {
    copyToClipboard(userInfo.email, '邮箱');
  }, [copyToClipboard, userInfo.email]);

  return (
    <div className="min-h-screen relative font-sans text-white pb-10 selection:bg-blue-400/30 overflow-x-hidden">
      
      {/* 免费提示弹窗 */}
      <FreeNoticeModal />

      {/* 菜单引导提示 */}
      {showMenuGuide && <MenuGuide onDismiss={handleDismissGuide} />}

      {/* 沉浸模式恢复层 */}
      {isImmersive && (
        <div 
          className="fixed inset-0 z-30 cursor-pointer touch-manipulation" 
          onClick={handleExitImmersive}
        />
      )}

      {/* 内容层 */}
      <div className="relative z-10">
        
        {/* 头部 */}
        <header className="fixed top-0 left-0 right-0 h-[52px] desktop:h-[64px] z-40 flex items-center justify-between px-4 desktop:px-8 pt-2 desktop:pt-0 transition-all duration-300">
          <h1
            onClick={toggleImmersive}
            className={`text-[17px] desktop:text-[20px] font-semibold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] cursor-pointer select-none transition-all duration-300 active:scale-95 touch-manipulation desktop:hover:text-white/80 ${
              isImmersive ? 'opacity-50' : 'opacity-100'
            }`}
          >
            脸书小助手
          </h1>

          <div
            className={`flex items-center gap-2 desktop:gap-4 transition-all duration-500 ${
              isImmersive ? 'opacity-0 translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'
            }`}
          >
            <div className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 desktop:py-1.5 rounded-full bg-black/40 border border-white/20 shadow-lg desktop:shadow-xl">
              <div className="w-1.5 h-1.5 desktop:w-2 desktop:h-2 rounded-full bg-[#34C759] shadow-[0_0_6px_rgba(52,199,89,1)] animate-pulse" />
              <span className="text-[11px] desktop:text-[12px] font-semibold text-white/95 font-mono tracking-tight drop-shadow-md">
                {ipInfo.ip}
              </span>
            </div>
            <MenuButton onClick={handleOpenMenu} />
          </div>
        </header>

        {/* 主内容 */}
        <main 
          className={`max-w-[420px] desktop:max-w-[800px] lg-desktop:max-w-[1000px] mx-auto px-4 desktop:px-8 pt-16 desktop:pt-32 pb-6 desktop:pb-16 transition-all duration-500 ${
            isImmersive 
              ? 'opacity-0 translate-y-[100px] pointer-events-none scale-95' 
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          
          {!isInitialized ? (
            <div className="flex flex-col items-center justify-center py-24 desktop:py-48 space-y-3">
              <div className="w-7 h-7 desktop:w-12 desktop:h-12 border-[3px] desktop:border-[4px] border-white/20 border-t-[#007AFF] rounded-full animate-spin" />
              <p className="text-white/50 text-sm desktop:text-base">加载中...</p>
            </div>
          ) : (
            <div className="desktop:grid desktop:grid-cols-2 desktop:gap-8 lg-desktop:gap-12 space-y-4 desktop:space-y-0">
              
              {/* 左侧：信息卡片 */}
              <div className="space-y-4 desktop:space-y-6">
                {/* 信息卡片 */}
                <section className="bg-black/30 rounded-[16px] desktop:rounded-[24px] overflow-hidden border border-white/20 shadow-lg desktop:shadow-2xl desktop-card">
                  <InfoRow label="姓氏" value={userInfo.lastName} onCopy={() => copyToClipboard(userInfo.lastName, '姓氏')} isCopied={copiedField === '姓氏'} />
                  <InfoRow label="名字" value={userInfo.firstName} onCopy={() => copyToClipboard(userInfo.firstName, '名字')} isCopied={copiedField === '名字'} />
                  <InfoRow label="生日" value={userInfo.birthday} onCopy={() => copyToClipboard(userInfo.birthday, '生日')} isCopied={copiedField === '生日'} />
                  <InfoRow label="手机号" value={userInfo.phone} onCopy={() => copyToClipboard(userInfo.phone, '手机号')} isCopied={copiedField === '手机号'} />
                  <InfoRow label="密码" value={userInfo.password} onCopy={() => copyToClipboard(userInfo.password, '密码')} isCopied={copiedField === '密码'} />
                  
                  <div className="relative flex flex-col py-4 desktop:py-6 pl-5 desktop:pl-6 pr-5 desktop:pr-6">
                    <div 
                      className="flex items-center justify-between mb-3 desktop:mb-4 cursor-pointer touch-manipulation active:scale-[0.99] transition-transform desktop:hover:bg-white/5 desktop:rounded-lg desktop:p-2 desktop:-m-2" 
                      onClick={handleCopyEmail}
                    >
                      <span className="text-[14px] desktop:text-[16px] font-medium text-white/70 w-16 desktop:w-24 shrink-0 tracking-tight">
                        邮箱
                      </span>
                      
                      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end h-6 desktop:h-7 relative overflow-hidden">
                        <span 
                          className={`absolute right-0 text-[16px] desktop:text-[18px] font-bold truncate tracking-tight transition-all duration-300 ${
                            copiedField === '邮箱' ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100 text-white'
                          }`}
                        >
                          {userInfo.email}
                        </span>
                        <div 
                          className={`absolute right-0 flex items-center gap-1.5 transition-all duration-300 ${
                            copiedField === '邮箱' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-90 pointer-events-none'
                          }`}
                          style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        >
                          <div className="bg-[#34C759] rounded-full p-0.5 desktop:p-1 shadow-[0_0_6px_rgba(52,199,89,0.8)]">
                            <Icon name="check" className="w-3 h-3 desktop:w-4 desktop:h-4 text-white" />
                          </div>
                          <span className="text-[14px] desktop:text-[16px] font-semibold text-[#34C759]">已复制</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handleInboxClick}
                        className={`inline-flex items-center gap-1 py-1.5 desktop:py-2 px-3 desktop:px-6 rounded-full text-[12px] desktop:text-[14px] font-semibold transition-all duration-300 active:scale-95 touch-manipulation overflow-hidden relative border shadow-md desktop:shadow-xl desktop-button ${
                          inboxStatus === 'opening' 
                            ? 'bg-[#34C759]/40 border-[#34C759]/50 text-[#4ADE80]' 
                            : 'bg-[#007AFF]/30 border-[#007AFF]/40 text-[#409CFF] active:bg-[#007AFF]/50 desktop:hover:bg-[#007AFF]/40'
                        }`}
                      >
                        <div className={`flex items-center gap-1 transition-all duration-300 ${
                          inboxStatus === 'opening' ? '-translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
                        }`}>
                          <Icon name="inbox" className="w-3 h-3 desktop:w-4 desktop:h-4" />
                          <span>收件箱</span>
                        </div>
                        <div className={`absolute inset-0 flex items-center justify-center gap-1 transition-all duration-300 ${
                          inboxStatus === 'opening' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        }`}>
                          <Icon name="open" className="w-3 h-3 desktop:w-4 desktop:h-4" />
                          已打开
                        </div>
                      </button>
                    </div>
                  </div>
                </section>

                {/* 生成按钮 */}
                <button
                  onClick={generate}
                  className="w-full py-3.5 desktop:py-5 rounded-[14px] desktop:rounded-[20px] shadow-[0_0_15px_rgba(0,122,255,0.4)] desktop:shadow-[0_0_30px_rgba(0,122,255,0.5)] border border-white/20 flex items-center justify-center gap-2 desktop:gap-3 touch-manipulation overflow-hidden relative transition-all duration-200 bg-gradient-to-b from-[#007AFF]/90 to-[#0055b3]/90 active:scale-[0.96] desktop:hover:scale-[1.02] desktop:active:scale-[0.96] desktop-button"
                >
                  <Icon name="sparkles" className="w-4 h-4 desktop:w-6 desktop:h-6 text-white/90" />
                  <span className="text-[15px] desktop:text-[18px] font-semibold tracking-tight text-white">
                    生成新身份
                  </span>
                </button>

                {/* 保存按钮 */}
                <button
                  onClick={handleSaveIdentity}
                  disabled={isSaved || !userInfo.email}
                  className={`w-full py-3 desktop:py-4 rounded-[14px] desktop:rounded-[20px] border flex items-center justify-center gap-1.5 desktop:gap-2.5 touch-manipulation overflow-hidden relative transition-all duration-300 active:scale-[0.96] desktop:hover:scale-[1.01] desktop:active:scale-[0.96] desktop-button min-h-[48px] desktop:min-h-[52px] ${
                    isSaved
                      ? 'bg-[#34C759]/20 border-[#34C759]/30 shadow-[0_0_12px_rgba(52,199,89,0.3)]'
                      : 'bg-white/10 border-white/20 shadow-md desktop:shadow-xl active:bg-white/15'
                  } ${!userInfo.email ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`flex items-center gap-1.5 desktop:gap-2 transition-all duration-300 ${
                    saveStatus === 'saving' ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
                  }`}>
                    <Icon 
                      name={isSaved ? 'check' : 'star'} 
                      className={`w-3.5 h-3.5 desktop:w-5 desktop:h-5 shrink-0 ${
                        isSaved ? 'text-[#34C759]' : 'text-white/80'
                      }`} 
                    />
                    <span className={`text-[13px] desktop:text-[16px] font-semibold tracking-tight ${
                      isSaved ? 'text-[#34C759]' : 'text-white/90'
                    }`}>
                      {isSaved ? '已保存' : '保存身份'}
                    </span>
                  </div>
                  {saveStatus === 'saving' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 desktop:w-5 desktop:h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              </div>

              {/* 右侧：设置区域 */}
              <div className="space-y-4 desktop:space-y-6">
                {/* 设置区域 */}
                <section>
                  <div className="pl-5 desktop:pl-6 mb-2 desktop:mb-3 text-[12px] desktop:text-[14px] font-medium text-white/60 uppercase tracking-wide">
                    生成设置
                  </div>
                  <div className="bg-black/30 rounded-[14px] desktop:rounded-[20px] overflow-hidden border border-white/20 shadow-lg desktop:shadow-2xl desktop-card">
                    <button
                      onClick={handleOpenCountrySheet}
                      className="w-full flex items-center justify-between py-4 desktop:py-5 pl-5 desktop:pl-6 pr-4 desktop:pr-5 active:bg-white/15 transition-all duration-200 touch-manipulation active:scale-[0.99] desktop:hover:bg-white/10"
                    >
                      <span className="text-[15px] desktop:text-[17px] font-medium text-white/90 tracking-tight">
                        选择地区
                      </span>
                      <div className="flex items-center gap-2 desktop:gap-3">
                        <CountryFlag countryCode={selectedCountry.code} className="w-7 h-5 desktop:w-8 desktop:h-6" />
                        <span className="text-[15px] desktop:text-[17px] text-white/90 tracking-tight">
                          {selectedCountry.name}
                        </span>
                        <Icon name="chevronRight" className="w-4 h-4 desktop:w-5 desktop:h-5 text-white/50" />
                      </div>
                    </button>
                    <div className="ml-5 desktop:ml-6 h-[0.5px] bg-white/20" />
                    <button
                      onClick={handleOpenDomainSheet}
                      className="w-full flex items-center justify-between py-4 desktop:py-5 pl-5 desktop:pl-6 pr-4 desktop:pr-5 active:bg-white/15 transition-all duration-200 touch-manipulation active:scale-[0.99] desktop:hover:bg-white/10"
                    >
                      <span className="text-[15px] desktop:text-[17px] font-medium text-white/90 tracking-tight">
                        邮箱域名
                      </span>
                      <div className="flex items-center gap-2 desktop:gap-3">
                        <span className="text-[15px] desktop:text-[17px] text-white/90 tracking-tight">
                          {displayDomain}
                        </span>
                        <Icon name="chevronRight" className="w-4 h-4 desktop:w-5 desktop:h-5 text-white/50" />
                      </div>
                    </button>
                  </div>
                </section>

                {/* 页脚 */}
                <footer className="pt-2 desktop:pt-8 pb-4 desktop:pb-12 text-center space-y-3 desktop:space-y-6">
                  <a 
                    href="https://t.me/fang180" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 desktop:gap-2 text-[12px] desktop:text-[15px] text-[#409CFF] hover:text-[#60aeff] font-semibold transition-all active:scale-95 py-1.5 desktop:py-3 px-3 desktop:px-6 rounded-full bg-black/40 touch-manipulation shadow-md desktop:shadow-xl border border-white/10 desktop-button"
                  >
                    <Icon name="link" className="w-3.5 h-3.5 desktop:w-5 desktop:h-5" />
                    <span>Telegram 频道</span>
                  </a>
                  <p className="text-[11px] desktop:text-[13px] text-white/50 font-medium tracking-tight">
                    {countries.length} 个国家 • {allDomains.length} 个域名
                  </p>
                </footer>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 底部弹窗 */}
      <BottomSheet 
        isOpen={showCountrySheet} 
        onClose={handleCloseCountrySheet} 
        title="选择地区"
      >
        <CountryList 
          countries={countries} 
          selectedCode={selectedCountry.code} 
          onSelect={handleCountrySelect} 
        />
      </BottomSheet>

      <BottomSheet 
        isOpen={showDomainSheet} 
        onClose={handleCloseDomainSheet} 
        title="选择域名"
        rightAction={
          <button 
            onClick={handleCloseDomainSheet} 
            className="text-[#409CFF] font-medium text-[15px] p-2 -mr-2 touch-manipulation hover:text-white transition-colors active:scale-95"
          >
            完成
          </button>
        }
      >
        <DomainList 
          allDomains={allDomains} 
          selectedDomain={selectedDomain} 
          onSelect={handleDomainSelect} 
        />
      </BottomSheet>

      {/* 导航菜单 */}
      <NavigationMenu isOpen={showMenu} onClose={handleCloseMenu} />

      {/* 样式 */}
      <style jsx global>{`
        * {
          -webkit-tap-highlight-color: transparent;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}