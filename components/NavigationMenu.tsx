'use client';

import { useEffect, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/Icon';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavigationMenu = memo(({ isOpen, onClose }: NavigationMenuProps) => {
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const menuItems = [
    { href: '/', label: '脸书小助手', icon: 'home' },
    { href: '/saved', label: '已保存身份', icon: 'star' },
    { href: '/sjh', label: '手机号生成器', icon: 'phone' },
    { href: '/mail', label: '临时邮箱', icon: 'mail' },
    { href: '/mail/favorites', label: '邮箱收藏', icon: 'inbox' },
    { href: '/tutorial', label: '注册教程', icon: 'book' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end desktop:justify-center desktop:items-center">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-[280px] desktop:w-[400px] h-full desktop:h-auto desktop:max-h-[80vh] bg-black/40 border-l desktop:border desktop:rounded-[24px] border-white/20 shadow-2xl overflow-hidden flex flex-col"
        style={{
          animation: isOpen ? 'slideInRight 0.3s ease-out' : '',
          willChange: 'transform'
        }}
      >
        <div className="p-3 desktop:p-4 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between shrink-0">
          <h3 className="text-[16px] desktop:text-[18px] font-semibold text-white tracking-tight drop-shadow-md">
            导航菜单
          </h3>
          <button
            onClick={onClose}
            className="bg-white/10 p-1 desktop:p-1.5 rounded-full text-white/60 hover:bg-white/20 active:scale-95 transition-all touch-manipulation desktop:hover:text-white"
          >
            <Icon name="close" className="w-4 h-4 desktop:w-4.5 desktop:h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-3 desktop:p-5 space-y-1 desktop:space-y-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`w-full flex items-center gap-2.5 desktop:gap-3 px-3 desktop:px-4 py-2.5 desktop:py-3 rounded-lg desktop:rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation border desktop-hover ${
                  isActive
                    ? 'bg-white/10 border-white/10 shadow-lg text-[#409CFF] font-semibold'
                    : 'bg-transparent border-transparent text-white/80 active:bg-white/10 desktop:hover:bg-white/10 desktop:hover:border-white/10'
                }`}
              >
                <div className={`p-1 desktop:p-1.5 rounded-md desktop:rounded-lg ${isActive ? 'bg-[#007AFF]/20' : 'bg-white/10'}`}>
                  <Icon name={item.icon} className={`w-4 h-4 desktop:w-4.5 desktop:h-4.5 ${isActive ? 'text-[#409CFF]' : 'text-white/50'}`} />
                </div>
                <span className="text-[15px] desktop:text-[16px] tracking-tight drop-shadow-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @media (min-width: 768px) {
          @keyframes slideInRight {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
});
NavigationMenu.displayName = 'NavigationMenu';

export const MenuButton = memo(({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="p-1.5 desktop:p-2 rounded-full bg-black/40 border border-white/20 shadow-lg desktop:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation hover:bg-black/50 desktop:hover:border-white/30"
  >
    <Icon name="menu" className="w-5 h-5 desktop:w-6 desktop:h-6 text-white drop-shadow-md" />
  </button>
));
MenuButton.displayName = 'MenuButton';
