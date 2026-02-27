import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportStatus, SurveyStatus, UserType } from '../types';
import { INDUSTRIES, REGIONS } from '../constants';
import { SURVEY_TEMPLATES } from '../constants/surveyTemplatePreset';
import { roleService, surveyService, userService } from '../src/services/supabaseService';

type UserOption = {
  id: string;
  label: string;
  type: UserType;
};

type CreateMode = 'direct' | 'link';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value: string | undefined | null) => Boolean(value && UUID_REGEX.test(value));

const isPreSalesRole = (role: any) => {
  const source = `${role?.name || ''} ${role?.description || ''}`.toLowerCase();
  const keywords = ['\u552e\u524d', 'presales', 'pre-sales', 'pre sales'];
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

const buildShareUrl = (surveyId: string) => {
  return `${window.location.origin}${window.location.pathname}#/authorized/surveys/fill/${surveyId}`;
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
    externalAccessUserId: '',
  });

  const [createMode, setCreateMode] = useState<CreateMode>('direct');
  const [preSalesUsers, setPreSalesUsers] = useState<UserOption[]>([]);
  const [externalUsers, setExternalUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const navigate = useNavigate();

  const canSubmit = useMemo(() => {
    if (loading || loadingUsers || !isUuid(formData.preSalesResponsibleId)) return false;
    if (createMode === 'link' && !isUuid(formData.externalAccessUserId)) return false;
    return true;
  }, [createMode, formData.externalAccessUserId, formData.preSalesResponsibleId, loading, loadingUsers]);

  useEffect(() => {
    if (hasLoadedUsersRef.current) return;
    hasLoadedUsersRef.current = true;

    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const [roles, users] = await Promise.all([roleService.getRoles(), userService.getUsers()]);
        const preSalesRoleIds = new Set((roles || []).filter(isPreSalesRole).map((role: any) => role.id));

        const normalizedUsers: UserOption[] = (users || [])
          .filter((user: any) => (user.status || 'enabled') === 'enabled')
          .map((user: any) => {
            const id = user.id || user.user_id;
            const userType = (user.type || user.user_type || UserType.EXTERNAL) as UserType;
            const name = user.user_name || user.name || user.username;
            return {
              id,
              label: `${name} (${user.username})`,
              type: userType,
            };
          })
          .filter((user) => isUuid(user.id));

        const preSales = (users || [])
          .filter((user: any) => (user.status || 'enabled') === 'enabled')
          .filter((user: any) => {
            const roleIds = Array.isArray(user.role_ids) && user.role_ids.length ? user.role_ids : [user.role_id];
            return roleIds.some((roleId: string) => preSalesRoleIds.has(roleId));
          })
          .map((user: any) => ({
            id: user.id || user.user_id,
            label: `${user.user_name || user.name || user.username} (${user.username})`,
            type: (user.type || user.user_type || UserType.EXTERNAL) as UserType,
          }))
          .filter((user: UserOption) => isUuid(user.id));

        const externals = normalizedUsers.filter((user) => user.type === UserType.EXTERNAL);

        setPreSalesUsers(preSales);
        setExternalUsers(externals);
        setFormData((prev) => ({
          ...prev,
          preSalesResponsibleId: prev.preSalesResponsibleId || preSales[0]?.id || '',
          externalAccessUserId: prev.externalAccessUserId || externals[0]?.id || '',
        }));
      } catch (error) {
        console.error('加载用户列表失败:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    void loadUsers();
  }, []);

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      alert('链接已复制');
    } catch (error) {
      console.error('复制链接失败:', error);
      alert('复制失败，请手动复制');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setGeneratedLink('');

    try {
      const currentUserId = getCurrentUserId();
      if (!isUuid(currentUserId)) {
        throw new Error('登录用户无效，请重新登录后再试');
      }
      if (!isUuid(formData.preSalesResponsibleId)) {
        throw new Error('请选择有效的售前负责人');
      }
      if (createMode === 'link' && !isUuid(formData.externalAccessUserId)) {
        throw new Error('请选择外部填写用户');
      }

      const dataPayload: Record<string, any> = {
        template_key: presetTemplate.id,
      };
      if (createMode === 'link') {
        dataPayload.external_access_user_ids = [formData.externalAccessUserId];
        dataPayload.external_link_enabled = true;
      }

      const surveyData = {
        name: formData.name,
        customer_name: formData.customerName,
        project_name: formData.projectName,
        industry: formData.industry,
        region: formData.region,
        template_id: isUuid(presetTemplate.id) ? presetTemplate.id : null,
        status: SurveyStatus.DRAFT,
        report_status: ReportStatus.NOT_GENERATED,
        creator_id: currentUserId,
        submitter_id: currentUserId,
        pre_sales_responsible_id: formData.preSalesResponsibleId,
        data: dataPayload,
      };

      const newSurvey = await surveyService.createSurvey(surveyData as any);
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

      if (createMode === 'direct') {
        navigate(`/surveys/fill/${surveyId}`);
        return;
      }

      const link = buildShareUrl(surveyId);
      setGeneratedLink(link);
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
        <p className="text-sm text-slate-500">支持直接创建填写，或生成外部授权链接。</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">创建方式</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCreateMode('direct')}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                createMode === 'direct' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-slate-200 text-slate-600'
              }`}
            >
              当前页面直接创建
            </button>
            <button
              type="button"
              onClick={() => setCreateMode('link')}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                createMode === 'link' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-slate-200 text-slate-600'
              }`}
            >
              生成外部填写链接
            </button>
          </div>
        </div>

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
            {!loadingUsers && preSalesUsers.length === 0 && <option value="">未找到售前角色用户</option>}
            {!loadingUsers &&
              preSalesUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
          </select>
        </div>

        {createMode === 'link' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">外部填写用户</label>
            <select
              required
              disabled={loadingUsers || externalUsers.length === 0}
              className={`w-full px-4 py-2 border border-slate-200 rounded-lg outline-none ${
                loadingUsers || externalUsers.length === 0
                  ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                  : 'focus:ring-2 focus:ring-blue-500'
              }`}
              value={formData.externalAccessUserId}
              onChange={(e) => setFormData({ ...formData, externalAccessUserId: e.target.value })}
            >
              {loadingUsers && <option value="">加载中...</option>}
              {!loadingUsers && externalUsers.length === 0 && <option value="">未找到外部用户</option>}
              {!loadingUsers &&
                externalUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.label}
                  </option>
                ))}
            </select>
            <p className="text-xs text-slate-500">仅该外部用户可通过授权页面访问该表单。</p>
          </div>
        )}

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

        {generatedLink && (
          <div className="space-y-2 p-4 rounded-xl border border-blue-200 bg-blue-50">
            <p className="text-sm font-semibold text-blue-800">外部授权链接已生成</p>
            <input
              readOnly
              value={generatedLink}
              className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm text-slate-700"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                复制链接
              </button>
              <button
                type="button"
                onClick={() => window.open(generatedLink, '_blank')}
                className="px-4 py-2 rounded-lg border border-blue-200 text-blue-700 text-sm font-semibold bg-white"
              >
                打开授权页
              </button>
            </div>
          </div>
        )}

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
            disabled={!canSubmit}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '正在创建...' : createMode === 'direct' ? '创建并填写' : '创建并生成链接'}
          </button>
        </div>
      </form>
    </div>
  );
};

