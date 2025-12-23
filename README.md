# Cloudflare Eco No-Code Platform

这是一个基于 Cloudflare 生态系统构建的开源无代码平台，旨在提供类似 Supabase 的功能，包括动态数据建模、自动化 RESTful/GraphQL API、以及可视化拖拽界面。

## 🚀 技术栈

- **后端**: Cloudflare Workers, Hono, D1 Database, Durable Objects, Apollo Server (GraphQL)
- **前端**: Vue 3, Vite, Qiankun (微前端), UnoCSS, Element Plus, Formily
- **部署**: Cloudflare Pages & Workers

## 🛠️ 环境准备

在开始之前，请确保您已安装：
- [Node.js](https://nodejs.org/) (v18+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-setup/) (`npm install -g wrangler`)
- 一个 Cloudflare 账号

## ⚙️ 配置指南

### 1. 环境变量与安全性

项目根目录下提供了 `.env.example` 文件。为了保护敏感数据（如 `database_id` 和 `JWT_SECRET`）：

1. 将 `.env.example` 复制并重命名为 `.env`。
2. 同时也建议创建一个 `.dev.vars` 文件用于本地开发时的秘密变量（Secrets）。
3. **重要**：`.env` 和 `.dev.vars` 已包含在 `.gitignore` 中，不会被推送到 Git 仓库。

### 2. 数据库准备 (D1)

在命令行中创建 D1 数据库：
```bash
npx wrangler d1 create cf-nocode-db
```
执行后，将输出的 `database_id` 填写到 `.env` 文件中记录，并手动更新 `wrangler.toml` 中的 `database_id`。

> [!TIP]
> 生产环境的 `database_id` 必须保留在 `wrangler.toml` 中以便 Cloudflare 识别绑定。对于其他敏感变量（如 API 密钥），请使用 `npx wrangler secret put KEY_NAME` 命令。

### 2. 数据库迁移

初始化元数据表：
```bash
npx wrangler d1 execute cf-nocode-db --file=./server/api-worker/schema.sql --local
```

### 3. 持久化对象配置

由于本项目使用了 Durable Objects（实时通信），如果您部署到生产环境，请确保您的 Cloudflare 账号已开启 Workers 订阅。

## 🏃 运行项目

### 一键启动所有服务
```bash
npm run dev
```

这会同时启动：
- API Worker (端口: 8787)
- Auth Worker (端口: 8788) 
- Main Shell (端口: 3000)
- Admin Builder (端口: 3001)
- Client Runtime (端口: 3002)

### 单独启动服务

#### 后端服务
- **API Worker**: `npm run dev:api` (端口: 8787)
- **Auth Worker**: `npm run dev:auth` (端口: 8788)

#### 前端应用
本项目采用微前端架构，需要进入对应目录启动服务：

- **Main Shell**: `cd client/main-shell && npm run dev` (端口: 3000)
- **Admin Builder**: `cd client/admin-builder && npm run dev` (端口: 3001)
- **Client Runtime**: `cd client/client-runtime && npm run dev` (端口: 3002)

访问 `http://localhost:3000` 即可通过主应用访问整个平台。

### 数据库初始化
```bash
# 初始化元数据表
npm run db:init

# 初始化认证表
npm run auth:init-schema
```

## 🚢 部署

### 部署后端 (Workers)
```bash
npx wrangler deploy
```

### 部署前端 (Pages)
1. 将代码推送至 GitHub。
2. 在 Cloudflare Dashboard 中创建新的 Pages 项目。
3. 连接 GitHub 仓库并配置构建命令：
   - 构建命令: `npm run build`
   - 输出目录: `dist`

## 🌟 核心功能

### ✅ 已完成的功能
- **Model Builder**: 动态创建 D1 数据表
  - 可视化模型设计器 (Admin Builder)
  - 字段类型配置（文本、数字、布尔值、日期、关系）
  - 实时 SQL 预览
  - 一键生成数据库表
  - 模型和字段的完整CRUD管理

- **Auto API**: 自动生成 RESTful API
  - 完整的 CRUD 操作（GET, POST, PUT, DELETE）
  - 分页、过滤、排序支持
  - 批量删除操作
  - 动态表数据管理
  - 统一的错误处理和响应格式

- **Authentication System**: JWT 认证授权
  - 用户注册/登录 (集成到主API服务)
  - 密码哈希和安全验证
  - JWT令牌生成和验证
  - 用户信息管理
  - 统一的数据库连接 (与主API共享D1实例)

- **GraphQL API**: 动态 GraphQL schema 生成
  - Apollo Server 集成
  - 模型查询和数据操作
  - GraphQL Playground 界面
  - 兼容 Cloudflare Workers 环境

- **UI Designer**: PC 和手机端响应式拖拽布局
  - 组件化设计界面
  - 设备预览切换
  - 页面配置保存
  - 微前端架构支持

- **Project Architecture**: 完整的项目架构
  - 微前端架构 (Qiankun)
  - 多Worker分离设计
  - TypeScript 类型安全
  - Cloudflare Workers 部署配置

### 🚧 开发中的功能
- **Real-time Communication**: 基于 Durable Objects 的毫秒级数据同步
  - 基础框架已搭建
  - 需要完善WebSocket实现
  - 实时数据同步逻辑

- **Storage Service**: 文件上传和云存储集成
  - 目录结构已创建
  - 需要实现文件上传API
  - 云存储集成逻辑

- **Workflow Automation**: 数据变更触发器和业务逻辑自动化
  - 概念设计完成
  - 需要实现触发器引擎
  - 工作流配置界面

- **Frontend Enhancement**: 前端用户体验优化
  - 模型设计器界面完善
  - 数据管理界面开发
  - 用户认证界面集成

### ⚠️ 已知问题和待优化
- **JWT Token Validation**: JWT中间件验证需要进一步调试
- **GraphQL Production Readiness**: GraphQL API需要生产环境测试
- **Database Schema Migration**: 需要完善的数据库迁移系统
- **Multi-environment Configuration**: 多环境配置需要优化

## 📁 项目结构
```
cf/
├── server/
│   ├── api-worker/          # ✅ 主 API 服务（完全功能）
│   │   ├── model-service.ts    # 模型管理服务
│   │   ├── crud-service.ts     # CRUD操作服务
│   │   ├── graphql.ts         # GraphQL API服务
│   │   ├── index.ts           # API路由（包含认证）
│   │   └── schema.sql         # 数据库schema
│   ├── auth-worker/         # ⚠️ 独立认证服务（可弃用，功能已集成到API服务）
│   │   ├── index.ts         # 认证API
│   │   ├── schema.sql       # 认证表结构
│   │   └── wrangler.toml    # 部署配置
│   ├── realtime-worker/     # ⚠️ 实时通信服务（基础框架）
│   │   └── index.ts         # WebSocket实现
│   └── storage-service/     # ⚠️ 存储服务（开发中，目录结构）
├── client/
│   ├── main-shell/          # ⚠️ 主应用壳（基础框架）
│   │   ├── App.vue          # 主应用组件
│   │   ├── router.ts        # 路由配置
│   │   └── micro-apps.ts    # 微应用配置
│   ├── admin-builder/       # ✅ 管理后台（核心功能）
│   │   ├── AdminHome.vue       # 模型设计器主界面
│   │   ├── UIDesigner.vue     # UI设计器界面
│   │   ├── ModelFieldConfig.vue # 字段配置组件
│   │   └── formily-config.ts  # Formily配置
│   └── client-runtime/      # ⚠️ 客户端运行时（基础框架）
│       ├── App.vue          # 客户端应用
│       └── main.ts         # 客户端入口
└── 配置文件
    ├── package.json         # ✅ 根项目配置
    ├── wrangler.toml        # ✅ API服务配置（已修复构建错误）
    ├── tsconfig.json        # ✅ TypeScript配置
    ├── .env.example         # ✅ 环境变量模板
    └── .dev.vars            # ✅ 开发环境变量
```

## 🔧 API 文档

### 模型管理 API
- `GET    /api/models` - 获取所有模型
- `GET    /api/models/:id` - 获取单个模型（包含字段）
- `POST   /api/models` - 创建新模型
- `PUT    /api/models/:id` - 更新模型
- `DELETE /api/models/:id` - 删除模型

### 字段管理 API
- `POST   /api/models/:modelId/fields` - 添加字段到模型
- `PUT    /api/fields/:id` - 更新字段
- `DELETE /api/fields/:id` - 删除字段

### 动态表创建 API
- `POST   /api/tables/:modelId/create` - 根据模型定义创建数据库表

### 数据 CRUD API
- `GET    /api/data/:tableName` - 获取数据列表（支持分页过滤）
- `GET    /api/data/:tableName/:id` - 获取单条数据
- `POST   /api/data/:tableName` - 创建数据
- `PUT    /api/data/:tableName/:id` - 更新数据
- `DELETE /api/data/:tableName/:id` - 删除数据
- `POST   /api/data/:tableName/batch-delete` - 批量删除数据

### 认证 API
- `POST   /api/auth/register` - 用户注册
- `POST   /api/auth/login` - 用户登录
- `GET    /api/auth/me` - 获取当前用户信息
- `POST   /api/auth/refresh` - 刷新 Token
- `POST   /api/auth/reset-password` - 重置密码请求
- `PUT    /api/auth/update-password` - 更新密码

### GraphQL API
项目已集成GraphQL API，支持以下功能：

#### GraphQL端点
- `POST   /graphql` - GraphQL API端点
- `GET    /graphql-playground` - GraphQL Playground界面

#### GraphQL Schema
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

#### GraphQL查询示例
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
```

### 测试命令
```bash
# 测试GraphQL API
curl -X POST http://127.0.0.1:8787/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { models { id name label } }"}'

# 访问GraphQL Playground
open http://127.0.0.1:8787/graphql-playground
```

---
Built with ❤️ using Cloudflare Workers.
