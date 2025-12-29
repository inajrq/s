'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { getFavorites, removeFavorite, type TempMail } from '@/lib/mailData';
import { NavigationMenu, MenuButton } from '@/components/NavigationMenu';
import { Icon } from '@/components/Icon';
import { haptic } from '@/lib/utils';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  mailName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal = memo(({ isOpen, mailName, onConfirm, onCancel }: DeleteConfirmModalProps) => {
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div
        className="relative w-full max-w-[320px] bg-black/40 border border-white/20 rounded-[20px] overflow-hidden shadow-2xl"
        style={{
          animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          willChange: 'transform'
        }}
      >
        <div className="p-5 text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-red-500/20 p-3 rounded-full">
              <Icon name="delete" className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[17px] font-bold text-white tracking-tight">
              确认删除
            </h3>
            <p className="text-[14px] text-white/70 leading-relaxed">
              确定要从收藏中移除<br />
              <span className="font-semibold text-white">{mailName}</span> 吗?
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { haptic(20); onCancel(); }}
              className="flex-1 py-3 rounded-[14px] bg-white/10 text-white font-semibold text-[15px] active:scale-95 transition-all touch-manipulation"
            >
              取消
            </button>
            <button
              onClick={() => { haptic(30); onConfirm(); }}
              className="flex-1 py-3 rounded-[14px] bg-gradient-to-r from-red-500/90 to-red-600/90 text-white font-semibold text-[15px] shadow-lg active:scale-95 transition-all touch-manipulation"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
});
DeleteConfirmModal.displayName = 'DeleteConfirmModal';

interface FavoriteCardProps {
  mail: TempMail;
  onDelete: (mail: TempMail) => void;
  onCopy: (url: string, id: string) => void;
  copiedId: string | null;
}

const FavoriteCard = memo(({ mail, onDelete, onCopy, copiedId }: FavoriteCardProps) => {
  const isCopied = copiedId === mail.id;

  return (
    <div className="bg-black/30 rounded-[14px] desktop:rounded-[24px] overflow-hidden border border-white/20 shadow-lg desktop:shadow-2xl transition-all duration-200 hover:border-white/30 desktop-card">
      <div className="p-3 desktop:p-6 space-y-2 desktop:space-y-4">
        <div className="flex items-start justify-between gap-1.5 desktop:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1 desktop:gap-3">
              <Icon name="star" className="w-3 h-3 desktop:w-5 desktop:h-5 text-[#FFD700] shrink-0 mt-0.5" />
              <h3 className="text-[13px] desktop:text-[18px] font-bold text-white tracking-tight leading-tight break-words">
                {mail.name}
              </h3>
            </div>
          </div>
          <button
            onClick={() => { haptic(30); onDelete(mail); }}
            className="shrink-0 p-1 desktop:p-2.5 rounded-full bg-red-500/20 active:bg-red-500/30 transition-all active:scale-95 touch-manipulation desktop:hover:bg-red-500/30"
          >
            <Icon name="delete" className="w-3.5 h-3.5 desktop:w-6 desktop:h-6 text-red-400" />
          </button>
        </div>

        {mail.description && (
          <p className="text-[11px] desktop:text-[14px] text-white/60 line-clamp-2">
            {mail.description}
          </p>
        )}

        <div className="flex items-center gap-1.5 desktop:gap-3">
          <a
            href={mail.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic(20)}
            className="flex-1 py-2 desktop:py-3 px-3 desktop:px-5 bg-gradient-to-r from-[#007AFF]/90 to-[#0055b3]/90 rounded-[10px] desktop:rounded-[16px] text-white font-semibold text-[13px] desktop:text-[16px] text-center shadow-md desktop:shadow-xl active:scale-[0.97] transition-all touch-manipulation truncate desktop-button"
          >
            访问
          </a>
          <button
            onClick={() => { haptic(30); onCopy(mail.url, mail.id); }}
            className="shrink-0 p-2 desktop:p-3 bg-white/10 rounded-[10px] desktop:rounded-[16px] active:bg-white/20 transition-all active:scale-95 touch-manipulation relative overflow-hidden desktop:hover:bg-white/20"
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
    </div>
  );
});
FavoriteCard.displayName = 'FavoriteCard';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<TempMail[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; mail: TempMail | null }>({
    isOpen: false,
    mail: null
  });

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleDeleteClick = useCallback((mail: TempMail) => {
    setDeleteConfirm({ isOpen: true, mail });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm.mail) {
      removeFavorite(deleteConfirm.mail.id);
      setFavorites(prev => prev.filter(item => item.id !== deleteConfirm.mail!.id));
    }
    setDeleteConfirm({ isOpen: false, mail: null });
  }, [deleteConfirm.mail]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ isOpen: false, mail: null });
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
            我的收藏
          </h1>
          <MenuButton onClick={() => { haptic(20); setShowMenu(true); }} />
        </header>

        <main className="max-w-[420px] desktop:max-w-[1200px] mx-auto px-4 desktop:px-8 pt-16 desktop:pt-32 pb-6 desktop:pb-16">
          {favorites.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 desktop:grid-cols-2 lg-desktop:grid-cols-3 desktop:gap-6 lg-desktop:gap-8">
              {favorites.map((mail) => (
                <FavoriteCard
                  key={mail.id}
                  mail={mail}
                  onDelete={handleDeleteClick}
                  onCopy={handleCopy}
                  copiedId={copiedId}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 desktop:py-32">
              <div className="bg-black/30 px-6 desktop:px-12 py-6 desktop:py-12 rounded-[16px] desktop:rounded-[24px] border border-white/20 shadow-lg desktop:shadow-2xl text-center space-y-3 desktop:space-y-6 desktop-card">
                <div className="flex justify-center">
                  <Icon name="inbox" className="w-10 h-10 desktop:w-16 desktop:h-16 text-white/50" />
                </div>
                <div className="space-y-1.5 desktop:space-y-3">
                  <p className="text-[15px] desktop:text-[19px] font-semibold text-white">
                    暂无收藏
                  </p>
                  <p className="text-[12px] desktop:text-[15px] text-white/60">
                    点击星标添加收藏
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <NavigationMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        mailName={deleteConfirm.mail?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}