import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { UserType } from '../types';
import { authService } from '../src/services/authService';
import { messageService, roleService, userService } from '../src/services/supabaseService';
import {
  cachePermissionKeys,
  hasPermission,
  readPermissionKeySet,
  resolvePermissionKeysByUserAndRoles,
} from '../src/auth/permissions';

interface LayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
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
        isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5" />}
        <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
      </div>
      {!to && (
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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

const getDefaultRoleLabel = (type?: string) => {
  if (type === UserType.INTERNAL) return '内部用户';
  if (type === UserType.EXTERNAL) return '外部客户';
  return '普通用户';
};

const getDisplayName = (user: any) => user?.name || user?.user_name || user?.username || '未知用户';

export const Layout: React.FC<LayoutProps> = ({ children, hideSidebar = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<string[]>(['survey', 'product', 'settings']);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messagePanelOpen, setMessagePanelOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [recentMessages, setRecentMessages] = useState<HeaderMessagePreview[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageLoading, setMessageLoading] = useState(false);
  const messagePanelRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const formatRelativeTime = (time?: string) => {
    if (!time) return '刚刚';
    const diffMinutes = Math.floor((Date.now() - new Date(time).getTime()) / (1000 * 60));
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} 小时前`;
    return `${Math.floor(diffMinutes / 1440)} 天前`;
  };

  const hydrateCurrentUser = useCallback(async () => {
    const userStr = localStorage.getItem('ems_user');
    if (!userStr) {
      setCurrentUser(null);
      return;
    }

    try {
      const localUser = JSON.parse(userStr);
      setCurrentUser(localUser);

      const localIds = [localUser?.id, localUser?.user_id].filter(Boolean);
      if (!localIds.length) {
        const fallback = { ...localUser, role: localUser?.role || getDefaultRoleLabel(localUser?.type || localUser?.user_type) };
        setCurrentUser(fallback);
        cachePermissionKeys(Array.isArray(fallback?.permissions) ? fallback.permissions : []);
        return;
      }

      const [users, roles] = await Promise.all([userService.getUsers(), roleService.getRoles()]);
      const roleNameMap = new Map((roles || []).map((role: any) => [role.id, role.name]));
      const dbUser = (users || []).find((u: any) => localIds.includes(u.id) || localIds.includes(u.user_id));
      const permissionKeys = resolvePermissionKeysByUserAndRoles(dbUser || localUser, roles || []);

      const roleIds = Array.isArray(dbUser?.role_ids)
        ? dbUser.role_ids.filter(Boolean)
        : [dbUser?.role_id || localUser?.role_id].filter(Boolean);

      const roleNames = roleIds
        .map((roleId: string) => roleNameMap.get(roleId))
        .filter((name: string | undefined): name is string => Boolean(name));

      const merged = {
        ...localUser,
        ...dbUser,
        name: getDisplayName(dbUser || localUser),
        role_id: roleIds[0] || localUser?.role_id,
        role_ids: roleIds,
        role:
          roleNames.length > 0
            ? roleNames.join('、')
            : localUser?.role || getDefaultRoleLabel(dbUser?.type || dbUser?.user_type || localUser?.type || localUser?.user_type),
        permissions: permissionKeys,
      };

      setCurrentUser(merged);
      localStorage.setItem('ems_user', JSON.stringify(merged));
      cachePermissionKeys(permissionKeys);
    } catch (error) {
      console.error('解析当前用户信息失败:', error);
      setCurrentUser(null);
    }
  }, []);

  const refreshMessageSummary = useCallback(async () => {
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
  }, [currentUser?.id]);

  useEffect(() => {
    void hydrateCurrentUser();
  }, [hydrateCurrentUser, location.pathname]);

  useEffect(() => {
    const handleStorageChange = () => {
      void hydrateCurrentUser();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [hydrateCurrentUser]);

  useEffect(() => {
    void refreshMessageSummary();
  }, [refreshMessageSummary, currentUser?.role_id, currentUser?.role]);

  useEffect(() => {
    if (!messagePanelOpen && !userMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (messagePanelRef.current && !messagePanelRef.current.contains(target)) {
        setMessagePanelOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [messagePanelOpen, userMenuOpen]);

  const handleMessageIconClick = () => {
    setMessagePanelOpen((prev) => {
      const next = !prev;
      if (next) {
        setUserMenuOpen(false);
        void refreshMessageSummary();
      }
      return next;
    });
  };

  const handleGoToMessageCenter = () => {
    setMessagePanelOpen(false);
    navigate('/settings/messages');
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setMessagePanelOpen(false);
    setUserMenuOpen(false);
    setRecentMessages([]);
    setUnreadCount(0);
    navigate('/login');
  };

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => (prev.includes(menu) ? prev.filter((m) => m !== menu) : [...prev, menu]));
  };

  const isMenuOpen = (menu: string) => openMenus.includes(menu);

  const avatarText = useMemo(() => {
    const displayName = getDisplayName(currentUser);
    return displayName ? displayName.charAt(0).toUpperCase() : 'U';
  }, [currentUser]);

  const permissionSet = useMemo(() => {
    if (Array.isArray(currentUser?.permissions)) {
      return new Set(currentUser.permissions);
    }
    return readPermissionKeySet();
  }, [currentUser]);

  const canDashboardView = hasPermission('dashboard:view', permissionSet);
  const canSurveyFormView = hasPermission('survey_form:view', permissionSet);
  const canSurveyTemplateView = hasPermission('survey_template:view', permissionSet);
  const canCapabilityView = hasPermission('capability:view', permissionSet);
  const canReportTemplateView = hasPermission('report_template:view', permissionSet);
  const canUserView = hasPermission('user:view', permissionSet);
  const canRoleView = hasPermission('role:view', permissionSet);
  const canPreSalesView = hasPermission('pre_sales:view', permissionSet);
  const canDictionaryView = hasPermission('dictionary:view', permissionSet);
  const canMessageView = hasPermission('message:view', permissionSet);
  const canLogsView = hasPermission('logs:view', permissionSet);
  const usesWorkspaceScrollLayout =
    location.pathname.includes('/surveys/fill/') || location.pathname.startsWith('/reports/');

  const roleText = currentUser?.role || getDefaultRoleLabel(currentUser?.type || currentUser?.user_type);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {!hideSidebar && (
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
            {canDashboardView && (
              <SidebarItem to="/" icon={ICONS.Dashboard} label="售前综合看板" isActive={location.pathname === '/'} />
            )}

            {(canSurveyFormView || canSurveyTemplateView) && (
              <div className="pt-2">
                <SidebarItem label="客户调研管理" icon={ICONS.Form} isExpanded={isMenuOpen('survey')} onClick={() => toggleMenu('survey')} />
                {isMenuOpen('survey') && (
                  <div className="mt-1 space-y-1 animate-fadeIn">
                    {canSurveyFormView && <SubItem to="/customer-survey/list" label="调研表单列表" />}
                    {canSurveyTemplateView && <SubItem to="/customer-survey/templates" label="调研模板管理" />}
                  </div>
                )}
              </div>
            )}

            {(canCapabilityView || canReportTemplateView) && (
              <div className="pt-2">
                <SidebarItem label="产品方案管理" icon={ICONS.Report} isExpanded={isMenuOpen('product')} onClick={() => toggleMenu('product')} />
                {isMenuOpen('product') && (
                  <div className="mt-1 space-y-1 animate-fadeIn">
                    {canCapabilityView && <SubItem to="/product-solution/capabilities" label="产品能力维护" />}
                    {canReportTemplateView && <SubItem to="/product-solution/report-templates" label="报告模板管理" />}
                  </div>
                )}
              </div>
            )}

            {(canUserView || canRoleView || canPreSalesView || canDictionaryView || canMessageView || canLogsView) && (
              <div className="pt-2">
                <SidebarItem label="系统设置" icon={ICONS.Settings} isExpanded={isMenuOpen('settings')} onClick={() => toggleMenu('settings')} />
                {isMenuOpen('settings') && (
                  <div className="mt-1 space-y-1 animate-fadeIn">
                    {canUserView && <SubItem to="/settings/users" label="用户管理" />}
                    {canRoleView && <SubItem to="/settings/roles" label="角色管理" />}
                    {canPreSalesView && <SubItem to="/settings/pre-sales" label="售前配置" />}
                    {canDictionaryView && <SubItem to="/settings/dictionaries" label="字典管理" />}
                    {canMessageView && <SubItem to="/settings/messages" label="消息中心" />}
                    {canLogsView && <SubItem to="/settings/logs" label="日志管理" />}
                  </div>
                )}
              </div>
            )}
          </nav>
        </aside>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-sm relative z-40 overflow-visible">
          <div className="flex items-center gap-4" />
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
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{getDisplayName(currentUser)}</p>
                      <p className="text-xs text-slate-500">未读消息 {unreadCount} 条</p>
                    </div>
                    <button type="button" onClick={handleGoToMessageCenter} className="text-xs font-semibold text-blue-600 hover:underline">
                      查看全部
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {messageLoading ? (
                      <p className="text-xs text-slate-400 py-4 text-center">消息加载中...</p>
                    ) : recentMessages.length > 0 ? (
                      recentMessages.map((message) => (
                        <button key={message.id} type="button" onClick={handleGoToMessageCenter} className="w-full text-left p-2 rounded-lg hover:bg-slate-50">
                          <div className="flex items-start justify-between gap-3">
                            <p className={`text-sm truncate ${message.read ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>{message.title}</p>
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

            <div className="h-8 w-px bg-slate-200" />

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setMessagePanelOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50 transition-colors"
                aria-label="用户菜单"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">{getDisplayName(currentUser)}</p>
                  <p className="text-[10px] text-slate-400">{roleText}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-blue-600 shadow-inner">
                  {avatarText}
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-xl p-2 z-50">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div
          className={`relative isolate flex-1 overflow-y-auto overflow-x-hidden scroll-smooth ${
            usesWorkspaceScrollLayout ? 'bg-slate-100' : 'p-4 lg:p-6'
          }`}
        >
          <div className={`w-full ${usesWorkspaceScrollLayout ? 'min-h-full' : ''}`}>{children}</div>
        </div>
      </main>
    </div>
  );
};
