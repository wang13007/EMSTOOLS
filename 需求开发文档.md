# EMS 售前调研工具 PRD（实现对齐版）

更新时间：2026-03-11
版本基线：`master` 分支

## 1. 产品定位

EMS 售前调研工具用于标准化售前调研、结构化沉淀客户信息、自动生成可交付报告，提升售前效率并降低沟通成本。

## 2. 用户与权限

### 2.1 用户角色
- 内部用户：管理员、售前工程师等。
- 外部用户：客户用户。

### 2.2 访问控制
- 未登录访问受保护路由时，跳转 `/login?redirect=...`。
- 外部用户仅允许：
  - `/customer-survey/list`
  - `/surveys/fill/:id`
  - `/authorized/surveys/fill/:id`
- 外部用户访问其他路由，重定向到 `/customer-survey/list`。

## 3. 功能需求详细设计

说明：当前实现无独立后端网关，接口层为前端 Service 对 Supabase 的封装调用。

### FR-01 登录与注册

#### 页面描述
- 登录页：`/login`
- 注册页：`/register`（外部用户）

#### 交互描述
- 登录输入用户名、密码后提交。
- 注册输入姓名、用户名、手机号、邮箱、密码、确认密码。
- 登录后根据 `redirect` 参数回跳目标页，否则进入 `/`。

#### 业务规则
- 登录失败条件：用户不存在、密码不匹配、状态异常。
- 授权链接场景支持“自动创建外部用户”（可选）。
- 注册仅创建外部用户，需绑定外部角色。
- 登录成功写入 `ems_user`、`ems_token`，并更新最近登录时间。

#### 表结构设计
| 数据表 | 主键 | 关键字段 | 说明 |
| --- | --- | --- | --- |
| `users` | `id` | `user_id`, `username`, `user_name`, `name`, `password_hash`, `type`, `user_type`, `role_id`, `role_ids`, `status`, `last_login_time` | 账号主体、登录校验、用户类型与角色关系 |
| `roles` | `id` | `name`, `permissions`, `type`, `user_type`, `status` | 角色定义与权限承载 |

#### 接口设计
- `authService.login(data, options?)`
  - 入参：`username/password`，可选 `autoCreateExternalIfNotExists`
  - 出参：`{ user, token }`
- `authService.register(data)`
  - 入参：注册信息
  - 出参：`{ user, token }`
- `authService.logout()`、`authService.getCurrentUser()`

### FR-02 调研列表管理

#### 页面描述
- 页面路径：`/customer-survey/list`
- 列表字段：表单名称、项目名称、客户名称（内部）、创建人、提交人、状态、报告、创建时间、提交时间。

#### 交互描述
- 关键字搜索（表单名/项目/客户）。
- 状态筛选（草稿/填写中/已完成）。
- 创建时间/提交时间排序。
- 行操作：进入填写、查看报告、重填、删除。

#### 业务规则
- 外部用户列表仅显示本人可访问表单。
- “重填”将状态回退到草稿并清空报告生成状态。
- “删除”执行物理删除。

#### 表结构设计
| 数据表 | 主键 | 关键字段 | 说明 |
| --- | --- | --- | --- |
| `survey_forms` | `id` | `name`, `customer_name`, `project_name`, `industry`, `region`, `status`, `report_status`, `creator_id`, `submitter_id`, `pre_sales_responsible_id`, `data`, `create_time`, `update_time` | 调研列表主数据源 |
| `users` | `id` | `id`, `user_id`, `user_name`, `name`, `username` | 用于创建人/提交人/负责人姓名映射 |

#### 接口设计
- `surveyService.getSurveys()`
- `surveyService.updateSurvey(id, payload)`（重填）
- `surveyService.deleteSurvey(id)`
- `userService.getUsers()`（姓名映射）

### FR-03 新建调研

#### 页面描述
- 页面路径：`/surveys/new`
- 支持两种模式：直接创建、生成外部填写链接。

#### 交互描述
- 填写基础信息：表单名、客户、项目、行业、区域、售前负责人、模板。
- 模式为“外链”时，创建后展示并支持复制授权 URL。

#### 业务规则
- 当前登录用户 ID、售前负责人 ID 必须是合法 UUID。
- 售前负责人从“售前工程师角色用户”中筛选。
- 创建时预写模板初始字段到 `data`。
- 外链模式写入 `data.external_link_enabled=true`。

#### 表结构设计
| 数据表/存储 | 主键/Key | 字段 | 说明 |
| --- | --- | --- | --- |
| `survey_forms` | `id` | `name`, `customer_name`, `project_name`, `industry`, `region`, `template_id`, `status`, `report_status`, `creator_id`, `submitter_id`, `pre_sales_responsible_id`, `data` | 新建调研核心落库表 |
| `localStorage` | `ems_last_created_survey_id` | `surveyId` | 创建成功后的本地回填 ID |

#### 接口设计
- `roleService.getRoles()`、`userService.getUsers()`（负责人候选）
- `surveyService.createSurvey(payload)`
- 失败兜底：创建后再次调用 `surveyService.getSurveys()`反查最新记录

### FR-04 调研填写与自动保存

#### 页面描述
- 页面路径：`/surveys/fill/:id`、`/authorized/surveys/fill/:id`
- 按模板动态渲染分组字段与可见性规则。

#### 交互描述
- 字段类型支持：文本、数字、单选、多选、文本域。
- “保存草稿”手动保存。
- 自动保存：输入后约 1200ms 触发。
- 返回列表前自动尝试保存。

#### 业务规则
- 已完成表单只读。
- 授权链接访问时，若外部用户尚未授权，会自动尝试绑定。
- 预填字段（客户、项目、区域、行业等）只读不可改。
- 保存时更新 `submitter_id`、`status`、`data`。

#### 表结构设计
| 数据表/存储 | 主键/Key | 字段 | 说明 |
| --- | --- | --- | --- |
| `survey_forms` | `id` | 读取：`id`；更新：`data`, `status`, `report_status`, `submitter_id`, `update_time` | 填写态与草稿持久化 |
| `survey_forms.data` | JSONB 子字段 | `external_link_enabled`, `external_access_user_ids` | 授权外链访问控制 |
| `localStorage` | `ems_surveys` | `SurveyForm[]` | 前端本地缓存与详情回显 |

#### 接口设计
- `surveyService.getSurveyById(id)`
- `surveyService.grantExternalAccessByAuthorizedLink(id)`
- `surveyService.updateSurvey(id, payload)`
- `userService.getUsers()`（售前联系人补充）

### FR-05 提交并生成报告

#### 页面描述
- 入口：填写页顶部“提交并生成报告”。
- 成功后跳转报告详情页。

#### 交互描述
- 点击提交后展示“AI 分析中”状态。
- 自动先做未保存草稿提交。
- 失败弹窗提示。

#### 业务规则
- 若草稿自动保存失败，阻止提交并提示先保存。
- 提交后写入：`status=completed`、`report_status=generated`、`data.submit_time`。
- AI 报告优先 Gemini，未配置 Key 时使用回退报告。

#### 表结构设计
| 数据表/存储 | 主键/Key | 字段 | 说明 |
| --- | --- | --- | --- |
| `survey_forms` | `id` | `status`, `report_status`, `data.submit_time`, `submitter_id` | 提交状态与提交时间落库 |
| `localStorage` | `ems_reports` | `{ [surveyId]: ReportBundle }` | 报告包缓存（AI + 模板 + 匹配 + 联系人） |

#### 接口设计
- `generateEnergyReport(form)`
- `buildReportBundle(form, aiReport, preSalesContact)`
- `surveyService.updateSurvey(id, payload)`

### FR-06 报告详情

#### 页面描述
- 页面路径：`/reports/:id`
- 报告类型切换：AI 诊断报告 / 模板报告。
- 支持分享链接、导出 PDF。

#### 交互描述
- 页面加载时读取本地报告包。
- 若数据结构不完整，自动重建报告并回写。
- 点击“链接分享”复制 URL。
- 点击“导出PDF”导出当前视图内容。

#### 业务规则
- 找不到调研或报告时，分别跳转列表或填写页。
- 联系人信息不足时自动补查用户表并补全。
- 导出文件名按“项目名 + 报告类型”生成。

#### 表结构设计
| 数据表/存储 | 主键/Key | 字段 | 说明 |
| --- | --- | --- | --- |
| `localStorage` | `ems_surveys` | `SurveyForm[]` | 报告详情页加载调研基础信息 |
| `localStorage` | `ems_reports` | `ReportBundle` | 报告正文与图表主来源 |
| `users` | `id` | `phone`, `email`, `name`, `username` | 售前联系人补齐信息 |

#### 接口设计
- `buildReportBundle(...)`（重建）
- `userService.getUsers()`（联系人补全）
- `html2canvas + jsPDF`（导出）

### FR-07 调研模板管理（查看）

#### 页面描述
- 页面路径：`/customer-survey/templates`
- 展示调研模板结构、章节、字段、可见条件。

#### 交互描述
- 可切换模板查看。
- 支持模板名称本地重命名（仅前端展示）。

#### 业务规则
- 模板当前为前端预置，不通过数据库维护。
- 名称覆盖不影响原始模板定义。

#### 表结构设计
| 数据表/存储 | 主键/Key | 字段 | 说明 |
| --- | --- | --- | --- |
| `localStorage` | `ems_survey_template_name_overrides` | `{ [templateId]: name }` | 调研模板名称覆盖映射 |

#### 接口设计
- `applySurveyTemplateNameOverrides(templates)`
- `setSurveyTemplateNameById(id, name)`

### FR-08 报告模板管理（查看）

#### 页面描述
- 页面路径：`/product-solution/report-templates`
- 展示模板正文（富文本分段）与图表，不展示占位符映射。

#### 交互描述
- 支持模板名称、描述本地覆盖。

#### 业务规则
- 报告模板同样为前端预置资源。
- 覆盖仅影响当前浏览器显示。

#### 表结构设计
| 数据表/存储 | 主键/Key | 字段 | 说明 |
| --- | --- | --- | --- |
| `localStorage` | `ems_report_template_name_overrides` | `{ [templateId]: name }` | 报告模板名称覆盖映射 |
| `localStorage` | `ems_report_template_description_overrides` | `{ [templateId]: description }` | 报告模板描述覆盖映射 |

#### 接口设计
- `applyReportTemplateNameOverrides(templates)`
- `setReportTemplateNameById(id, name)`
- `setReportTemplateDescriptionById(id, description)`

### FR-09 产品能力维护

#### 页面描述
- 页面路径：`/product-solution/capabilities`
- 支持行内编辑、批量删除、Excel 导入导出。

#### 交互描述
- 新增能力行后直接编辑。
- 多选行后可批量删除。
- 导出生成带下拉校验模板的 Excel。
- 导入后弹窗确认“全量覆盖”。

#### 业务规则
- 导入校验：
  - 能力名称必填
  - 类型限定：软件/硬件/咨询/改造施工
  - 行业/场景必须命中字典选项
  - ID 不能重复
- 导入确认后全量替换能力列表。

#### 表结构设计
| 数据表/存储 | 主键/Key | 字段 | 说明 |
| --- | --- | --- | --- |
| `localStorage` | `ems_product_capabilities` | `id`, `name`, `type`, `industries[]`, `scenarios[]`, `description`, `createTime` | 产品能力主存储 |
| `dict_types` | `type_id` | `type_code`, `type_name`, `status` | 能力类型/行业/场景字典类型 |
| `dict_items` | `item_id` | `type_id`, `item_label`, `item_value`, `status` | 行业/场景/类型下拉值来源 |

#### 接口设计
- `getProductCapabilities()` / `saveProductCapabilities(capabilities)`
- `dictService.getDictTypes()`
- `dictService.getDictItems(typeId)`

### FR-10 用户管理

#### 页面描述
- 页面路径：`/settings/users`
- 功能：新增、编辑、启停、重置密码、删除。

#### 交互描述
- 弹窗编辑用户基础信息。
- 角色支持多选并做实时校验。
- 支持状态切换和确认类弹窗操作。

#### 业务规则
- 内部用户仅可选内部角色，外部用户仅可选外部角色。
- 新增用户默认密码可设置，重置密码为 `1234`。
- 状态切换：`enabled/disabled`。

#### 表结构设计
| 数据表 | 主键 | 关键字段 | 说明 |
| --- | --- | --- | --- |
| `users` | `id` | `username`, `user_name`, `name`, `password_hash`, `type`, `user_type`, `role_id`, `role_ids`, `status`, `phone`, `email` | 用户维护主表 |
| `roles` | `id` | `name`, `type`, `user_type`, `status` | 用户角色候选与类型校验依据 |

#### 接口设计
- `userService.getUsers()`
- `userService.createUser(payload)`
- `userService.updateUser(id, payload)`
- `userService.deleteUser(id)`
- `userService.validateUserRoles(userId, userType, roleIds)`
- `roleService.getRoles()`

### FR-11 角色管理

#### 页面描述
- 页面路径：`/settings/roles`
- 功能：角色增删改、权限矩阵维护。

#### 交互描述
- 新增/编辑角色基本信息。
- 按模块勾选权限动作，实时展示权限摘要。

#### 业务规则
- 预置角色不可删除（超级管理员、售前工程师、外部客户）。
- 角色类型限定：`internal/external`。

#### 表结构设计
| 数据表 | 主键 | 字段 | 说明 |
| --- | --- | --- | --- |
| `roles` | `id` | `name`, `description`, `permissions(JSONB)`, `type`, `user_type`, `status`, `create_time`, `update_time` | 角色定义与权限矩阵存储 |

#### 接口设计
- `roleService.getRoles()`
- `roleService.createRole(payload)`
- `roleService.updateRole(id, payload)`
- `roleService.deleteRole(id)`

### FR-12 字典管理

#### 页面描述
- 页面路径：`/settings/dictionaries`
- 管理对象：字典类型、字典项、区域字典。

#### 交互描述
- 左侧选择字典类型，右侧编辑数据项。
- 区域类型切换为区域树维护视图。
- 支持导出 JSON。

#### 业务规则
- 系统确保关键类型（行业/场景/能力）存在。
- 预置受保护类型不可删除。
- 加载策略：数据库优先，本地缓存回退。

#### 表结构设计
| 数据表/存储 | 主键/Key | 字段 | 说明 |
| --- | --- | --- | --- |
| `dict_types` | `type_id` | `type_name`, `type_code`, `description`, `status`, `sort_order`, `create_time`, `creator_id` | 字典类型定义 |
| `dict_items` | `item_id` | `type_id`, `item_label`, `item_value`, `sort_order`, `status`, `ext1`, `ext2`, `create_time`, `creator_id` | 字典项数据 |
| `region_dicts` | `region_id` | `region_name`, `region_code`, `parent_id`, `region_level`, `sort_order`, `status`, `is_system`, `create_time` | 区域层级字典 |
| `localStorage` | `ems_dict_types`, `ems_dict_items`, `ems_regions` | 本地缓存快照 | 数据源回退与页面本地维护 |

#### 接口设计
- `dictService.getDictTypes()`
- `dictService.getDictItems(typeId)`
- 页面本地 CRUD（字典项/区域）

### FR-13 售前配置

#### 页面描述
- 页面路径：`/settings/pre-sales`
- 管理“售前人员-区域-行业”分配关系。

#### 交互描述
- 新增/编辑分配弹窗，支持区域和行业多选。
- 列表展示分配记录并支持删除。

#### 业务规则
- 数据当前保存在浏览器本地。
- 用户候选优先筛选“售前相关角色/名称”用户。
- 区域、行业选项来自字典与区域缓存。

#### 表结构设计
| 数据表/存储 | 主键/Key | 字段 | 说明 |
| --- | --- | --- | --- |
| `localStorage` | `ems_presales_assignments` | `id`, `userId`, `userName`, `regionIds[]`, `industryIds[]`, `createTime` | 售前分配关系主存储 |
| `localStorage` | `ems_users`, `ems_dict_types`, `ems_dict_items`, `ems_regions` | 用户/字典/区域缓存 | 选项数据来源 |

#### 接口设计
- 当前无服务端接口，使用本地存储读写。

### FR-14 消息中心

#### 页面描述
- 页面路径：`/settings/messages`
- 展示当前用户可见消息和未读状态。

#### 交互描述
- 单条已读。
- 全部已读。

#### 业务规则
- 消息来源为三类集合并去重：
  - 目标用户消息
  - 目标角色消息
  - 广播消息
- 已读后更新 `read=true`。

#### 表结构设计
| 数据表 | 主键 | 字段 | 说明 |
| --- | --- | --- | --- |
| `messages` | `id` | `title`, `content`, `type`, `read`, `cleared`, `target_role_id`, `target_user_id`, `project_id`, `create_time` | 消息中心数据来源 |

#### 接口设计
- `messageService.getCurrentUserMessages(limit?)`
- `messageService.getCurrentUserUnreadCount()`
- `messageService.markAsRead(id)`

### FR-15 日志管理

#### 页面描述
- 页面路径：`/settings/logs`
- 展示系统日志列表，支持按类型过滤。

#### 交互描述
- 默认按时间倒序加载。
- 筛选后前端即时刷新。

#### 业务规则
- 日志类型受约束：`login/survey/user/system`。
- 结果受约束：`成功/失败`。

#### 表结构设计
| 数据表 | 主键 | 字段 | 说明 |
| --- | --- | --- | --- |
| `system_logs` | `id` | `operator_id`, `type`, `content`, `ip_address`, `result`, `create_time` | 系统日志与审计追踪 |

#### 接口设计
- `logService.getLogs()`
- `logService.createLog(log)`

### FR-16 售前综合看板

#### 页面描述
- 页面路径：`/`（`/dashboard` 自动重定向）
- 展示调研量、状态占比、趋势与价值指标。

#### 交互描述
- 页面加载自动拉取调研列表并计算图表。

#### 业务规则
- 统计以 `survey_forms` 为主数据源。
- 部分价值可视化采用当前版本的前端计算模型（演示型）。

#### 表结构设计
| 数据表 | 主键 | 字段 | 说明 |
| --- | --- | --- | --- |
| `survey_forms` | `id` | `status`, `report_status`, `industry`, `region`, `create_time`, `update_time` | 看板统计指标来源 |

#### 接口设计
- `surveyService.getSurveys()`

## 4. 数据库总表设计（实现字段）

### 4.1 核心业务表
| 表名 | 主键 | 核心字段 | 用途 |
| --- | --- | --- | --- |
| `roles` | `id` | `name`, `permissions`, `type`, `user_type`, `status` | 角色与权限定义 |
| `users` | `id` | `user_id`, `username`, `password_hash`, `type`, `user_type`, `role_id`, `role_ids`, `status` | 用户账号与角色关联 |
| `survey_templates` | `id` | `name`, `industry`, `sections`, `create_time`, `update_time` | 调研模板存储 |
| `survey_forms` | `id` | `name`, `customer_name`, `project_name`, `industry`, `region`, `template_id`, `status`, `report_status`, `creator_id`, `submitter_id`, `pre_sales_responsible_id`, `data`, `create_time`, `update_time` | 调研表单主表 |
| `survey_reports` | `id` | `form_id`, `content`, `generate_time` | 报告文本落库（当前页面主用本地缓存） |
| `dict_types` | `type_id` | `type_name`, `type_code`, `status`, `sort_order` | 字典类型 |
| `dict_items` | `item_id` | `type_id`, `item_label`, `item_value`, `status`, `sort_order` | 字典项 |
| `region_dicts` | `region_id` | `region_name`, `region_code`, `parent_id`, `region_level`, `status` | 区域字典 |
| `product_capabilities` | `id` | `name`, `type`, `industries`, `scenarios`, `description` | 产品能力表（兼容表，当前前端主用本地） |
| `messages` | `id` | `title`, `content`, `type`, `read`, `target_role_id`, `target_user_id`, `create_time` | 消息中心 |
| `system_logs` | `id` | `operator_id`, `type`, `content`, `result`, `create_time` | 系统日志 |

### 4.2 关键约束
| 约束对象 | 约束内容 |
| --- | --- |
| 角色/用户状态 | `enabled` / `disabled` |
| 用户/角色类型 | `internal` / `external` |
| 调研状态 | `draft` / `in_progress` / `completed`（兼容中文） |
| 报告状态 | `pending` / `generated`（兼容中文） |
| 产品能力类型 | `software` / `hardware` / `consulting` / `retrofit_construction` |
| 消息类型 | `system` / `report` |
| 日志类型 | `login` / `survey` / `user` / `system` |

### 4.3 安全策略
| 项目 | 当前实现 |
| --- | --- |
| RLS 启用范围 | 主要业务表均已启用 RLS |
| 基础策略 | `auth.role() = 'authenticated'` |
| 待完善项 | 按角色与记录归属做更细粒度最小权限策略 |

## 5. 非功能与技术约束

- 前端框架：React + TypeScript。
- 数据服务：Supabase。
- 报告生成：Gemini API（缺省回退本地报告）。
- 当前无后端网关，部分业务状态存于 `localStorage`。

## 6. 已知限制与改进方向

1. 密码当前为前端明文比对，需迁移到标准认证体系。
2. AI 调用应迁移到服务端，避免前端密钥暴露风险。
3. 本地缓存占比较高（报告、模板覆盖、售前配置等），需逐步落库。
4. RLS 需按角色与记录归属做更细粒度策略。
