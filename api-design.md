# EMS 售前调研工具 - API 设计

## 1. 认证接口

### 1.1 登录
- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "username": "admin",
    "password": "password123"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "uuid",
        "name": "系统管理员",
        "username": "admin",
        "type": "internal",
        "role": "超级管理员",
        "status": "enabled"
      }
    }
  }
  ```

### 1.2 登出
- **URL**: `/api/auth/logout`
- **方法**: `POST`
- **成功响应**:
  ```json
  {
    "success": true,
    "message": "登出成功"
  }
  ```

### 1.3 刷新令牌
- **URL**: `/api/auth/refresh`
- **方法**: `POST`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

## 2. 用户管理接口

### 2.1 获取用户列表
- **URL**: `/api/users`
- **方法**: `GET`
- **查询参数**:
  - `page`: 页码 (默认 1)
  - `limit`: 每页数量 (默认 20)
  - `search`: 搜索关键词
  - `type`: 用户类型过滤
  - `status`: 状态过滤
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "users": [
        {
          "id": "uuid",
          "name": "系统管理员",
          "username": "admin",
          "type": "internal",
          "role": "超级管理员",
          "customer": null,
          "status": "enabled",
          "create_time": "2024-01-01T00:00:00Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 20
    }
  }
  ```

### 2.2 创建用户
- **URL**: `/api/users`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "name": "张三",
    "username": "zhangsan",
    "password": "password123",
    "type": "internal",
    "role_id": "uuid",
    "customer": null,
    "status": "enabled"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "name": "张三",
      "username": "zhangsan",
      "type": "internal",
      "role": "售前工程师",
      "customer": null,
      "status": "enabled",
      "create_time": "2024-01-01T00:00:00Z"
    }
  }
  ```

### 2.3 更新用户
- **URL**: `/api/users/{id}`
- **方法**: `PUT`
- **请求体**:
  ```json
  {
    "name": "张三",
    "username": "zhangsan",
    "type": "internal",
    "role_id": "uuid",
    "customer": null,
    "status": "enabled"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "name": "张三",
      "username": "zhangsan",
      "type": "internal",
      "role": "售前工程师",
      "customer": null,
      "status": "enabled",
      "create_time": "2024-01-01T00:00:00Z"
    }
  }
  ```

### 2.4 删除用户
- **URL**: `/api/users/{id}`
- **方法**: `DELETE`
- **成功响应**:
  ```json
  {
    "success": true,
    "message": "用户删除成功"
  }
  ```

### 2.5 切换用户状态
- **URL**: `/api/users/{id}/status`
- **方法**: `PATCH`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "status": "disabled"
    }
  }
  ```

## 3. 角色管理接口

### 3.1 获取角色列表
- **URL**: `/api/roles`
- **方法**: `GET`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "超级管理员",
        "description": "系统最高权限",
        "permissions": {
          "users": true,
          "roles": true,
          "surveys": true
        },
        "status": "enabled",
        "create_time": "2024-01-01T00:00:00Z"
      }
    ]
  }
  ```

### 3.2 创建角色
- **URL**: `/api/roles`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "name": "新角色",
    "description": "角色描述",
    "permissions": {
      "users": false,
      "surveys": true
    },
    "status": "enabled"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "name": "新角色",
      "description": "角色描述",
      "permissions": {
        "users": false,
        "surveys": true
      },
      "status": "enabled",
      "create_time": "2024-01-01T00:00:00Z"
    }
  }
  ```

### 3.3 更新角色
- **URL**: `/api/roles/{id}`
- **方法**: `PUT`
- **请求体**:
  ```json
  {
    "name": "更新角色",
    "description": "更新描述",
    "permissions": {
      "users": true,
      "surveys": true
    },
    "status": "enabled"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "name": "更新角色",
      "description": "更新描述",
      "permissions": {
        "users": true,
        "surveys": true
      },
      "status": "enabled",
      "create_time": "2024-01-01T00:00:00Z"
    }
  }
  ```

### 3.4 删除角色
- **URL**: `/api/roles/{id}`
- **方法**: `DELETE`
- **成功响应**:
  ```json
  {
    "success": true,
    "message": "角色删除成功"
  }
  ```

## 4. 调研表单接口

### 4.1 获取表单列表
- **URL**: `/api/surveys`
- **方法**: `GET`
- **查询参数**:
  - `page`: 页码 (默认 1)
  - `limit`: 每页数量 (默认 20)
  - `search`: 搜索关键词
  - `status`: 状态过滤
  - `industry`: 行业过滤
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "surveys": [
        {
          "id": "uuid",
          "name": "2024Q1 某工厂能效调研",
          "customer_name": "某制造有限公司",
          "project_name": "工厂能效优化项目",
          "industry": "制造业",
          "region": "北京市",
          "template_id": "uuid",
          "status": "已完成",
          "report_status": "已生成",
          "creator": "系统管理员",
          "submitter": "张三",
          "pre_sales_responsible": "李四",
          "create_time": "2024-01-01T00:00:00Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 20
    }
  }
  ```

### 4.2 创建表单
- **URL**: `/api/surveys`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "name": "2024Q1 某工厂能效调研",
    "customer_name": "某制造有限公司",
    "project_name": "工厂能效优化项目",
    "industry": "制造业",
    "region": "北京市",
    "template_id": "uuid",
    "pre_sales_responsible_id": "uuid"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "name": "2024Q1 某工厂能效调研",
      "customer_name": "某制造有限公司",
      "project_name": "工厂能效优化项目",
      "industry": "制造业",
      "region": "北京市",
      "template_id": "uuid",
      "status": "草稿",
      "report_status": "未生成",
      "creator": "系统管理员",
      "pre_sales_responsible": "李四",
      "create_time": "2024-01-01T00:00:00Z",
      "data": {}
    }
  }
  ```

### 4.3 获取表单详情
- **URL**: `/api/surveys/{id}`
- **方法**: `GET`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "name": "2024Q1 某工厂能效调研",
      "customer_name": "某制造有限公司",
      "project_name": "工厂能效优化项目",
      "industry": "制造业",
      "region": "北京市",
      "template_id": "uuid",
      "status": "填写中",
      "report_status": "未生成",
      "creator": "系统管理员",
      "submitter": null,
      "pre_sales_responsible": "李四",
      "create_time": "2024-01-01T00:00:00Z",
      "data": {
        "company_name": "某制造有限公司",
        "company_size": "大型"
      }
    }
  }
  ```

### 4.4 更新表单数据
- **URL**: `/api/surveys/{id}`
- **方法**: `PUT`
- **请求体**:
  ```json
  {
    "data": {
      "company_name": "某制造有限公司",
      "company_size": "大型"
    },
    "status": "填写中"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "status": "填写中",
      "data": {
        "company_name": "某制造有限公司",
        "company_size": "大型"
      }
    }
  }
  ```

### 4.5 提交表单
- **URL**: `/api/surveys/{id}/submit`
- **方法**: `POST`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "status": "已完成",
      "report_status": "已生成",
      "submitter": "张三"
    }
  }
  ```

### 4.6 重填表单
- **URL**: `/api/surveys/{id}/refill`
- **方法**: `POST`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "status": "草稿",
      "report_status": "未生成"
    }
  }
  ```

### 4.7 删除表单
- **URL**: `/api/surveys/{id}`
- **方法**: `DELETE`
- **成功响应**:
  ```json
  {
    "success": true,
    "message": "表单删除成功"
  }
  ```

## 5. 模板管理接口

### 5.1 获取模板列表
- **URL**: `/api/templates`
- **方法**: `GET`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "name": "通用制造业调研模板",
        "industry": "制造业",
        "sections": [
          {
            "id": "section1",
            "title": "企业基本信息",
            "fields": [
              {
                "id": "company_name",
                "label": "企业名称",
                "type": "text",
                "required": true
              }
            ]
          }
        ],
        "create_time": "2024-01-01T00:00:00Z"
      }
    ]
  }
  ```

### 5.2 创建模板
- **URL**: `/api/templates`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "name": "新模板",
    "industry": "制造业",
    "sections": [
      {
        "id": "section1",
        "title": "企业基本信息",
        "fields": [
          {
            "id": "company_name",
            "label": "企业名称",
            "type": "text",
            "required": true
          }
        ]
      }
    ]
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "name": "新模板",
      "industry": "制造业",
      "sections": [
        {
          "id": "section1",
          "title": "企业基本信息",
          "fields": [
            {
              "id": "company_name",
              "label": "企业名称",
              "type": "text",
              "required": true
            }
          ]
        }
      ],
      "create_time": "2024-01-01T00:00:00Z"
    }
  }
  ```

### 5.3 更新模板
- **URL**: `/api/templates/{id}`
- **方法**: `PUT`
- **请求体**:
  ```json
  {
    "name": "更新模板",
    "industry": "制造业",
    "sections": [
      {
        "id": "section1",
        "title": "企业基本信息",
        "fields": [
          {
            "id": "company_name",
            "label": "企业名称",
            "type": "text",
            "required": true
          }
        ]
      }
    ]
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "name": "更新模板",
      "industry": "制造业",
      "sections": [
        {
          "id": "section1",
          "title": "企业基本信息",
          "fields": [
            {
              "id": "company_name",
              "label": "企业名称",
              "type": "text",
              "required": true
            }
          ]
        }
      ],
      "create_time": "2024-01-01T00:00:00Z"
    }
  }
  ```

### 5.4 删除模板
- **URL**: `/api/templates/{id}`
- **方法**: `DELETE`
- **成功响应**:
  ```json
  {
    "success": true,
    "message": "模板删除成功"
  }
  ```

## 6. 字典管理接口

### 6.1 获取字典类型列表
- **URL**: `/api/dictionaries/types`
- **方法**: `GET`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "type_id": "uuid",
        "type_name": "行业类型",
        "type_code": "industry",
        "description": "企业所属行业",
        "status": "enabled",
        "sort_order": 0,
        "create_time": "2024-01-01T00:00:00Z"
      }
    ]
  }
  ```

### 6.2 获取字典项列表
- **URL**: `/api/dictionaries/items`
- **方法**: `GET`
- **查询参数**:
  - `type_id`: 字典类型ID
- **成功响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "item_id": "uuid",
        "type_id": "uuid",
        "item_label": "制造业",
        "item_value": "manufacturing",
        "sort_order": 0,
        "status": "enabled",
        "create_time": "2024-01-01T00:00:00Z"
      }
    ]
  }
  ```

### 6.3 创建字典类型
- **URL**: `/api/dictionaries/types`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "type_name": "新字典类型",
    "type_code": "new_type",
    "description": "描述",
    "status": "enabled",
    "sort_order": 0
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "type_id": "uuid",
      "type_name": "新字典类型",
      "type_code": "new_type",
      "description": "描述",
      "status": "enabled",
      "sort_order": 0,
      "create_time": "2024-01-01T00:00:00Z"
    }
  }
  ```

### 6.4 创建字典项
- **URL**: `/api/dictionaries/items`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "type_id": "uuid",
    "item_label": "新字典项",
    "item_value": "new_value",
    "sort_order": 0,
    "status": "enabled"
  }
  ```
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "item_id": "uuid",
      "type_id": "uuid",
      "item_label": "新字典项",
      "item_value": "new_value",
      "sort_order": 0,
      "status": "enabled",
      "create_time": "2024-01-01T00:00:00Z"
    }
  }
  ```

## 7. 报告接口

### 7.1 获取报告
- **URL**: `/api/reports/{form_id}`
- **方法**: `GET`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "form_id": "uuid",
      "content": "报告内容...",
      "generate_time": "2024-01-01T00:00:00Z"
    }
  }
  ```

### 7.2 生成报告
- **URL**: `/api/reports/generate/{form_id}`
- **方法**: `POST`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "form_id": "uuid",
      "content": "报告内容...",
      "generate_time": "2024-01-01T00:00:00Z"
    }
  }
  ```

### 7.3 下载报告
- **URL**: `/api/reports/{form_id}/download`
- **方法**: `GET`
- **查询参数**:
  - `format`: `word` 或 `pdf`
- **成功响应**:
  - 文件下载

## 8. 系统接口

### 8.1 获取系统日志
- **URL**: `/api/logs`
- **方法**: `GET`
- **查询参数**:
  - `page`: 页码 (默认 1)
  - `limit`: 每页数量 (默认 20)
  - `type`: 日志类型
  - `start_time`: 开始时间
  - `end_time`: 结束时间
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "logs": [
        {
          "id": "uuid",
          "operator": "系统管理员",
          "type": "login",
          "content": "用户登录成功",
          "ip_address": "192.168.1.1",
          "result": "成功",
          "create_time": "2024-01-01T00:00:00Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 20
    }
  }
  ```

### 8.2 获取消息列表
- **URL**: `/api/messages`
- **方法**: `GET`
- **查询参数**:
  - `page`: 页码 (默认 1)
  - `limit`: 每页数量 (默认 20)
  - `read`: 是否已读
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "messages": [
        {
          "id": "uuid",
          "title": "报告生成成功",
          "content": "您的调研报告已生成成功",
          "type": "report",
          "read": false,
          "cleared": false,
          "project_id": "uuid",
          "create_time": "2024-01-01T00:00:00Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 20
    }
  }
  ```

### 8.3 标记消息已读
- **URL**: `/api/messages/{id}/read`
- **方法**: `PATCH`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "read": true
    }
  }
  ```

### 8.4 清除消息
- **URL**: `/api/messages/{id}/clear`
- **方法**: `PATCH`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "cleared": true
    }
  }
  ```

## 9. 统计接口

### 9.1 获取仪表板统计数据
- **URL**: `/api/stats/dashboard`
- **方法**: `GET`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "customer_count": 10,
      "project_count": 15,
      "form_count": 20,
      "completion_rate": 85.5,
      "report_count": 17,
      "report_view_rate": 90.0
    }
  }
  ```

### 9.2 获取行业分布统计
- **URL**: `/api/stats/industry`
- **方法**: `GET`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "industry": "制造业",
        "count": 10
      },
      {
        "industry": "能源",
        "count": 5
      }
    ]
  }
  ```

### 9.3 获取表单状态统计
- **URL**: `/api/stats/status`
- **方法**: `GET`
- **成功响应**:
  ```json
  {
    "success": true,
    "data": {
      "draft": 2,
      "filling": 3,
      "completed": 15
    }
  }
  ```

## 10. 通用响应格式

### 10.1 成功响应
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功" // 可选
}
```

### 10.2 错误响应
```json
{
  "success": false,
  "error": {
    "code": "401",
    "message": "未授权"
  }
}
```

## 11. 错误码

| 错误码 | 描述 |
|-------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 501 | 功能未实现 |

## 12. 认证方式

- 使用 JWT 认证
- 请求头中添加 `Authorization: Bearer {token}`
- 令牌有效期：24小时
- 支持令牌刷新

## 13. 速率限制

- 登录接口：每IP每分钟最多10次
- 其他接口：每用户每分钟最多60次

## 14. API 版本控制

- 使用 URL 路径版本控制：`/api/v1/...`
- 默认为 v1 版本
