
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { MessageCenter } from './pages/MessageCenter';
import { LogManagement } from './pages/LogManagement';
import { Dictionaries } from './pages/Dictionaries';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 animate-fadeIn">
    <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
       <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
    </div>
    <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
    <p className="text-slate-500">该功能模块正在建设中，预计下个版本发布。</p>
  </div>
);

// 路由保护组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = !!localStorage.getItem('ems_token');
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
};

// 公共路由组件（不需要登录）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = !!localStorage.getItem('ems_token');
  return isLoggedIn ? <Navigate to="/" replace /> : <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 公共路由 */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* 受保护的路由 */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        {/* 一级菜单: 客户调研管理 */}
        <Route path="/customer-survey/list" element={
          <ProtectedRoute>
            <Layout>
              <SurveyList />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/customer-survey/templates" element={
          <ProtectedRoute>
            <Layout>
              <SurveyTemplates />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 调研功能扩展路径 */}
        <Route path="/surveys/new" element={
          <ProtectedRoute>
            <Layout>
              <SurveyCreate />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/surveys/fill/:id" element={
          <ProtectedRoute>
            <Layout>
              <SurveyFill />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 一级菜单: 产品方案管理 */}
        <Route path="/product-solution/capabilities" element={
          <ProtectedRoute>
            <Layout>
              <ProductCapabilities />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* 报告详情 */}
        <Route path="/reports/:id" element={
          <ProtectedRoute>
            <Layout>
              <ReportDetail />
            </Layout>
          </ProtectedRoute>
        } />

        {/* 一级菜单: 系统设置 */}
        <Route path="/settings/users" element={
          <ProtectedRoute>
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings/roles" element={
          <ProtectedRoute>
            <Layout>
              <RoleManagement />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings/pre-sales" element={
          <ProtectedRoute>
            <Layout>
              <PreSalesConfig />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings/dictionaries" element={
          <ProtectedRoute>
            <Layout>
              <Dictionaries />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings/messages" element={
          <ProtectedRoute>
            <Layout>
              <MessageCenter />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings/logs" element={
          <ProtectedRoute>
            <Layout>
              <LogManagement />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
