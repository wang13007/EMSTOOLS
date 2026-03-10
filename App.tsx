
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { SurveyCreate } from './pages/SurveyCreate';
import { ReportDetail } from './pages/ReportDetail';
import { SurveyList } from './pages/SurveyList';
import { SurveyTemplates } from './pages/SurveyTemplates';
import { SurveyFill } from './pages/SurveyFill';
import { PreSalesConfig } from './pages/PreSalesConfig';
import { UserManagement } from './pages/UserManagement';
import { RoleManagement } from './pages/RoleManagement';
import { ProductCapabilities } from './pages/ProductCapabilities';
import { ReportTemplateManagement } from './pages/ReportTemplateManagement';
import { MessageCenter } from './pages/MessageCenter';
import { LogManagement } from './pages/LogManagement';
import { Dictionaries } from './pages/Dictionaries';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const getCurrentUserFromStorage = () => {
  try {
    const raw = localStorage.getItem('ems_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const isExternalUser = (user: any) => user?.type === 'external' || user?.user_type === 'external';

const isExternalAllowedPath = (pathname: string) => {
  return (
    pathname === '/customer-survey/list' ||
    /^\/surveys\/fill\/[^/]+$/.test(pathname) ||
    /^\/authorized\/surveys\/fill\/[^/]+$/.test(pathname)
  );
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const currentUser = getCurrentUserFromStorage();
  const hideSidebar = isExternalUser(currentUser) || location.pathname.includes('/authorized/surveys/fill/');
  return <Layout hideSidebar={hideSidebar}>{children}</Layout>;
};

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 animate-fadeIn">
    <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
       <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
    </div>
    <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
    <p className="text-slate-500">该功能模块正在建设中，预计在后续版本发布。</p>
  </div>
);

// 璺敱淇濇姢缁勪欢
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('ems_token');
  const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
  if (!isLoggedIn) {
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  const currentUser = getCurrentUserFromStorage();
  if (isExternalUser(currentUser) && !isExternalAllowedPath(location.pathname)) {
    return <Navigate to="/customer-survey/list" replace />;
  }

  return <>{children}</>;
};

// 鍏叡璺敱缁勪欢锛堜笉闇€瑕佺櫥褰曪級
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('ems_token');
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect');
  return isLoggedIn ? <Navigate to={redirect || '/'} replace /> : <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 鍏叡璺敱 */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* 鍙椾繚鎶ょ殑璺敱 */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        {/* 涓€绾ц彍鍗? 瀹㈡埛璋冪爺绠＄悊 */}
        <Route path="/customer-survey/list" element={
          <ProtectedRoute>
            <AppLayout>
              <SurveyList />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/customer-survey/templates" element={
          <ProtectedRoute>
            <AppLayout>
              <SurveyTemplates />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        {/* 璋冪爺鍔熻兘鎵╁睍璺緞 */}
        <Route path="/surveys/new" element={
          <ProtectedRoute>
            <AppLayout>
              <SurveyCreate />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/surveys/fill/:id" element={
          <ProtectedRoute>
            <AppLayout>
              <SurveyFill />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/authorized/surveys/fill/:id" element={
          <ProtectedRoute>
            <AppLayout>
              <SurveyFill />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        {/* 涓€绾ц彍鍗? 浜у搧鏂规绠＄悊 */}
        <Route path="/product-solution/capabilities" element={
          <ProtectedRoute>
            <AppLayout>
              <ProductCapabilities />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        {/* 鎶ュ憡璇︽儏 */}
        <Route path="/product-solution/report-templates" element={
          <ProtectedRoute>
            <AppLayout>
              <ReportTemplateManagement />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/reports/:id" element={
          <ProtectedRoute>
            <AppLayout>
              <ReportDetail />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* 涓€绾ц彍鍗? 绯荤粺璁剧疆 */}
        <Route path="/settings/users" element={
          <ProtectedRoute>
            <AppLayout>
              <UserManagement />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings/roles" element={
          <ProtectedRoute>
            <AppLayout>
              <RoleManagement />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings/pre-sales" element={
          <ProtectedRoute>
            <AppLayout>
              <PreSalesConfig />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings/dictionaries" element={
          <ProtectedRoute>
            <AppLayout>
              <Dictionaries />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings/messages" element={
          <ProtectedRoute>
            <AppLayout>
              <MessageCenter />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings/logs" element={
          <ProtectedRoute>
            <AppLayout>
              <LogManagement />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;

