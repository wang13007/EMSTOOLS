# EMS 售前调研工具

> 当前仓库是 **React + TypeScript + Vite** 前端应用，业务数据通过 Supabase 读写；当前不包含独立 Node/Nest 后端。

## 1. 项目概览

| 项目 | 说明 |
| --- | --- |
| 产品目标 | 标准化售前调研采集、生成 AI + 模板报告、沉淀售前资产 |
| 架构形态 | 前端直连 Supabase（Service Layer） |
| 主要角色 | 内部用户（管理员/售前）、外部用户（客户） |
| 报告能力 | `@google/genai` + 本地兜底报告 |

## 2. 功能与路由

| 一级模块 | 页面 | 路由 | 说明 |
| --- | --- | --- | --- |
| 认证 | 登录 | `/login` | 公共路由 |
| 认证 | 注册 | `/register` | 公共路由（外部用户） |
| 看板 | 售前综合看板 | `/` | 受保护路由 |
| 客户调研管理 | 调研表单列表 | `/customer-survey/list` | 支持搜索、筛选、排序、删除、重填 |
| 客户调研管理 | 调研模板查看 | `/customer-survey/templates` | 模板结构查看 |
| 客户调研管理 | 新建调研 | `/surveys/new` | 支持直接创建/外链创建 |
| 客户调研管理 | 调研填写 | `/surveys/fill/:id` | 自动保存、提交生成报告 |
| 客户调研管理 | 授权填写 | `/authorized/surveys/fill/:id` | 外部用户授权链路 |
| 产品方案管理 | 产品能力维护 | `/product-solution/capabilities` | 行内编辑、Excel 导入导出 |
| 产品方案管理 | 报告模板管理 | `/product-solution/report-templates` | 模板查看与本地覆盖 |
| 产品方案管理 | 报告详情 | `/reports/:id` | AI/模板报告切换、分享、导出 PDF |
| 系统设置 | 用户管理 | `/settings/users` | 用户 CRUD、启停、重置密码 |
| 系统设置 | 角色管理 | `/settings/roles` | 角色 CRUD、权限矩阵 |
| 系统设置 | 售前配置 | `/settings/pre-sales` | 售前人员区域/行业分配 |
| 系统设置 | 字典管理 | `/settings/dictionaries` | 字典类型/项与区域维护 |
| 系统设置 | 消息中心 | `/settings/messages` | 已读/全部已读 |
| 系统设置 | 日志管理 | `/settings/logs` | 日志查询与筛选 |

## 3. 权限边界

| 用户类型 | 可访问范围 |
| --- | --- |
| 内部用户 | 全部受保护路由 |
| 外部用户 | `/customer-survey/list`、`/surveys/fill/:id`、`/authorized/surveys/fill/:id` |

## 4. 技术栈

| 分类 | 技术 |
| --- | --- |
| 前端框架 | React `^19.2.4`, React DOM `^19.2.4` |
| 路由 | React Router DOM `^7.13.0`（HashRouter） |
| 构建工具 | Vite `^6.2.0`, TypeScript `~5.8.2` |
| 数据服务 | Supabase JS `^2.97.0` |
| 图表 | Recharts `^3.7.0` |
| 报表导入导出 | `xlsx ^0.18.5`, `exceljs ^4.4.0`, `jspdf ^4.2.0`, `html2canvas ^1.4.1` |
| AI | `@google/genai ^1.40.0` |

## 5. 开发与构建

| 场景 | 命令 |
| --- | --- |
| 安装依赖 | `npm install` |
| 本地开发 | `npm run dev` |
| 代码校验 | `npm run lint` |
| 生产构建 | `npm run build` |
| 构建预览 | `npm run preview` |

默认开发地址：`http://localhost:5173`

## 6. 环境变量

| 变量名 | 必填 | 说明 |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | 是 | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | 是 | Supabase 匿名密钥 |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | 否 | 高权限 Key（仅受控环境建议使用） |
| `GEMINI_API_KEY` | 否 | AI 报告生成 Key；未配置时自动回退兜底报告 |

建议写入 `.env.local`：

```env
VITE_SUPABASE_URL="https://<your-project>.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-anon-key>"
VITE_SUPABASE_SERVICE_ROLE_KEY="<optional>"
GEMINI_API_KEY="<optional>"
```

## 7. 数据库初始化

| 场景 | SQL 脚本 |
| --- | --- |
| 新环境初始化 | `supabase-init.sql` |
| 旧环境修复/兼容升级 | `supabase-repair-existing.sql` |

## 8. 文档目录

| 文档 | 路径 | 说明 |
| --- | --- | --- |
| 需求开发文档 | [需求开发文档.md](./需求开发文档.md) | 功能需求与设计 |
| 服务接口 | [api-design.md](./api-design.md) | 前端 Service 接口 |
| 数据库设计 | [database-design.md](./database-design.md) | 表结构、约束、RLS |
| 技术方案 | [backend-tech-doc.md](./backend-tech-doc.md) | 技术实现说明 |
| Supabase 配置 | [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Supabase 接入流程 |
| Cloudflare 部署指南 | [CLOUDFLARE_DEPLOY_GUIDE.md](./CLOUDFLARE_DEPLOY_GUIDE.md) | 部署详版 |
| 用户操作手册 | [用户操作手册.md](./用户操作手册.md) | 使用说明 |
| 系统运维手册 | [系统运维手册.md](./系统运维手册.md) | 运维流程 |
