import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SurveyStatus, ReportStatus } from '../types';
import { INDUSTRIES, REGIONS } from '../constants';
import { SURVEY_TEMPLATES } from '../constants/surveyTemplatePreset';
import { roleService, surveyService, userService } from '../src/services/supabaseService';

type PreSalesUserOption = {
  id: string;
  label: string;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string | undefined | null) => Boolean(value && UUID_REGEX.test(value));

const isPreSalesRole = (role: any) => {
  const source = `${role?.name || ''} ${role?.description || ''}`.toLowerCase();
  const keywords = [
    '\u552e\u524d', // ??
    'presales',
    'pre-sales',
    'pre sales',
  ];
  return keywords.some((keyword) => source.includes(keyword));
};

const getCurrentUserId = () => {
  try {
    const raw = localStorage.getItem('ems_user');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed?.id || '';
  } catch {
    return '';
  }
};

export const SurveyCreate: React.FC = () => {
  const presetTemplate = SURVEY_TEMPLATES[0];
  const hasLoadedUsersRef = useRef(false);
  const [formData, setFormData] = useState({
    name: '',
    customerName: '',
    projectName: '',
    industry: INDUSTRIES[0],
    region: REGIONS[0],
    preSalesResponsibleId: '',
  });
  const [preSalesUsers, setPreSalesUsers] = useState<PreSalesUserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasLoadedUsersRef.current) return;
    hasLoadedUsersRef.current = true;

    const loadPreSalesUsers = async () => {
      setLoadingUsers(true);
      try {
        const [roles, users] = await Promise.all([roleService.getRoles(), userService.getUsers()]);
        const preSalesRoles = (roles || []).filter(isPreSalesRole);
        // Fallback: if no role keyword match, allow common "???" role names.
        const fallbackRoles = preSalesRoles.length
          ? preSalesRoles
          : (roles || []).filter((role: any) => {
              const source = `${role?.name || ''} ${role?.description || ''}`.toLowerCase();
              return (role?.status || 'enabled') === 'enabled' && source.includes('\u5de5\u7a0b\u5e08');
            });
        const preSalesRoleIds = new Set(fallbackRoles.map((role: any) => role.id));

        const options = (users || [])
          .filter((user: any) => (user.status || 'enabled') === 'enabled')
          .filter((user: any) => {
            const roleIds = Array.isArray(user.role_ids) && user.role_ids.length ? user.role_ids : [user.role_id];
            return roleIds.some((roleId: string) => preSalesRoleIds.has(roleId));
          })
          .map((user: any) => {
            const userId = user.id || user.user_id;
            const displayName = user.user_name || user.name || user.username;
            return {
              id: userId,
              label: `${displayName} (${user.username})`,
            };
          })
          .filter((item: PreSalesUserOption) => isUuid(item.id));

        setPreSalesUsers(options);
        setFormData((prev) => ({
          ...prev,
          preSalesResponsibleId: prev.preSalesResponsibleId || options[0]?.id || '',
        }));
      } catch (error) {
        console.error('加载售前负责人列表失败:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadPreSalesUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentUserId = getCurrentUserId();
      if (!isUuid(currentUserId)) {
        throw new Error('登录用户无效，请重新登录后再试');
      }
      if (!isUuid(formData.preSalesResponsibleId)) {
        throw new Error('请选择有效的售前负责人');
      }

      const surveyData = {
        name: formData.name,
        customer_name: formData.customerName,
        project_name: formData.projectName,
        industry: formData.industry,
        region: formData.region,
        // survey_forms.template_id is UUID FK; local preset id is a business key.
        template_id: isUuid(presetTemplate.id) ? presetTemplate.id : null,
        status: SurveyStatus.DRAFT,
        report_status: ReportStatus.NOT_GENERATED,
        creator_id: currentUserId,
        submitter_id: currentUserId,
        pre_sales_responsible_id: formData.preSalesResponsibleId,
        data: {
          template_key: presetTemplate.id,
        },
      };

      const newSurvey = await surveyService.createSurvey(surveyData);
      if (!newSurvey) {
        throw new Error('创建调研表单失败，请重试');
      }

      let surveyId = newSurvey?.id;
      if (!surveyId) {
        const list = await surveyService.getSurveys();
        const latest = (list || [])
          .filter((item: any) => item.creator_id === currentUserId)
          .sort((a: any, b: any) => new Date(b.create_time).getTime() - new Date(a.create_time).getTime())[0];
        surveyId = latest?.id;
      }

      if (!surveyId) {
        throw new Error('Created form but could not get form ID');
      }

      localStorage.setItem('ems_last_created_survey_id', surveyId);
      navigate(`/surveys/fill/${surveyId}`);
    } catch (error) {
      console.error('创建调研表单失败:', error);
      alert(error instanceof Error ? error.message : '创建调研表单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slideUp">
      <div className="bg-slate-50 border-b border-slate-200 px-8 py-6">
        <h2 className="text-xl font-bold text-slate-900">新建调研表单</h2>
        <p className="text-sm text-slate-500">创建一个新的调研任务，您可以随后填写或分享给客户。</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">表单名称</label>
          <input
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="例如：2026Q1 某工厂能效调研"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">客户名称</label>
            <input
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="客户公司全称"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">项目名称</label>
            <input
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="项目具体名称"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">所属行业</label>
            <select
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            >
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">所属区域</label>
            <select
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            >
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">售前负责人</label>
          <select
            required
            disabled={loadingUsers || preSalesUsers.length === 0}
            className={`w-full px-4 py-2 border border-slate-200 rounded-lg outline-none ${
              loadingUsers || preSalesUsers.length === 0
                ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                : 'focus:ring-2 focus:ring-blue-500'
            }`}
            value={formData.preSalesResponsibleId}
            onChange={(e) => setFormData({ ...formData, preSalesResponsibleId: e.target.value })}
          >
            {loadingUsers && <option value="">加载中...</option>}
            {!loadingUsers && preSalesUsers.length === 0 && <option value="">未找到售前负责人角色用户</option>}
            {!loadingUsers &&
              preSalesUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
          </select>
          <p className="text-xs text-slate-500">仅显示角色为“售前负责人”的用户。</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">调研模板</label>
          <select
            disabled
            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
            value={presetTemplate.id}
          >
            <option value={presetTemplate.id}>{presetTemplate.name}</option>
          </select>
          <p className="text-xs text-slate-500">系统使用预置模板发起调研，不支持手动更改。</p>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading || loadingUsers || preSalesUsers.length === 0}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '正在创建...' : '立即创建'}
          </button>
        </div>
      </form>
    </div>
  );
};

