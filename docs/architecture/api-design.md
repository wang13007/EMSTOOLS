# 服务接口设计（前端 Service Layer）

更新时间：2026-03-11

## 1. 说明

| 项目 | 内容 |
| --- | --- |
| 接口形态 | 前端 TypeScript Service（非 HTTP REST） |
| 数据访问 | `src/services/supabaseService.ts` 直连 Supabase |
| 认证服务 | `src/services/authService.ts` |
| 报告服务 | `services/geminiService.ts`、`services/reportService.ts` |

## 2. 认证接口（`src/services/authService.ts`）

| 方法 | 入参 | 出参 | 核心行为 | 依赖 |
| --- | --- | --- | --- | --- |
| `login(data, options?)` | `username`, `password`, `autoCreateExternalIfNotExists?` | `{ user, token }` | 查用户、校验密码、可选自动创建外部用户、更新 `last_login_time`、写入 `ems_user/ems_token` | `userService`, `roleService` |
| `register(data)` | `name`, `username`, `phone`, `email`, `password`, `confirm_password` | `{ user, token }` | 校验注册信息、创建外部用户、自动登录态落地 | `userService`, `roleService` |
| `logout()` | 无 | `{ success: boolean }` | 清理本地登录态 | `localStorage` |
| `getCurrentUser()` | 无 | `UserInfo \| null` | 读取本地用户会话 | `localStorage` |
| `isLoggedIn()` | 无 | `boolean` | 判断 `ems_token` 是否存在 | `localStorage` |

## 3. Supabase 服务接口（`src/services/supabaseService.ts`）

### 3.1 用户与角色

| Service | 方法 | 入参 | 返回 | 读写表 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `userService` | `getUsers()` | 无 | `User[]` | `users` | 查询用户并做字段兼容与规范化 |
| `userService` | `getRoles()` | 无 | `Role[]` | `roles` | 代理角色查询 |
| `userService` | `validateUserRoles(userId, userType, roleIds)` | 用户ID、用户类型、角色ID数组 | `boolean` | `roles` | 校验用户类型与角色类型一致 |
| `userService` | `createUser(payload)` | 用户对象 | `User \| Error` | `users` | 自动兼容 `type/user_type` 与缺失字段重试 |
| `userService` | `updateUser(id, payload)` | 用户ID、更新对象 | `User \| null` | `users` | 兼容按 `user_id` 或 `id` 更新 |
| `userService` | `deleteUser(id)` | 用户ID | `boolean` | `users` | 兼容双字段删除 |
| `roleService` | `getRoles()` | 无 | `Role[]` | `roles` | 查询角色并推断类型 |
| `roleService` | `createRole(payload)` | 角色对象 | `Role \| null` | `roles` | 新建角色 |
| `roleService` | `updateRole(id, payload)` | 角色ID、更新对象 | `Role \| null` | `roles` | 更新角色 |
| `roleService` | `deleteRole(id)` | 角色ID | `boolean` | `roles` | 预置角色删除保护 |

### 3.2 调研服务

| Service | 方法 | 入参 | 返回 | 读写表 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `surveyService` | `getSurveys()` | 无 | `Survey[]` | `survey_forms` | 内部查全部；外部按可访问规则过滤 |
| `surveyService` | `getSurveyById(id)` | 调研ID | `Survey \| null` | `survey_forms` | 外部用户会做访问校验 |
| `surveyService` | `grantExternalAccessByAuthorizedLink(id)` | 调研ID | `Survey \| null` | `survey_forms` | 授权链接场景绑定外部用户ID |
| `surveyService` | `createSurvey(payload)` | 调研对象 | `Survey \| null` | `survey_forms` | 状态与字段映射、外键用户ID解析 |
| `surveyService` | `updateSurvey(id, payload)` | 调研ID、更新对象 | `Survey \| null` | `survey_forms` | 兼容状态值、字段别名、外部用户限制 |
| `surveyService` | `deleteSurvey(id)` | 调研ID | `boolean` | `survey_forms` | 删除调研 |

### 3.3 模板、字典、日志、消息

| Service | 方法 | 入参 | 返回 | 读写表 | 说明 |
| --- | --- | --- | --- | --- | --- |
| `templateService` | `getTemplates()` | 无 | `SurveyTemplate[]` | `survey_templates` | 调研模板列表 |
| `templateService` | `createTemplate(payload)` | 模板对象 | `SurveyTemplate \| null` | `survey_templates` | 新建调研模板 |
| `dictService` | `getDictTypes()` | 无 | `DictType[]` | `dict_types` | 字典类型列表 |
| `dictService` | `getDictItems(typeId)` | 类型ID | `DictItem[]` | `dict_items` | 字典项列表 |
| `logService` | `createLog(payload)` | 日志对象 | `SystemLog \| null` | `system_logs` | 写入日志 |
| `logService` | `getLogs()` | 无 | `SystemLog[]` | `system_logs` | 按时间倒序读取日志 |
| `messageService` | `getMessages(userId, options?)` | 用户ID、角色ID集合等 | `Message[]` | `messages` | 用户消息 + 角色消息 + 广播消息合并 |
| `messageService` | `getCurrentUserMessages(limit?)` | 可选条数 | `Message[]` | `messages` | 当前登录用户消息 |
| `messageService` | `getCurrentUserUnreadCount()` | 无 | `number` | `messages` | 未读统计 |
| `messageService` | `markAsRead(id)` | 消息ID | `Message \| null` | `messages` | 标记已读 |

## 4. 报告服务接口

### 4.1 AI 报告服务（`services/geminiService.ts`）

| 方法 | 入参 | 出参 | 说明 |
| --- | --- | --- | --- |
| `generateEnergyReport(surveyForm)` | `SurveyForm` | `ReportResult` | 优先调用 Gemini；失败或无 Key 时返回兜底报告 |

`ReportResult` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `efficiencyScore` | `number` | 能效评分 |
| `summary` | `string` | 总结 |
| `energyStructureAnalysis` | `string` | 能源结构分析 |
| `savingPotential` | `string` | 节能潜力 |
| `keyGaps` | `string[]` | 关键差距 |
| `recommendedModules` | `string[]` | 推荐模块 |
| `hardwareRecommendations` | `string[]` | 硬件建议 |
| `softwareRecommendations` | `string[]` | 软件建议 |
| `consultingRecommendations` | `string[]` | 咨询建议 |
| `estimatedCostRange` | `string` | 预算区间 |
| `roiAnalysis` | `string` | ROI 分析 |
| `nextSteps` | `string[]` | 下一步行动 |

### 4.2 模板报告服务（`services/reportService.ts`）

| 方法 | 入参 | 出参 | 说明 |
| --- | --- | --- | --- |
| `generateTemplateReport(surveyForm, aiReport?, capabilityMatches?)` | 调研表单 + 可选 AI 结果 | `TemplateReportResult` | 渲染模板正文、生成章节与图表 |
| `buildReportBundle(surveyForm, aiReport, preSalesContact)` | 调研表单 + AI 结果 + 售前联系人 | `ReportBundle` | 组装报告完整包并补充能力匹配 |

`ReportBundle` 结构：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `surveyId` | `string` | 调研ID |
| `generatedAt` | `string` | 生成时间 |
| `aiReport` | `ReportResult` | AI 报告 |
| `templateReport` | `TemplateReportResult` | 模板报告 |
| `capabilityMatches` | `ProductCapabilityMatch[]` | 能力匹配结果 |
| `preSalesContact` | `PreSalesContactInfo` | 售前联系人信息 |

## 5. 错误处理约定

| 场景 | 处理方式 |
| --- | --- |
| Supabase 查询/写入失败 | `console.error` + 返回空数组/`null`/`false` |
| 登录/注册失败 | 抛出 `Error(message)`，页面层提示 |
| AI 调用失败 | 返回兜底报告，不阻断提交流程 |
| 外部用户越权 | 服务层返回空结果并阻止写操作 |

## 6. 兼容策略

| 兼容项 | 实现方式 |
| --- | --- |
| 用户主键差异 | 同时兼容 `id` 与 `user_id` |
| 用户类型字段差异 | 同时兼容 `type` 与 `user_type` |
| 调研状态值差异 | 中英文状态映射（`draft/in_progress/completed` 与中文） |
| 报告状态值差异 | 中英文状态映射（`pending/generated` 与中文） |
| 库字段缺失 | 识别缺失字段后自动剔除重试 |
