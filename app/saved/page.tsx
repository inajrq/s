'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { getSavedIdentities, removeIdentity, type SavedIdentity } from '@/lib/identityData';
import { NavigationMenu, MenuButton } from '@/components/NavigationMenu';
import { Icon } from '@/components/Icon';
import { haptic } from '@/lib/utils';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  identityName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal = memo(({ isOpen, identityName, onConfirm, onCancel }: DeleteConfirmModalProps) => {
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
              确定要删除<br />
              <span className="font-semibold text-white">{identityName}</span> 的身份信息吗?
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

interface IdentityCardProps {
  identity: SavedIdentity;
  onDelete: (identity: SavedIdentity) => void;
  onCopy: (text: string, id: string, field: string) => void;
  copiedInfo: { id: string; field: string } | null;
}

const IdentityCard = memo(({ identity, onDelete, onCopy, copiedInfo }: IdentityCardProps) => {
  const fullName = `${identity.lastName} ${identity.firstName}`;
  const createdDate = new Date(identity.createdAt).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });

  const InfoItem = ({ label, value, field }: { label: string; value: string; field: string }) => {
    const isCopied = copiedInfo?.id === identity.id && copiedInfo?.field === field;
    
    return (
      <div 
        onClick={() => onCopy(value, identity.id, field)}
        className="flex items-center justify-between py-1.5 cursor-pointer touch-manipulation active:bg-white/5 rounded px-1.5 -mx-1.5 transition-colors"
      >
        <span className="text-[12px] text-white/50 shrink-0 w-12">{label}</span>
        <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
          <span className={`text-[13px] font-medium transition-all duration-200 truncate ${isCopied ? 'text-[#34C759]' : 'text-white/90'}`}>
            {isCopied ? '已复制' : value}
          </span>
          {isCopied && <Icon name="check" className="w-3 h-3 text-[#34C759] shrink-0" />}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black/30 rounded-[16px] desktop:rounded-[20px] overflow-hidden border border-white/20 shadow-lg desktop:shadow-xl transition-all duration-200 hover:border-white/30 desktop-card">
      <div className="p-3 desktop:p-5 space-y-2 desktop:space-y-3">
        {/* 头部 - 更紧凑 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Icon name="user" className="w-4 h-4 text-[#409CFF] shrink-0" />
            <h3 className="text-[15px] desktop:text-[17px] font-bold text-white tracking-tight truncate">
              {fullName}
            </h3>
            <span className="text-[11px] text-white/40 shrink-0">{createdDate}</span>
          </div>
          <button
            onClick={() => { haptic(30); onDelete(identity); }}
            className="shrink-0 p-1.5 rounded-full bg-red-500/20 active:bg-red-500/30 transition-all active:scale-95 touch-manipulation desktop:hover:bg-red-500/30"
          >
            <Icon name="delete" className="w-4 h-4 text-red-400" />
          </button>
        </div>

        {/* 信息列表 - 更紧凑 */}
        <div className="space-y-0.5 border-t border-white/10 pt-2">
          <InfoItem label="生日" value={identity.birthday} field="birthday" />
          <InfoItem label="手机号" value={identity.phone} field="phone" />
          <InfoItem label="密码" value={identity.password} field="password" />
          <InfoItem label="邮箱" value={identity.email} field="email" />
        </div>

        {/* 操作按钮 - 更紧凑 */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              haptic(20);
              const emailName = identity.email.split('@')[0];
              window.open(`https://yopmail.net/?login=${emailName}`, '_blank');
            }}
            className="flex-1 py-2 desktop:py-2.5 px-3 bg-gradient-to-r from-[#007AFF]/90 to-[#0055b3]/90 rounded-[12px] desktop:rounded-[14px] text-white font-semibold text-[13px] desktop:text-[14px] text-center shadow-md active:scale-[0.97] transition-all touch-manipulation truncate"
          >
            收件箱
          </button>
          <button
            onClick={() => {
              haptic(30);
              const allInfo = `姓名: ${fullName}\n生日: ${identity.birthday}\n手机号: ${identity.phone}\n密码: ${identity.password}\n邮箱: ${identity.email}`;
              onCopy(allInfo, identity.id, 'all');
            }}
            className="shrink-0 p-2 bg-white/10 rounded-[12px] active:bg-white/20 transition-all active:scale-95 touch-manipulation relative overflow-hidden desktop:hover:bg-white/20"
          >
            <div className={`transition-all duration-300 ${copiedInfo?.id === identity.id && copiedInfo?.field === 'all' ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
              <Icon name="copy" className="w-4 h-4 text-white/80" />
            </div>
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${copiedInfo?.id === identity.id && copiedInfo?.field === 'all' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <Icon name="check" className="w-4 h-4 text-[#34C759]" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
});
IdentityCard.displayName = 'IdentityCard';

export default function SavedIdentitiesPage() {
  const [identities, setIdentities] = useState<SavedIdentity[]>([]);
  const [copiedInfo, setCopiedInfo] = useState<{ id: string; field: string } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; identity: SavedIdentity | null }>({
    isOpen: false,
    identity: null
  });
  
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIdentities(getSavedIdentities());
  }, []);

  const handleDeleteClick = useCallback((identity: SavedIdentity) => {
    setDeleteConfirm({ isOpen: true, identity });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirm.identity) {
      removeIdentity(deleteConfirm.identity.id);
      setIdentities(prev => prev.filter(item => item.id !== deleteConfirm.identity!.id));
    }
    setDeleteConfirm({ isOpen: false, identity: null });
  }, [deleteConfirm.identity]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ isOpen: false, identity: null });
  }, []);

  const handleCopy = useCallback(async (text: string, id: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopiedInfo({ id, field });
      copyTimerRef.current = setTimeout(() => setCopiedInfo(null), 1500);
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
            已保存身份
          </h1>
          <MenuButton onClick={() => { haptic(20); setShowMenu(true); }} />
        </header>

        <main className="max-w-[420px] desktop:max-w-[1200px] mx-auto px-4 desktop:px-8 pt-16 desktop:pt-28 pb-6 desktop:pb-16">
          {identities.length > 0 ? (
            <div className="desktop:grid desktop:grid-cols-2 lg-desktop:grid-cols-3 desktop:gap-4 lg-desktop:gap-6 space-y-3 desktop:space-y-0">
              {identities.map((identity) => (
                <IdentityCard
                  key={identity.id}
                  identity={identity}
                  onDelete={handleDeleteClick}
                  onCopy={handleCopy}
                  copiedInfo={copiedInfo}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 desktop:py-32">
              <div className="bg-black/30 px-6 desktop:px-12 py-6 desktop:py-12 rounded-[16px] desktop:rounded-[24px] border border-white/20 shadow-lg desktop:shadow-2xl text-center space-y-3 desktop:space-y-6 desktop-card">
                <div className="flex justify-center">
                  <Icon name="user" className="w-10 h-10 desktop:w-16 desktop:h-16 text-white/50" />
                </div>
                <div className="space-y-1.5 desktop:space-y-3">
                  <p className="text-[15px] desktop:text-[19px] font-semibold text-white">
                    暂无保存
                  </p>
                  <p className="text-[13px] desktop:text-[15px] text-white/60">
                    在主页生成身份后点击保存
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
        identityName={deleteConfirm.identity ? `${deleteConfirm.identity.lastName} ${deleteConfirm.identity.firstName}` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
