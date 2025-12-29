'use client';

import { useState, useEffect, useCallback, useMemo, useRef, memo, lazy, Suspense } from 'react';
import { countries, generatePhoneNumber, searchCountries, type CountryData } from '@/lib/phoneData';
import { NavigationMenu, MenuButton } from '@/components/NavigationMenu';
import { Icon } from '@/components/Icon';
import { haptic } from '@/lib/utils';

// 动态导入国旗库（按需加载）
const loadFlagIcon = async (countryCode: string) => {
  try {
    const flags = await import('country-flag-icons/react/3x2');
    const FlagComponent = flags[countryCode as keyof typeof flags];
    if (FlagComponent && typeof FlagComponent === 'function') {
      return FlagComponent;
    }
    return null;
  } catch {
    return null;
  }
};

const CountryFlag = memo(({ countryCode, className = "w-8 h-6" }: { countryCode: string; className?: string }) => {
  const [FlagComponent, setFlagComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    loadFlagIcon(countryCode)
      .then((component) => {
        if (component) {
          setFlagComponent(() => component);
        } else {
          setFlagComponent(null);
        }
      })
      .catch(() => {
        setFlagComponent(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
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

const STORAGE_KEY_COUNTRY = 'phone_generator_selected_country';
const STORAGE_KEY_COUNT = 'phone_generator_count';

interface CountrySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (country: CountryData) => void;
  currentCountry: CountryData | null;
}

const CountrySelector = memo(({ isOpen, onClose, onSelect, currentCountry }: CountrySelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(0);
    }, 200);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchQuery]);

  const filteredCountries = useMemo(() => {
    return searchCountries(debouncedQuery);
  }, [debouncedQuery]);

  const paginatedCountries = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredCountries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCountries, page]);

  const totalPages = Math.ceil(filteredCountries.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSearchQuery('');
      setPage(0);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [page]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <div className="h-full flex flex-col">
        <div className="shrink-0 pt-safe px-3 pb-2">
          <div className="h-[44px] flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-white tracking-tight">
              选择国家/地区
            </h2>
            <button
              onClick={() => { haptic(20); onClose(); }}
              className="p-1.5 rounded-full bg-black/30 border border-white/20 active:bg-white/20 transition-all active:scale-95 touch-manipulation"
            >
              <Icon name="close" className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="relative mt-2">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Icon name="search" className="w-4 h-4 text-white/40" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索国家或区号..."
              className="w-full pl-8 pr-8 py-2 bg-black/30 border border-white/20 rounded-[12px] text-[14px] text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:bg-black/40 transition-colors caret-[#007AFF] outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => { haptic(20); setSearchQuery(''); }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center touch-manipulation active:scale-90 transition-transform"
              >
                <div className="bg-white/20 rounded-full p-0.5">
                  <Icon name="close" className="w-3 h-3 text-white" />
                </div>
              </button>
            )}
          </div>

          <div className="text-white/50 text-[11px] mt-1.5">
            {filteredCountries.length} 个国家
          </div>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-3 pb-2">
          <div className="space-y-1.5">
            {paginatedCountries.map((country) => (
              <button
                key={country.id}
                onClick={() => {
                  haptic(30);
                  onSelect(country);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-[12px] transition-all duration-200 active:scale-[0.98] touch-manipulation border ${
                  currentCountry?.id === country.id
                    ? 'bg-white/10 border-white/20'
                    : 'bg-black/30 border-white/10 active:bg-white/15'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <CountryFlag countryCode={country.id} className="w-9 h-6 shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-white font-semibold text-[14px] tracking-tight truncate">
                      {country.name}
                    </div>
                    <div className="text-white/50 text-[12px]">
                      {country.code}
                    </div>
                  </div>
                </div>
                {currentCountry?.id === country.id && (
                  <Icon name="check" className="w-4 h-4 text-[#34C759] shrink-0 ml-1.5" />
                )}
              </button>
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="shrink-0 px-3 py-2.5 pb-safe bg-gradient-to-t from-black/40 to-transparent backdrop-blur-sm border-t border-white/10">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => { haptic(20); setPage(p => Math.max(0, p - 1)); }}
                disabled={page === 0}
                className="px-4 py-2 bg-black/30 border border-white/20 rounded-[10px] text-white text-[13px] font-medium disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all touch-manipulation"
              >
                上一页
              </button>
              <span className="text-white/60 text-[13px] font-medium min-w-[50px] text-center">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => { haptic(20); setPage(p => Math.min(totalPages - 1, p + 1)); }}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 bg-black/30 border border-white/20 rounded-[10px] text-white text-[13px] font-medium disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all touch-manipulation"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
CountrySelector.displayName = 'CountrySelector';

export default function PhoneGeneratorPage() {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [generatedNumbers, setGeneratedNumbers] = useState<string[]>([]);
  const [count, setCount] = useState<number>(10);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    try {
      const savedCountryId = localStorage.getItem(STORAGE_KEY_COUNTRY);
      const savedCount = localStorage.getItem(STORAGE_KEY_COUNT);

      if (savedCountryId) {
        const country = countries.find(c => c.id === savedCountryId);
        if (country) {
          setSelectedCountry(country);
        } else {
          setSelectedCountry(countries[0]);
        }
      } else {
        setSelectedCountry(countries[0]);
      }

      if (savedCount) {
        const parsedCount = parseInt(savedCount, 10);
        if (parsedCount > 0 && parsedCount <= 10000) {
          setCount(parsedCount);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSelectedCountry(countries[0]);
    }
  }, []);

  const handleSelectCountry = useCallback((country: CountryData) => {
    setSelectedCountry(country);
    setGeneratedNumbers([]);
    setPage(0);
    try {
      localStorage.setItem(STORAGE_KEY_COUNTRY, country.id);
    } catch (error) {
      console.error('Failed to save country:', error);
    }
  }, []);

  const handleGenerate = useCallback(() => {
    if (!selectedCountry) return;
    haptic(50);

    requestAnimationFrame(() => {
      if (count <= 2000) {
        const numbers = generatePhoneNumber(selectedCountry, count);
        setGeneratedNumbers(numbers);
      } else {
        const batchSize = 1000;
        const batches = Math.ceil(count / batchSize);
        const allNumbers: string[] = [];

        for (let i = 0; i < batches; i++) {
          const currentBatchSize = Math.min(batchSize, count - i * batchSize);
          const batchNumbers = generatePhoneNumber(selectedCountry, currentBatchSize);
          allNumbers.push(...batchNumbers);
        }

        setGeneratedNumbers(allNumbers);
      }
    });

    try {
      localStorage.setItem(STORAGE_KEY_COUNT, count.toString());
    } catch (error) {
      console.error('Failed to save count:', error);
    }
  }, [selectedCountry, count]);

  const handleCopy = useCallback(async (text: string, index: number) => {
    haptic(30);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (error) {
      console.error('Copy failed:', error);
      haptic(50);
    }
  }, []);

  const handleCopyAll = useCallback(async () => {
    haptic(30);
    try {
      const text = generatedNumbers.join('\n');
      await navigator.clipboard.writeText(text);
      setIsCopiedAll(true);
      setTimeout(() => setIsCopiedAll(false), 1500);
    } catch (error) {
      console.error('Copy all failed:', error);
      haptic(50);
    }
  }, [generatedNumbers]);

  const handleDownload = useCallback(() => {
    haptic(30);
    if (generatedNumbers.length === 0) return;

    const text = generatedNumbers.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    a.download = `${selectedCountry?.name || 'phone'}_${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedNumbers, selectedCountry]);

  const paginatedNumbers = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return generatedNumbers.slice(start, start + ITEMS_PER_PAGE);
  }, [generatedNumbers, page]);

  const totalPages = Math.ceil(generatedNumbers.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen relative font-sans text-white pb-10 selection:bg-blue-400/30 overflow-x-hidden">
      <div className="relative z-10">
        <header className="fixed top-0 left-0 right-0 h-[52px] desktop:h-[64px] z-40 flex items-center justify-between px-4 desktop:px-8 pt-2 desktop:pt-0 transition-all duration-300">
          <h1 className="text-[17px] desktop:text-[20px] font-semibold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            手机号生成器
          </h1>
          <MenuButton onClick={() => { haptic(20); setShowMenu(true); }} />
        </header>

        <main className="max-w-[420px] desktop:max-w-[800px] lg-desktop:max-w-[1000px] mx-auto px-4 desktop:px-8 pt-16 desktop:pt-32 pb-6 desktop:pb-16 space-y-4 desktop:space-y-8">
          
          <div className="desktop:grid desktop:grid-cols-2 desktop:gap-8 lg-desktop:gap-12 space-y-4 desktop:space-y-0">
            
            {/* 左侧：国家选择和设置 */}
            <div className="space-y-3 desktop:space-y-6">
              <section className="bg-black/30 rounded-[16px] desktop:rounded-[24px] border border-white/20 shadow-lg desktop:shadow-2xl overflow-hidden desktop-card">
                <button
                  onClick={() => { haptic(20); setShowCountrySelector(true); }}
                  className="w-full p-3 desktop:p-6 flex items-center justify-between active:bg-white/15 transition-all duration-200 touch-manipulation desktop:hover:bg-white/10"
                >
                  <div className="flex items-center gap-2.5 desktop:gap-4 flex-1 min-w-0">
                    {selectedCountry ? (
                      <CountryFlag countryCode={selectedCountry.id} className="w-10 h-7 desktop:w-16 desktop:h-12 shrink-0" />
                    ) : (
                      <div className="shrink-0 w-10 h-7 desktop:w-16 desktop:h-12 bg-gradient-to-br from-[#007AFF] to-[#0055b3] rounded flex items-center justify-center shadow-lg">
                        <Icon name="globe" className="w-5 h-5 desktop:w-8 desktop:h-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-white/60 text-[11px] desktop:text-[14px]">当前地区</div>
                      <div className="text-white font-bold text-[15px] desktop:text-[19px] tracking-tight truncate">
                        {selectedCountry?.name || '选择国家'}
                      </div>
                      <div className="text-white/70 text-[13px] desktop:text-[15px]">
                        {selectedCountry?.code || ''}
                      </div>
                    </div>
                  </div>
                  <Icon name="chevronRight" className="w-4 h-4 desktop:w-6 desktop:h-6 text-white/50 shrink-0" />
                </button>
              </section>

              <section className="bg-black/30 rounded-[16px] desktop:rounded-[24px] border border-white/20 shadow-lg desktop:shadow-2xl p-3 desktop:p-6 space-y-3 desktop:space-y-6 desktop-card">
                <div>
                  <label className="text-white/70 text-[12px] desktop:text-[15px] font-medium mb-1.5 desktop:mb-3 block">
                    生成数量
                  </label>
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (val > 0 && val <= 10000) setCount(val);
                    }}
                    min="1"
                    max="10000"
                    className="w-full px-3 desktop:px-5 py-2.5 desktop:py-4 bg-black/40 border border-white/20 rounded-[12px] desktop:rounded-[16px] text-white text-[15px] desktop:text-[17px] focus:ring-2 focus:ring-white/30 outline-none transition-colors desktop:hover:border-white/30"
                  />
                  <div className="text-white/50 text-[11px] desktop:text-[13px] mt-1 desktop:mt-2">
                    最多 10000 个
                  </div>
                </div>

                <button
                  ref={buttonRef}
                  onClick={handleGenerate}
                  disabled={!selectedCountry}
                  className="w-full py-3 desktop:py-5 rounded-[14px] desktop:rounded-[20px] shadow-[0_0_15px_rgba(0,122,255,0.4)] desktop:shadow-[0_0_30px_rgba(0,122,255,0.5)] border border-white/20 flex items-center justify-center gap-2 desktop:gap-3 touch-manipulation overflow-hidden relative transition-all duration-150 bg-gradient-to-b from-[#007AFF]/90 to-[#0055b3]/90 active:scale-[0.92] desktop:hover:scale-[1.02] desktop:active:scale-[0.92] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 desktop-button"
                  style={{
                    transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease'
                  }}
                >
                  <Icon name="sparkles" className="w-4 h-4 desktop:w-6 desktop:h-6 text-white/90" />
                  <span className="text-[15px] desktop:text-[18px] font-semibold tracking-tight text-white">
                    生成号码
                  </span>
                </button>
              </section>
            </div>

            {/* 右侧：生成结果 */}
            <div className="space-y-3 desktop:space-y-6">
              {generatedNumbers.length > 0 && (
                <section className="space-y-2.5 desktop:space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-semibold text-[14px] desktop:text-[18px]">
                      结果 ({generatedNumbers.length})
                    </h2>
                    <div className="flex items-center gap-1.5 desktop:gap-3">
                      <button
                        onClick={handleCopyAll}
                        className="p-1.5 desktop:p-2.5 bg-black/30 border border-white/20 rounded-[10px] desktop:rounded-[14px] active:bg-white/20 transition-all active:scale-95 touch-manipulation relative overflow-hidden desktop:hover:bg-white/15"
                      >
                        <div className={`transition-all duration-300 ${isCopiedAll ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                          <Icon name="copy" className="w-4 h-4 desktop:w-6 desktop:h-6 text-white/80" />
                        </div>
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isCopiedAll ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                          <Icon name="check" className="w-4 h-4 desktop:w-6 desktop:h-6 text-[#34C759]" />
                        </div>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-1.5 desktop:p-2.5 bg-black/30 border border-white/20 rounded-[10px] desktop:rounded-[14px] active:bg-white/20 transition-all active:scale-95 touch-manipulation desktop:hover:bg-white/15"
                      >
                        <Icon name="download" className="w-4 h-4 desktop:w-6 desktop:h-6 text-white/80" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-[16px] desktop:rounded-[24px] border border-white/20 shadow-lg desktop:shadow-2xl overflow-hidden desktop-card">
                    <div className="divide-y divide-white/10">
                      {paginatedNumbers.map((number, idx) => {
                        const actualIndex = page * ITEMS_PER_PAGE + idx;
                        const isCopied = copiedIndex === actualIndex;
                        return (
                          <button
                            key={actualIndex}
                            onClick={() => handleCopy(number, actualIndex)}
                            className="w-full px-3 desktop:px-6 py-2.5 desktop:py-4 flex items-center justify-between active:bg-white/20 active:scale-[0.97] transition-all duration-150 touch-manipulation hover:bg-white/10 desktop:hover:bg-white/15"
                          >
                            <span className="text-white font-mono text-[14px] desktop:text-[16px] truncate">
                              {number}
                            </span>
                            <div className="relative w-4 h-4 desktop:w-6 desktop:h-6 ml-2 shrink-0">
                              <div className={`absolute inset-0 transition-all duration-300 ${isCopied ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                                <Icon name="copy" className="w-4 h-4 desktop:w-6 desktop:h-6 text-white/50" />
                              </div>
                              <div className={`absolute inset-0 transition-all duration-300 ${isCopied ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                                <Icon name="check" className="w-4 h-4 desktop:w-6 desktop:h-6 text-[#34C759]" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 desktop:gap-3">
                      <button
                        onClick={() => { haptic(20); setPage(p => Math.max(0, p - 1)); }}
                        disabled={page === 0}
                        className="px-3 desktop:px-6 py-1.5 desktop:py-3 bg-black/30 border border-white/20 rounded-[10px] desktop:rounded-[14px] text-white text-[13px] desktop:text-[15px] font-medium disabled:opacity-30 active:scale-95 transition-all touch-manipulation desktop:hover:bg-white/15"
                      >
                        上一页
                      </button>
                      <span className="text-white/50 text-[13px] desktop:text-[15px]">
                        {page + 1} / {totalPages}
                      </span>
                      <button
                        onClick={() => { haptic(20); setPage(p => Math.min(totalPages - 1, p + 1)); }}
                        disabled={page >= totalPages - 1}
                        className="px-3 desktop:px-6 py-1.5 desktop:py-3 bg-black/30 border border-white/20 rounded-[10px] desktop:rounded-[14px] text-white text-[13px] desktop:text-[15px] font-medium disabled:opacity-30 active:scale-95 transition-all touch-manipulation desktop:hover:bg-white/15"
                      >
                        下一页
                      </button>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>

          <footer className="pt-2 desktop:pt-8 text-center space-y-1.5 desktop:space-y-4">
            <p className="text-[11px] desktop:text-[13px] text-white/50 tracking-tight">
              支持 {countries.length} 个国家/地区
            </p>
            <p className="text-[10px] desktop:text-[12px] text-white/40">
              仅供测试使用
            </p>
          </footer>
        </main>
      </div>

      <CountrySelector
        isOpen={showCountrySelector}
        onClose={() => setShowCountrySelector(false)}
        onSelect={handleSelectCountry}
        currentCountry={selectedCountry}
      />

      <NavigationMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />

      <style jsx global>{`
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}