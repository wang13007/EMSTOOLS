# Supabase 数据库配置指南

## 1. 创建 Supabase 项目

1. **访问 Supabase 官网**
   - 打开浏览器，访问 [https://supabase.com](https://supabase.com)
   - 点击 "Start your project" 或 "Sign in" 登录您的账号

2. **创建新项目**
   - 登录后，点击 "New Project"
   - 填写项目名称（例如："EMS 售前调研工具"）
   - 选择一个数据库密码
   - 选择一个区域（建议选择离您最近的区域）
   - 点击 "Create Project"

3. **等待项目创建完成**
   - 项目创建需要一些时间，请耐心等待
   - 完成后，您将看到项目的仪表板页面

## 2. 获取项目配置信息

1. **进入项目设置**
   - 在项目仪表板中，点击左侧菜单的 "Settings"

2. **获取 API 配置**
   - 点击 "API" 选项卡
   - 复制以下信息：
     - **Project URL**: 例如 `https://your-project.supabase.co`
     - **Anon public**: 例如 `********************************************************************************************************************************************************************************************************`

## 3. 配置环境变量

1. **编辑 .env.local 文件**
   - 打开项目根目录下的 `.env.local` 文件
   - 将以下值替换为您从 Supabase 获取的配置：
     ```
     # Supabase连接信息
     VITE_SUPABASE_URL="您的Project URL"
     VITE_SUPABASE_ANON_KEY="您的Anon public"
     ```

2. **保存文件**
   - 保存 `.env.local` 文件的更改

## 4. 创建数据库表

1. **进入 SQL 编辑器**
   - 在 Supabase 仪表板中，点击左侧菜单的 "SQL Editor"

2. **运行数据库初始化脚本**
   - 复制并粘贴 `database-design.md` 文件中的 SQL 脚本到编辑器
   - 点击 "Run"
   - 等待脚本执行完成

3. **验证表结构**
   - 点击左侧菜单的 "Database"
   - 确认所有表都已创建成功

## 5. 配置 Row Level Security (RLS)

1. **启用 RLS**
   - 在 "Database" 页面中，选择每个表
   - 点击 "Edit" 按钮
   - 启用 "Row Level Security"
   - 点击 "Save"

2. **创建 RLS 策略**
   - 对于每个表，创建适当的 RLS 策略
   - 例如，对于 `users` 表：
     ```sql
     CREATE POLICY "Users can view their own data" ON users
       FOR SELECT USING (auth.uid() = id);
     
     CREATE POLICY "Users can update their own data" ON users
       FOR UPDATE USING (auth.uid() = id);
     ```

## 6. 测试连接

1. **重启开发服务器**
   - 在终端中，按 `Ctrl+C` 停止当前服务
   - 重新启动服务：
     ```bash
     npm run dev
     ```

2. **访问项目**
   - 在浏览器中访问 `http://localhost:3005`
   - 尝试创建一个新的调研表单
   - 检查数据是否正确存储到 Supabase 数据库

## 7. Supabase 服务使用指南

### 7.1 导入 Supabase 服务

```typescript
import { userService, surveyService, templateService, dictService, logService, messageService } from './services/supabaseService';
```

### 7.2 示例：获取用户列表

```typescript
const users = await userService.getUsers();
console.log('用户列表:', users);
```

### 7.3 示例：创建调研表单

```typescript
const survey = await surveyService.createSurvey({
  name: '测试调研',
  customer_name: '测试客户',
  project_name: '测试项目',
  industry: '制造业',
  region: '北京市',
  template_id: 'template-1',
  status: '草稿',
  report_status: '未生成',
  creator_id: 'user-1',
  data: {}
});
console.log('创建的表单:', survey);
```

### 7.4 示例：更新调研表单

```typescript
const updatedSurvey = await surveyService.updateSurvey('survey-1', {
  status: '已完成',
  report_status: '已生成',
  data: {
    company_name: '测试公司',
    company_size: '大型'
  }
});
console.log('更新后的表单:', updatedSurvey);
```

## 8. 常见问题排查

### 8.1 连接失败
- **检查环境变量**：确保 `.env.local` 文件中的配置正确
- **检查网络连接**：确保您可以访问 Supabase 的 API 地址
- **检查项目状态**：确保 Supabase 项目处于活跃状态

### 8.2 权限错误
- **检查 RLS 配置**：确保已正确配置 Row Level Security
- **检查 API 密钥**：确保使用的是正确的 Anon public 密钥

### 8.3 数据不保存
- **检查表结构**：确保数据库表结构与代码中的模型匹配
- **检查字段名称**：确保代码中使用的字段名称与数据库中的字段名称一致
- **检查 RLS 策略**：确保 RLS 策略允许写入操作

## 9. 监控与维护

1. **查看 Supabase 仪表板**
   - 定期查看项目的使用情况和性能指标

2. **监控 API 调用**
   - 在 "API" 页面中，查看 API 调用统计

3. **备份数据**
   - 在 "Database" 页面中，设置定期备份

4. **扩展计划**
   - 根据项目的使用情况，考虑升级 Supabase 计划

## 10. 注意事项

- **安全**：不要在代码中硬编码 Supabase 的 API 密钥
- **性能**：对于大型查询，考虑使用索引和优化查询
- **成本**：注意 Supabase 的使用限制，避免超出免费额度
- **备份**：定期备份重要数据

---

通过以上步骤，您应该已经成功配置了 Supabase 数据库，并且可以开始使用它来存储和管理项目数据。如果遇到任何问题，请参考 Supabase 的官方文档或联系 Supabase 支持。
