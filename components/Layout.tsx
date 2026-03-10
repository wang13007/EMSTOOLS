
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { UserType } from '../types';
import { messageService } from '../src/services/supabaseService';

interface LayoutProps {
  children: React.ReactNode;
}

interface HeaderMessagePreview {
  id: string;
  title: string;
  read: boolean;
  time: string;
}

const SidebarItem = ({ to, icon: Icon, label, isActive, isExpanded, onClick }: { to?: string; icon?: any; label: string; isActive?: boolean; isExpanded?: boolean; onClick?: () => void }) => {
  const content = (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5" />}
        <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
      </div>
      {!to && (
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
};

const SubItem = ({ to, label }: { to: string; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 pl-12 pr-4 py-2 rounded-lg transition-colors text-sm ${
        isActive ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
    </Link>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<string[]>(['survey', 'product', 'settings']);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messagePanelOpen, setMessagePanelOpen] = useState(false);
  const [recentMessages, setRecentMessages] = useState<HeaderMessagePreview[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageLoading, setMessageLoading] = useState(false);
  const messagePanelRef = useRef<HTMLDivElement | null>(null);

  const formatRelativeTime = (time?: string) => {
    if (!time) return '刚刚';
    const diffMinutes = Math.floor((Date.now() - new Date(time).getTime()) / (1000 * 60));
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前`;
    return `${Math.floor(diffMinutes / 1440)}天前`;
  };

  const refreshMessageSummary = async () => {
    if (!currentUser?.id) {
      setRecentMessages([]);
      setUnreadCount(0);
      return;
    }

    setMessageLoading(true);
    try {
      const [messages, unread] = await Promise.all([
        messageService.getCurrentUserMessages(5),
        messageService.getCurrentUserUnreadCount(),
      ]);

      setRecentMessages(
        (messages || []).map((message: any) => ({
          id: message.id,
          title: message.title,
          read: !!message.read,
          time: formatRelativeTime(message.create_time),
        }))
      );
      setUnreadCount(unread);
    } finally {
      setMessageLoading(false);
    }
  };

  // 获取当前登录用户信息
  useEffect(() => {
    const fetchCurrentUser = () => {
      const userStr = localStorage.getItem('ems_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
        } catch (error) {
          console.error('解析用户信息失败:', error);
        }
      }
    };

    fetchCurrentUser();

    // 监听 localStorage 变化
    const handleStorageChange = () => {
      fetchCurrentUser();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    refreshMessageSummary();
  }, [currentUser?.id, currentUser?.role_id, currentUser?.role]);

  useEffect(() => {
    if (!messagePanelOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!messagePanelRef.current) return;
      if (!messagePanelRef.current.contains(event.target as Node)) {
        setMessagePanelOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [messagePanelOpen]);

  const handleMessageIconClick = () => {
    setMessagePanelOpen((prev) => {
      const next = !prev;
      if (next) {
        void refreshMessageSummary();
      }
      return next;
    });
  };

  const handleGoToMessageCenter = () => {
    setMessagePanelOpen(false);
    navigate('/settings/messages');
  };

  // 退出登录函数
  const handleLogout = () => {
    // 清除登录状态
    localStorage.removeItem('ems_user');
    localStorage.removeItem('ems_token');
    setCurrentUser(null);
    setMessagePanelOpen(false);
    setRecentMessages([]);
    setUnreadCount(0);
    // 跳转到登录页面
    navigate('/login');
  };

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => 
      prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]
    );
  };

  const isMenuOpen = (menu: string) => openMenus.includes(menu);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm z-10">
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-blue-600 font-black text-lg tracking-tight">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
              <ICONS.Energy />
            </div>
            <span>EMS 售前助手</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {/* 一级菜单: 售前综合看板 */}
          <SidebarItem 
            to="/" 
            icon={ICONS.Dashboard} 
            label="售前综合看板" 
            isActive={location.pathname === '/'} 
          />

          {/* 一级菜单: 客户调研管理 */}
          <div className="pt-2">
            <SidebarItem 
              label="客户调研管理" 
              icon={ICONS.Form} 
              isExpanded={isMenuOpen('survey')}
              onClick={() => toggleMenu('survey')}
            />
            {isMenuOpen('survey') && (
              <div className="mt-1 space-y-1 animate-fadeIn">
                <SubItem to="/customer-survey/list" label="调研表单列表" />
                <SubItem to="/customer-survey/templates" label="调研模板管理" />
              </div>
            )}
          </div>

          {/* 一级菜单: 产品方案管理 */}
          <div className="pt-2">
            <SidebarItem 
              label="产品方案管理" 
              icon={ICONS.Report} 
              isExpanded={isMenuOpen('product')}
              onClick={() => toggleMenu('product')}
            />
            {isMenuOpen('product') && (
              <div className="mt-1 space-y-1 animate-fadeIn">
                <SubItem to="/product-solution/capabilities" label="产品能力维护" />
                <SubItem to="/product-solution/report-templates" label="报告模板管理" />
              </div>
            )}
          </div>

          {/* 一级菜单: 系统设置 */}
          <div className="pt-2">
            <SidebarItem 
              label="系统设置" 
              icon={ICONS.Settings} 
              isExpanded={isMenuOpen('settings')}
              onClick={() => toggleMenu('settings')}
            />
            {isMenuOpen('settings') && (
              <div className="mt-1 space-y-1 animate-fadeIn">
                <SubItem to="/settings/users" label="用户管理" />
                <SubItem to="/settings/roles" label="角色管理" />
                <SubItem to="/settings/pre-sales" label="售前配置" />
                <SubItem to="/settings/dictionaries" label="字典管理" />
                <SubItem to="/settings/messages" label="消息中心" />
                <SubItem to="/settings/logs" label="日志管理" />
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                {currentUser?.name || currentUser?.username ? (currentUser.name || currentUser.username).charAt(0).toUpperCase() : '未'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.name || currentUser?.username || '未知用户'}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser?.username || '未知账号'}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2 py-2 text-xs text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              退出登录
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm relative z-0">
          <div className="flex items-center gap-4">
          </div>
          <div className="flex items-center gap-6">
            <div className="relative" ref={messagePanelRef}>
              <button
                type="button"
                onClick={handleMessageIconClick}
                className="relative text-slate-400 hover:text-blue-600 transition-colors"
                aria-label="消息通知"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] leading-5 text-center border border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {messagePanelOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{currentUser?.name || currentUser?.username || '当前用户'}</p>
                      <p className="text-xs text-slate-500">未读消息 {unreadCount} 条</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoToMessageCenter}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      查看全部
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {messageLoading ? (
                      <p className="text-xs text-slate-400 py-4 text-center">消息加载中...</p>
                    ) : recentMessages.length > 0 ? (
                      recentMessages.map((message) => (
                        <button
                          key={message.id}
                          type="button"
                          onClick={handleGoToMessageCenter}
                          className="w-full text-left p-2 rounded-lg hover:bg-slate-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className={`text-sm truncate ${message.read ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>
                              {message.title}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0">{message.time}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">暂无消息</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900">{currentUser?.name || currentUser?.username || '未知用户'}</p>
                <p className="text-[10px] text-slate-400">
                  {currentUser?.role || 
                   (currentUser?.user_type === UserType.INTERNAL || currentUser?.type === UserType.INTERNAL ? '内部用户' : 
                    currentUser?.user_type === UserType.EXTERNAL || currentUser?.type === UserType.EXTERNAL ? '外部客户' : '普通用户')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-blue-600 shadow-inner">
                {currentUser?.name || currentUser?.username ? (currentUser.name || currentUser.username).charAt(0) : '未'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
