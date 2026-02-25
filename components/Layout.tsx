
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
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

  // 退出登录函数
  const handleLogout = () => {
    // 清除登录状态
    localStorage.removeItem('ems_user');
    localStorage.removeItem('ems_token');
    setCurrentUser(null);
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
            <div className="relative group cursor-pointer">
               <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
               </div>
               <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900">{currentUser?.name || currentUser?.username || '未知用户'}</p>
                <p className="text-[10px] text-slate-400">{currentUser?.role || currentUser?.type || '普通用户'}</p>
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
