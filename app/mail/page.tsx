'use client';

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { tempMailList, isFavorite, toggleFavorite, type TempMail } from '@/lib/mailData';
import { NavigationMenu, MenuButton } from '@/components/NavigationMenu';
import { Icon } from '@/components/Icon';
import { haptic } from '@/lib/utils';

interface MailCardProps {
  mail: TempMail;
  isFav: boolean;
  onToggleFavorite: (mail: TempMail) => void;
  onCopy: (url: string, name: string) => void;
  copiedId: string | null;
}

const MailCard = memo(({ mail, isFav, onToggleFavorite, onCopy, copiedId }: MailCardProps) => {
  const isCopied = copiedId === mail.id;

  return (
    <div className="bg-black/30 rounded-[14px] desktop:rounded-[20px] overflow-hidden border border-white/20 shadow-lg desktop:shadow-2xl p-3 desktop:p-6 space-y-2 desktop:space-y-4 transition-all duration-200 hover:border-white/30 desktop-card">
      <div className="flex items-start justify-between gap-1.5 desktop:gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] desktop:text-[18px] font-bold text-white tracking-tight leading-tight break-words">
            {mail.name}
          </h3>
          {mail.description && (
            <p className="text-[11px] desktop:text-[14px] text-white/50 mt-0.5 desktop:mt-1.5 line-clamp-2">
              {mail.description}
            </p>
          )}
        </div>
        <button
          onClick={() => { haptic(30); onToggleFavorite(mail); }}
          className="shrink-0 p-1 desktop:p-2.5 rounded-full bg-white/10 active:bg-white/20 transition-all active:scale-95 touch-manipulation desktop:hover:bg-white/20"
        >
          <Icon
            name={isFav ? 'star' : 'starOutline'}
            className={`w-3.5 h-3.5 desktop:w-6 desktop:h-6 ${isFav ? 'text-[#FFD700]' : 'text-white/50'}`}
          />
        </button>
      </div>

      <div className="flex items-center gap-1.5 desktop:gap-3">
        <a
          href={mail.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => haptic(20)}
          className="flex-1 py-2 desktop:py-3 px-3 desktop:px-5 bg-gradient-to-r from-[#007AFF]/90 to-[#0055b3]/90 rounded-[12px] desktop:rounded-[16px] text-white font-semibold text-[13px] desktop:text-[16px] text-center shadow-md desktop:shadow-xl active:scale-[0.97] transition-all touch-manipulation truncate desktop-button"
        >
          访问
        </a>
        <button
          onClick={() => { haptic(30); onCopy(mail.url, mail.id); }}
          className="shrink-0 p-2 desktop:p-3 bg-white/10 rounded-[12px] desktop:rounded-[16px] active:bg-white/20 transition-all active:scale-95 touch-manipulation relative overflow-hidden desktop:hover:bg-white/20"
        >
          <div className={`transition-all duration-300 ${isCopied ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
            <Icon name="copy" className="w-4 h-4 desktop:w-6 desktop:h-6 text-white/80" />
          </div>
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isCopied ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <Icon name="check" className="w-4 h-4 desktop:w-6 desktop:h-6 text-[#34C759]" />
          </div>
        </button>
      </div>
    </div>
  );
});
MailCard.displayName = 'MailCard';

export default function MailPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const favs = new Set(
      tempMailList.filter(mail => isFavorite(mail.id)).map(mail => mail.id)
    );
    setFavorites(favs);
  }, []);

  // 搜索防抖
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchQuery]);

  const filteredMails = useMemo(() => {
    if (!debouncedQuery) return tempMailList;
    const query = debouncedQuery.toLowerCase();
    return tempMailList.filter(mail =>
      mail.name.toLowerCase().includes(query) ||
      mail.description?.toLowerCase().includes(query) ||
      mail.url.toLowerCase().includes(query)
    );
  }, [debouncedQuery]);

  const handleToggleFavorite = useCallback((mail: TempMail) => {
    const newIsFav = toggleFavorite(mail);
    setFavorites(prev => {
      const next = new Set(prev);
      if (newIsFav) {
        next.add(mail.id);
      } else {
        next.delete(mail.id);
      }
      return next;
    });
  }, []);

  const handleCopy = useCallback(async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (error) {
      console.error('Copy failed:', error);
      haptic(50);
    }
  }, []);

  return (
    <div className="min-h-screen relative font-sans text-white pb-10 selection:bg-blue-400/30 overflow-x-hidden">
      <div className="relative z-10">
        <header className="fixed top-0 left-0 right-0 h-[52px] desktop:h-[64px] z-40 flex items-center justify-between px-4 desktop:px-8 pt-2 desktop:pt-0 transition-all duration-300">
          <h1 className="text-[17px] desktop:text-[20px] font-semibold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            临时邮箱大全
          </h1>
          <MenuButton onClick={() => { haptic(20); setShowMenu(true); }} />
        </header>

        <main className="max-w-[420px] desktop:max-w-[1200px] mx-auto px-4 desktop:px-8 pt-16 desktop:pt-32 pb-6 desktop:pb-16 space-y-4 desktop:space-y-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 desktop:pl-5 flex items-center pointer-events-none">
              <Icon name="search" className="w-4 h-4 desktop:w-6 desktop:h-6 text-white/40" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索临时邮箱..."
              className="w-full pl-9 desktop:pl-14 pr-8 desktop:pr-12 py-2.5 desktop:py-4 bg-black/30 border border-white/20 rounded-[12px] desktop:rounded-[20px] text-[14px] desktop:text-[17px] text-white placeholder-white/40 focus:ring-2 focus:ring-white/30 focus:bg-black/40 transition-colors caret-[#007AFF] outline-none shadow-lg desktop:shadow-2xl desktop:hover:border-white/30"
            />
            {searchQuery && (
              <button
                onClick={() => { haptic(20); setSearchQuery(''); }}
                className="absolute inset-y-0 right-0 pr-3 desktop:pr-5 flex items-center touch-manipulation active:scale-90 transition-transform"
              >
                <div className="bg-white/20 rounded-full p-0.5 desktop:p-1.5">
                  <Icon name="close" className="w-3 h-3 desktop:w-4 desktop:h-4 text-white" />
                </div>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 desktop:grid-cols-2 lg-desktop:grid-cols-3 desktop:gap-6 lg-desktop:gap-8">
            {filteredMails.length > 0 ? (
              filteredMails.map((mail) => (
                <MailCard
                  key={mail.id}
                  mail={mail}
                  isFav={favorites.has(mail.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onCopy={handleCopy}
                  copiedId={copiedId}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 desktop:py-24 text-white/40 text-[13px] desktop:text-[16px]">
                未找到匹配的邮箱服务
              </div>
            )}
          </div>
        </main>
      </div>

      <NavigationMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  );
}
