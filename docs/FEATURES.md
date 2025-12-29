# 功能指南

本文档详细介绍 Cloudflare Eco No-Code 平台的核心功能和使用方法。

## 🌟 核心功能概览

### ✅ 已完成的功能

#### 1. Model Builder - 动态数据建模
**功能描述**: 可视化创建和管理数据库表结构

**主要特性**:
- **可视化模型设计器**: 在 Admin Builder 界面中拖拽式创建数据模型
- **字段类型配置**: 支持文本、数字、布尔值、日期、关系等多种字段类型
- **实时 SQL 预览**: 设计时实时查看生成的 SQL 语句
- **一键生成数据库表**: 根据模型定义自动创建 D1 数据库表
- **完整 CRUD 管理**: 对模型和字段进行增删改查操作

**使用场景**:
- 快速创建业务数据表
- 动态调整数据结构
- 原型开发和迭代

#### 2. Auto API - 自动化 RESTful API
**功能描述**: 根据数据模型自动生成完整的 RESTful API

**主要特性**:
- **完整 CRUD 操作**: 自动生成 GET, POST, PUT, DELETE 接口
- **高级查询支持**: 分页、过滤、排序、搜索
- **批量操作**: 支持批量删除数据
- **动态表数据管理**: 自动适配不同表结构
- **统一错误处理**: 标准化的错误响应格式

**API 端点示例**:
```
GET    /api/data/:tableName          # 获取数据列表
GET    /api/data/:tableName/:id      # 获取单条数据
POST   /api/data/:tableName          # 创建数据
PUT    /api/data/:tableName/:id      # 更新数据
DELETE /api/data/:tableName/:id      # 删除数据
```

#### 3. Authentication System - JWT 认证授权
**功能描述**: 完整的用户认证和授权系统

**主要特性**:
- **用户注册/登录**: 完整的用户管理流程
- **密码安全**: SHA-256 哈希加密存储
- **JWT 令牌**: 基于 JWT 的无状态认证
- **用户信息管理**: 获取和更新用户资料
- **统一数据库连接**: 与主 API 共享 D1 实例

**认证端点**:
```
POST   /api/auth/register     # 用户注册
POST   /api/auth/login        # 用户登录
GET    /api/auth/me           # 获取当前用户信息
POST   /api/auth/refresh      # 刷新令牌
```

#### 4. GraphQL API - 动态 GraphQL Schema
**功能描述**: 自动生成的 GraphQL API，支持灵活的数据查询

**主要特性**:
- **Apollo Server 集成**: 完整的 GraphQL 服务器实现
- **动态 Schema 生成**: 根据数据模型自动生成 GraphQL Schema
- **GraphQL Playground**: 交互式 API 测试界面
- **生产就绪功能**:
  - 错误处理和格式化
  - 输入验证和参数检查
  - 查询复杂度限制（最大深度 20）
  - 缓存控制头

**GraphQL 查询示例**:
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

# 查询表数据
query {
  data(tableName: "products", page: 1, pageSize: 10) {
    data
    total
    page
    pageSize
    totalPages
  }
}
```

#### 5. UI Designer - 响应式拖拽布局
**功能描述**: PC 和移动端响应式界面设计器

**主要特性**:
- **组件化设计界面**: 拖拽式组件布局
- **设备预览切换**: 实时查看不同设备尺寸效果
- **页面配置保存**: 保存和加载页面设计
- **微前端架构支持**: 集成到主应用框架

#### 6. Database Migration System - 数据库迁移管理
**功能描述**: 版本化的数据库迁移系统

**主要特性**:
- **版本化迁移文件**: 支持增量数据库变更
- **迁移历史记录**: 跟踪所有已应用的迁移
- **MigrationService 管理类**: 统一的迁移管理接口
- **迁移状态检查**: API 端点查看迁移状态

**迁移 API**:
```
GET    /api/migrations/status    # 查看迁移状态
POST   /api/migrations/init      # 初始化迁移系统
POST   /api/migrations/up        # 应用所有待处理迁移
```

#### 7. Multi-environment Configuration - 多环境配置
**功能描述**: 支持不同环境的配置管理

**主要特性**:
- **环境支持**: development、testing、production
- **配置验证**: 类型安全的配置验证
- **优先级覆盖**: 环境变量优先级高于配置文件
- **类型安全接口**: TypeScript 类型定义

### 🚧 开发中的功能

#### 1. Real-time Communication - 实时通信
**功能描述**: 基于 Durable Objects 的毫秒级数据同步

**当前状态**:
- 基础框架已搭建
- 需要完善 WebSocket 实现
- 实时数据同步逻辑待开发

**计划功能**:
- WebSocket 连接管理
- 实时数据变更通知
- 客户端 JavaScript SDK
- 用户在线状态跟踪

#### 2. Storage Service - 文件存储服务
**功能描述**: 文件上传和云存储集成

**当前状态**:
- 目录结构已创建
- 需要实现文件上传 API
- 云存储集成逻辑待开发

**计划功能**:
- R2 存储的文件上传接口
- 文件列表、删除、权限控制
- 图片压缩、裁剪、格式转换
- Cloudflare CDN 集成

#### 3. Workflow Automation - 工作流自动化
**功能描述**: 数据变更触发器和业务逻辑自动化

**当前状态**:
- 概念设计完成
- 需要实现触发器引擎
- 工作流配置界面待开发

**计划功能**:
- 数据变更触发器
- 可视化工作流配置
- 异步任务处理和调度
- 邮件、Webhook、消息推送

#### 4. Frontend Enhancement - 前端体验优化
**功能描述**: 前端用户界面和体验优化

**当前状态**:
- 模型设计器基础功能完成
- 需要完善数据管理界面
- 用户认证界面待集成

**计划功能**:
- 拖拽式字段配置和布局
- 表格视图、筛选、批量操作
- 完整的注册、登录、个人中心
- 移动端适配和性能优化

## 🔧 功能使用示例

### 创建数据模型

1. **访问管理后台**: 打开 `http://localhost:3001`
2. **创建新模型**: 点击"新建模型"按钮
3. **配置模型信息**: 输入模型名称、标签、描述
4. **添加字段**: 为模型添加需要的字段
5. **生成数据库表**: 点击"创建表"按钮

### 使用 RESTful API

```bash
# 创建新产品
curl -X POST http://localhost:8787/api/data/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15",
    "price": 999.99,
    "category": "electronics",
    "in_stock": true
  }'

# 查询产品列表
curl -X GET "http://localhost:8787/api/data/products?page=1&pageSize=10&category=electronics"
```

### 使用 GraphQL API

```bash
# 执行 GraphQL 查询
curl -X POST http://localhost:8787/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { models { id name label } }"}'

# 访问 GraphQL Playground
open http://localhost:8787/graphql-playground
```

### 用户认证

```bash
# 用户注册
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123","name":"Test User"}'

# 用户登录
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123"}'

# 获取用户信息（使用返回的 token）
curl -X GET http://localhost:8787/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 功能状态跟踪

### ⚠️ 已解决的问题
- **JWT Token Validation**: ✅ JWT中间件验证已修复，认证API正常工作
- **GraphQL Production Readiness**: ✅ GraphQL API已增强，具备生产就绪功能
- **Database Schema Migration**: ✅ 数据库迁移系统已实现
- **Multi-environment Configuration**: ✅ 多环境配置系统已完善

## 📚 相关文档

- [快速开始指南](./GETTING_STARTED.md) - 环境设置和项目运行
- [API 参考](./API_REFERENCE.md) - 详细的 API 文档
- [项目架构](./ARCHITECTURE.md) - 技术架构和开发计划
- [开发指南](./DEVELOPMENT.md) - 贡献指南和开发路线图
