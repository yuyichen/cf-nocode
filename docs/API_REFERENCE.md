# API 参考文档

本文档提供 Cloudflare Eco No-Code 平台所有 API 端点的详细说明和使用示例。

## 📋 API 概览

平台提供以下类型的 API：

1. **模型管理 API** - 管理数据模型和字段定义
2. **数据 CRUD API** - 动态表数据的完整操作，支持高级查询
3. **认证 API** - JWT 用户认证、授权和会话管理
4. **角色权限 API** - 基于角色的访问控制 (RBAC) 系统
5. **GraphQL API** - 灵活的 GraphQL 查询和变更
6. **文件存储 API** - Cloudflare R2 文件上传、下载和管理
7. **工作流 API** - 业务流程自动化和触发器管理
8. **实时通信 API** - WebSocket 连接和实时消息推送
9. **迁移 API** - 数据库版本管理和迁移系统
10. **系统 API** - 健康检查、统计信息和系统状态

### 🏗️ 微服务架构

平台采用微服务架构，每个服务独立部署：

- **API Worker** (`:8787`) - 主要业务逻辑和数据处理
- **Auth Worker** (`:8788`) - 专用认证服务（可选部署）
- **Storage Service** - 文件存储和管理
- **Workflow Service** - 工作流自动化
- **Realtime Worker** - WebSocket 实时通信

所有 API 都遵循 RESTful 设计原则，使用 JSON 格式进行数据交换，支持 CORS 跨域访问。

## 🔧 模型管理 API

### 获取所有模型
```
GET /api/models
```

**描述**: 获取所有已创建的数据模型

**响应示例**:
```json
[
  {
    "id": "435a38ac-97a7-4a59-9fd4-1c6a58bfb19f",
    "name": "products",
    "label": "产品",
    "description": "产品目录",
    "created_at": "2025-12-23T10:03:59.189Z",
    "updated_at": "2025-12-23T10:03:59.189Z",
    "fields": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "name",
        "label": "产品名称",
        "type": "text",
        "required": true,
        "unique_key": false,
        "default_value": null,
        "validation_rules": null
      }
    ]
  }
]
```

### 获取单个模型
```
GET /api/models/:id
```

**参数**:
- `id` (路径参数): 模型 ID

**响应**: 返回指定模型的详细信息，包括所有字段

### 创建模型
```
POST /api/models
```

**请求体**:
```json
{
  "name": "products",
  "label": "产品",
  "description": "产品目录"
}
```

**必填字段**:
- `name`: 模型名称（英文，用于表名）
- `label`: 模型标签（中文显示名称）

### 更新模型
```
PUT /api/models/:id
```

**参数**:
- `id` (路径参数): 模型 ID

**请求体**:
```json
{
  "label": "更新后的产品名称",
  "description": "更新后的描述"
}
```

### 删除模型
```
DELETE /api/models/:id
```

**参数**:
- `id` (路径参数): 模型 ID

## 📝 字段管理 API

### 添加字段到模型
```
POST /api/models/:modelId/fields
```

**参数**:
- `modelId` (路径参数): 模型 ID

**请求体**:
```json
{
  "name": "price",
  "label": "价格",
  "type": "number",
  "required": true,
  "unique_key": false,
  "default_value": "0",
  "validation_rules": {
    "min": 0,
    "max": 1000000
  }
}
```

**支持的字段类型**:
- `text`: 文本类型
- `number`: 数字类型
- `boolean`: 布尔类型
- `date`: 日期类型
- `datetime`: 日期时间类型
- `relation`: 关系类型

### 更新字段
```
PUT /api/fields/:id
```

**参数**:
- `id` (路径参数): 字段 ID

### 删除字段
```
DELETE /api/fields/:id
```

**参数**:
- `id` (路径参数): 字段 ID

## 🗃️ 动态表创建 API

### 创建动态表
```
POST /api/tables/:modelId/create
```

**参数**:
- `modelId` (路径参数): 模型 ID

**描述**: 根据模型定义创建实际的数据库表

**响应示例**:
```json
{
  "success": true,
  "message": "Table 'products' created successfully",
  "sql": "CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, price REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"
}
```

## 📊 数据 CRUD API

### 获取数据列表
```
GET /api/data/:tableName
```

**参数**:
- `tableName` (路径参数): 表名称

**查询参数**:
- `page` (可选): 页码，默认 1
- `pageSize` (可选): 每页数量，默认 20
- `sortBy` (可选): 排序字段，默认 `created_at`
- `sortOrder` (可选): 排序方向，`asc` 或 `desc`，默认 `desc`
- 其他字段: 作为过滤条件，例如 `category=electronics`

**响应示例**:
```json
{
  "data": [
    {
      "id": "1",
      "name": "iPhone 15",
      "price": 999.99,
      "category": "electronics",
      "created_at": "2025-12-23T10:03:59.189Z",
      "updated_at": "2025-12-23T10:03:59.189Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

### 获取单条数据
```
GET /api/data/:tableName/:id
```

**参数**:
- `tableName` (路径参数): 表名称
- `id` (路径参数): 数据 ID

### 创建数据
```
POST /api/data/:tableName
```

**参数**:
- `tableName` (路径参数): 表名称

**请求体**: 任意 JSON 对象，对应表的字段结构

**响应示例**:
```json
{
  "success": true,
  "id": "new-record-id",
  "message": "Data created successfully"
}
```

### 更新数据
```
PUT /api/data/:tableName/:id
```

**参数**:
- `tableName` (路径参数): 表名称
- `id` (路径参数): 数据 ID

### 删除数据
```
DELETE /api/data/:tableName/:id
```

**参数**:
- `tableName` (路径参数): 表名称
- `id` (路径参数): 数据 ID

### 批量删除数据
```
POST /api/data/:tableName/batch-delete
```

**参数**:
- `tableName` (路径参数): 表名称

**请求体**:
```json
{
  "ids": ["id1", "id2", "id3"]
}
```

## 🔐 认证 API

### 用户注册
```
POST /api/auth/register
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "secure123",
  "name": "Test User"
}
```

**必填字段**:
- `email`: 用户邮箱
- `password`: 密码

**响应示例**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "0deb7a24-ca14-4a85-aab8-5eef9830b54c",
    "email": "user@example.com",
    "name": "Test User",
    "created_at": "2025-12-23T10:03:59.189Z"
  }
}
```

### 用户登录
```
POST /api/auth/login
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "secure123"
}
```

**响应**: 与注册接口相同，返回 JWT token 和用户信息

### 获取当前用户信息
```
GET /api/auth/me
```

**认证头**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**响应**:
```json
{
  "success": true,
  "user": {
    "id": "0deb7a24-ca14-4a85-aab8-5eef9830b54c",
    "email": "user@example.com",
    "name": "Test User",
    "created_at": "2025-12-23T10:03:59.189Z",
    "updated_at": "2025-12-23T10:03:59.189Z"
  }
}
```

### 刷新令牌
```
POST /api/auth/refresh
```

**认证头**: 需要有效的 JWT token

**响应**: 返回新的 JWT token

## 🎯 GraphQL API

### GraphQL 端点
```
POST /graphql
```

### GraphQL Playground
```
GET /graphql-playground
```

### GraphQL Schema

```graphql
type ModelField {
  id: ID!
  name: String!
  label: String!
  type: String!
  required: Boolean!
  unique_key: Boolean!
  default_value: String
  validation_rules: JSON
}

type Model {
  id: ID!
  name: String!
  label: String!
  description: String
  created_at: String!
  updated_at: String!
  fields: [ModelField!]
}

type Query {
  # 获取所有模型
  models: [Model!]!
  
  # 根据ID获取模型
  model(id: ID!): Model
  
  # 获取动态表数据
  data(tableName: String!, page: Int = 1, pageSize: Int = 20): DataResult!
}

type DataResult {
  data: [JSON!]!
  total: Int!
  page: Int!
  pageSize: Int!
  totalPages: Int!
}

type Mutation {
  # 创建模型
  createModel(name: String!, label: String!, description: String): Model!
  
  # 创建数据
  createData(tableName: String!, data: JSON!): CreateResult!
}

type CreateResult {
  success: Boolean!
  id: ID
  message: String
}

scalar JSON
```

### GraphQL 查询示例

```graphql
# 查询所有模型
query {
  models {
    id
    name
    label
    fields {
      id
      name
      type
    }
  }
}

# 查询特定模型
query {
  model(id: "435a38ac-97a7-4a59-9fd4-1c6a58bfb19f") {
    id
    name
    label
    fields {
      id
      name
      type
      required
    }
  }
}

# 查询表数据
query {
  data(tableName: "test_users", page: 1, pageSize: 10) {
    data
    total
    page
    pageSize
    totalPages
  }
}

# 创建模型
mutation {
  createModel(name: "products", label: "产品", description: "产品目录") {
    id
    name
    label
  }
}

# 创建数据
mutation {
  createData(tableName: "products", data: {name: "iPhone 15", price: 999.99}) {
    success
    id
    message
  }
}
```

## 🎭 角色权限管理 API

### 初始化 RBAC 系统
```
POST /api/roles/init-schema
```

**描述**: 初始化角色权限系统，创建默认角色和权限

**响应示例**:
```json
{
  "success": true,
  "message": "RBAC system initialized successfully",
  "createdRoles": ["admin", "editor", "viewer"],
  "createdPermissions": 25
}
```

### 获取所有角色
```
GET /api/roles
```

**响应示例**:
```json
[
  {
    "id": "role-001",
    "name": "管理员",
    "code": "admin",
    "description": "系统管理员，拥有所有权限",
    "user_count": 2,
    "permission_count": 25,
    "created_at": "2025-12-23T10:00:00.000Z"
  }
]
```

### 创建角色
```
POST /api/roles
```

**请求体**:
```json
{
  "name": "内容编辑",
  "code": "content_editor",
  "description": "负责内容创建和编辑"
}
```

### 获取权限列表
```
GET /api/permissions
```

**响应示例**:
```json
[
  {
    "id": "perm-001",
    "module": "models",
    "action": "create",
    "description": "创建数据模型",
    "code": "models:create"
  }
]
```

### 按模块获取权限
```
GET /api/permissions/by-module
```

**响应示例**:
```json
{
  "models": [
    { "code": "models:create", "description": "创建模型" },
    { "code": "models:read", "description": "查看模型" },
    { "code": "models:update", "description": "更新模型" },
    { "code": "models:delete", "description": "删除模型" }
  ],
  "records": [
    { "code": "records:create", "description": "创建记录" },
    { "code": "records:read", "description": "查看记录" }
  ]
}
```

### 分配角色权限
```
PUT /api/roles/:roleId/permissions
```

**请求体**:
```json
{
  "permissionIds": ["perm-001", "perm-002", "perm-003"]
}
```

## 📁 文件存储 API

### 上传文件
```
POST /upload
```

**Content-Type**: `multipart/form-data`

**请求参数**:
- `file` (文件): 要上传的文件
- `folder` (可选): 文件夹路径
- `public` (可选): 是否公开访问，默认 false

**响应示例**:
```json
{
  "success": true,
  "file": {
    "id": "file-123",
    "name": "document.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "url": "https://storage.example.com/files/file-123",
    "created_at": "2025-12-23T10:00:00.000Z"
  }
}
```

### 获取文件列表
```
GET /files
```

**查询参数**:
- `page` (可选): 页码，默认 1
- `pageSize` (可选): 每页数量，默认 20
- `folder` (可选): 文件夹筛选
- `type` (可选): 文件类型筛选

**响应示例**:
```json
{
  "files": [
    {
      "id": "file-123",
      "name": "document.pdf",
      "size": 1024000,
      "type": "application/pdf",
      "folder": "/documents",
      "public": true,
      "created_at": "2025-12-23T10:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

### 下载文件
```
GET /file/:id
```

**参数**:
- `id` (路径参数): 文件 ID

**响应**: 文件二进制数据，包含适当的 Content-Type 头

### 获取文件访问 URL
```
GET /url/:id
```

**响应示例**:
```json
{
  "url": "https://storage.example.com/files/file-123?expires=2025-12-24T10:00:00.000Z&signature=abc123",
  "expiresAt": "2025-12-24T10:00:00.000Z"
}
```

### 删除文件
```
DELETE /file/:id
```

**响应示例**:
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### 获取存储统计
```
GET /stats
```

**响应示例**:
```json
{
  "totalFiles": 1500,
  "totalSize": 5368709120,
  "usedQuota": 2147483648,
  "availableQuota": 3221225472,
  "filesByType": {
    "image": 800,
    "document": 500,
    "video": 200
  }
}
```

## ⚙️ 工作流 API

### 获取工作流列表
```
GET /workflows
```

**响应示例**:
```json
[
  {
    "id": "workflow-001",
    "name": "用户注册欢迎流程",
    "description": "新用户注册时发送欢迎邮件",
    "enabled": true,
    "trigger": {
      "type": "data_change",
      "table": "users",
      "event": "create"
    },
    "created_at": "2025-12-23T10:00:00.000Z",
    "last_executed": "2025-12-23T15:30:00.000Z"
  }
]
```

### 创建工作流
```
POST /workflows
```

**请求体**:
```json
{
  "name": "订单处理流程",
  "description": "处理新订单的自动化流程",
  "trigger": {
    "type": "data_change",
    "table": "orders",
    "event": "create",
    "conditions": {
      "status": "pending"
    }
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "to": "{{customer.email}}",
        "subject": "订单确认",
        "template": "order_confirmation"
      }
    },
    {
      "type": "update_data",
      "config": {
        "table": "orders",
        "id": "{{record.id}}",
        "data": {
          "status": "processing"
        }
      }
    }
  ]
}
```

### 手动触发工作流
```
POST /workflows/trigger
```

**请求体**:
```json
{
  "workflowId": "workflow-001",
  "data": {
    "userId": "user-123",
    "action": "manual_trigger"
  }
}
```

### 获取执行历史
```
GET /executions
```

**查询参数**:
- `workflowId` (可选): 工作流 ID 筛选
- `status` (可选): 执行状态筛选 (success/failure/running)
- `page` (可选): 页码
- `pageSize` (可选): 每页数量

## 🔄 实时通信 API

### WebSocket 连接
```
GET /ws
```

**协议**: WebSocket
**URL**: `ws://localhost:8787/ws`

#### 连接认证
```javascript
const ws = new WebSocket('ws://localhost:8787/ws?token=YOUR_JWT_TOKEN');
```

#### 消息格式
```json
{
  "type": "subscribe",
  "channel": "table:users",
  "data": {}
}
```

#### 数据变更通知
```json
{
  "type": "data_change",
  "channel": "table:users",
  "data": {
    "action": "create",
    "table": "users",
    "record": {
      "id": "user-123",
      "name": "新用户",
      "created_at": "2025-12-23T10:00:00.000Z"
    }
  }
}
```

### 获取实时状态
```
GET /status
```

**响应示例**:
```json
{
  "connected_clients": 150,
  "active_rooms": 25,
  "messages_per_second": 45,
  "uptime": 86400
}
```

### 广播消息
```
POST /broadcast
```

**请求体**:
```json
{
  "channel": "global",
  "message": {
    "type": "notification",
    "title": "系统维护通知",
    "content": "系统将在10分钟后进行维护"
  }
}
```

## 🗄️ 数据库迁移 API

### 获取迁移状态
```
GET /api/migrations/status
```

**响应示例**:
```json
{
  "initialized": true,
  "appliedMigrations": 0,
  "pendingMigrations": 2,
  "details": [
    {
      "version": "001",
      "name": "create_migration_table",
      "status": "pending"
    },
    {
      "version": "002",
      "name": "create_metadata_tables",
      "status": "pending"
    }
  ]
}
```

### 初始化迁移系统
```
POST /api/migrations/init
```

### 应用所有待处理迁移
```
POST /api/migrations/up
```

## 📊 系统 API

### 健康检查
```
GET /
```

**响应**: `Cloudflare No-Code API Engine Ready`

### 获取系统统计
```
GET /api/stats
```

**响应示例**:
```json
{
  "models": {
    "total": 25,
    "created_this_month": 5
  },
  "records": {
    "total": 15420,
    "created_today": 127
  },
  "users": {
    "total": 850,
    "active_today": 120
  },
  "storage": {
    "total_files": 3200,
    "total_size": "5.2GB"
  },
  "workflows": {
    "total": 15,
    "executed_today": 1450
  }
}
```

## 🧪 测试命令

### 测试 GraphQL API
```bash
curl -X POST http://127.0.0.1:8787/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { models { id name label } }"}'
```

### 访问 GraphQL Playground
```bash
open http://127.0.0.1:8787/graphql-playground
```

### 测试认证 API
```bash
# 用户注册
curl -X POST http://127.0.0.1:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# 用户登录
curl -X POST http://127.0.0.1:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 获取用户信息
curl -X GET http://127.0.0.1:8787/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## ⚠️ 错误处理

所有 API 都使用标准化的错误响应格式：

```json
{
  "error": "错误描述信息",
  "code": "ERROR_CODE"  # 可选
}
```

**常见 HTTP 状态码**:
- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权
- `404`: 资源未找到
- `409`: 资源冲突（如用户已存在）
- `500`: 服务器内部错误

## 📚 相关文档

- [快速开始指南](./GETTING_STARTED.md) - 环境设置和项目运行
- [功能指南](./FEATURES.md) - 平台功能详细介绍
- [项目架构](./ARCHITECTURE.md) - 技术架构和开发计划
- [开发指南](./DEVELOPMENT.md) - 贡献指南和开发路线图
