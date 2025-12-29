'use client';

import { useState, useCallback } from 'react';
import { NavigationMenu, MenuButton } from '@/components/NavigationMenu';
import { Icon } from '@/components/Icon';

// 教程消息数据
const TUTORIALS = [
  {
    id: 'mobile',
    subtitle: '手机注册教程',
    author: '门口 mou',
    username: '@owutukankan',
    avatar: '门M',
    content: `FA应用注册 + 日本节点安全模式 + 日本账号 = 账号不会180

注册完后改邮箱为微软 + 改完后手机号取消 = 一辈子不180

⚠️ 有些人如果不改邮箱 = 几十分钟后180`
  },
  {
    id: 'edge',
    subtitle: '电脑Edge注册教程',
    author: '门口 mou',
    username: '@owutukankan',
    avatar: '门M',
    content: `需要顶置脚本页 + 在微软商店搜篡改猴 + 安装 + 打开管理界面 + 把脚本拖入 + 打开开发者模式在插件管理哪一行 = 成功 + 成功刷新脸书 = 恢复旧版 + 先用小助手或脚本的注册 + 注册后改邮箱为微软 = 不会三十分钟后180

此方法始于某些人

统一注册秒封解决办法最好谷歌

如果秒封可以恢复出厂设置试了几次如果还不行就换节点 + 出厂`
  },
  {
    id: 'chrome',
    subtitle: '电脑Chrome注册教程',
    author: '门口 mou',
    username: '@owutukankan',
    avatar: '门M',
    content: `需要顶置脚本页 + 在谷歌商店搜篡改猴需要 VPN + 安装 + 打开管理界面 + 把脚本拖入 + 打开开发者模式在插件管理哪一行 = 成功 + 成功刷新脸书 = 恢复旧版 + 先用小助手或脚本的注册 + 注册后改邮箱为微软 = 不会三十分钟后180

此方法始于某些人`
  }
];

// 教程消息卡片组件
function TutorialCard({ tutorial }: { tutorial: typeof TUTORIALS[0] }) {
  const telegramUrl = `https://t.me/${tutorial.username.replace('@', '')}`;
  
  return (
    <div className="bg-black/30 rounded-[16px] desktop:rounded-[20px] p-4 desktop:p-6 border border-white/20 shadow-lg desktop:shadow-xl desktop-card">
      {/* 头部：头像 + 名字 */}
      <div className="flex items-start gap-3 desktop:gap-4 mb-4">
        {/* 头像 - 电报风格 */}
        <div className="w-10 h-10 desktop:w-12 desktop:h-12 rounded-full bg-gradient-to-br from-[#34C759] to-[#28a745] flex items-center justify-center shrink-0 shadow-md text-sm desktop:text-base font-bold text-white">
          {tutorial.avatar}
        </div>
        
        {/* 名字和用户名 */}
        <div className="flex-1 min-w-0">
          <a 
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[15px] desktop:text-[17px] font-semibold text-white tracking-tight hover:text-[#34C759] transition-colors block"
          >
            {tutorial.author}
          </a>
          <a 
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] desktop:text-[14px] text-white/50 hover:text-[#34C759] transition-colors"
          >
            {tutorial.username}
          </a>
        </div>
      </div>

      {/* 消息内容 */}
      <div className="bg-black/20 rounded-[12px] desktop:rounded-[14px] p-4 desktop:p-5 border border-white/10">
        <h4 className="text-[15px] desktop:text-[16px] font-semibold text-white mb-3 flex items-center gap-2">
          <Icon name="book" className="w-4 h-4 text-[#34C759]" />
          {tutorial.subtitle}
        </h4>
        <p className="text-[14px] desktop:text-[15px] text-white/85 leading-relaxed whitespace-pre-line">
          {tutorial.content}
        </p>
      </div>
    </div>
  );
}

export default function TutorialPage() {
  const [showMenu, setShowMenu] = useState(false);

  const handleOpenMenu = useCallback(() => {
    setShowMenu(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  return (
    <div className="min-h-screen relative font-sans text-white pb-10 selection:bg-blue-400/30 overflow-x-hidden">
      {/* 导航菜单 */}
      <NavigationMenu isOpen={showMenu} onClose={handleCloseMenu} />

      {/* 内容层 */}
      <div className="relative z-10">
        {/* 头部 - 透明 */}
        <header className="fixed top-0 left-0 right-0 h-[52px] desktop:h-[64px] z-40 flex items-center justify-between px-4 desktop:px-8 pt-2 desktop:pt-0">
          <h1 className="text-[17px] desktop:text-[20px] font-semibold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            注册教程
          </h1>
          <MenuButton onClick={handleOpenMenu} />
        </header>

        {/* 主内容 */}
        <main className="max-w-[500px] desktop:max-w-[700px] mx-auto px-4 desktop:px-8 pt-16 desktop:pt-24 pb-6 desktop:pb-16">
          <div className="space-y-4 desktop:space-y-6">
            {TUTORIALS.map((tutorial) => (
              <TutorialCard key={tutorial.id} tutorial={tutorial} />
            ))}
          </div>

          {/* 底部提示 */}
          <div className="mt-6 desktop:mt-8 text-center">
            <p className="text-[12px] desktop:text-[13px] text-white/40">
              教程内容来自群友分享
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
