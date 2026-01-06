# 部署指南

本文档详细介绍 Cloudflare Eco No-Code 平台的部署流程、环境配置和生产环境最佳实践。

## 🚀 部署概览

平台采用 **微服务架构**，包含以下独立部署的组件：

### 🏗️ 后端服务 (Cloudflare Workers)
- **API Worker** (`:8787`) - 主要 API 服务
- **Auth Worker** (`:8788`) - 认证服务（可选）
- **Realtime Worker** - 实时通信服务
- **Storage Service** - 文件存储服务
- **Workflow Service** - 工作流自动化服务

### 🎨 前端应用 (Cloudflare Pages)
- **Main Shell** - 微前端主应用容器
- **Admin Builder** - 管理后台界面
- **Client Runtime** - 动态应用运行时

### 🗄️ 数据存储
- **D1 Database** - 主要数据存储
- **R2 Storage** - 文件对象存储
- **Durable Objects** - 实时状态管理

## 📋 部署前准备

### 1. 环境要求
- **Node.js**: 18.0+ (开发环境)
- **Cloudflare Account**: 支持 Workers、Pages、D1、R2
- **域名**: 自定义域名（生产环境）
- **SSL**: 自动配置（Cloudflare 提供）

### 2. 必需的 Cloudflare 服务
```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler auth login

# 创建 D1 数据库
wrangler d1 create cf-nocode-db

# 创建 R2 存储桶
wrangler r2 bucket create cf-nocode-storage
```

### 3. 环境变量配置
创建 `.env` 文件：
```env
# 数据库
CF_NOCODE_DB=cf-nocode-db
D1_DATABASE=cf-nocode-db

# 认证
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=24h

# 存储
R2_BUCKET=cf-nocode-storage
STORAGE_BUCKET=cf-nocode-storage

# 实时通信
REALTIME_ROOM=cf-nocode-realtime

# 工作流
WORKFLOW_QUEUE=cf-nocode-workflows

# 环境
NODE_ENV=production
API_BASE_URL=https://api.yourdomain.com
```

## 🔧 部署步骤

### 第一步：数据库初始化

#### 1. 初始化主数据库
```bash
# 应用核心数据库架构
wrangler d1 execute cf-nocode-db --remote --file=./server/api-worker/schema.sql

# 初始化迁移系统
curl -X POST https://api.yourdomain.com/api/migrations/init \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 应用待处理的迁移
curl -X POST https://api.yourdomain.com/api/migrations/up \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. 初始化认证数据库
```bash
# 应用认证数据库架构
wrangler d1 execute cf-nocode-db --remote --file=./server/auth-worker/schema.sql
```

#### 3. 初始化其他服务数据库
```bash
# 工作流服务
wrangler d1 execute cf-nocode-db --remote --file=./server/workflow-service/schema.sql

# 存储服务
wrangler d1 execute cf-nocode-db --remote --file=./server/storage-service/schema.sql
```

### 第二步：部署后端服务

#### 1. 部署 API Worker
```bash
cd server/api-worker
wrangler deploy --env production

# 验证部署
curl https://api.yourdomain.com/
# 响应: Cloudflare No-Code API Engine Ready
```

#### 2. 部署 Auth Worker（可选）
```bash
cd server/auth-worker
wrangler deploy --env production
```

#### 3. 部署其他服务
```bash
# 实时通信服务
cd server/realtime-worker
wrangler deploy --env production

# 存储服务
cd server/storage-service
wrangler deploy --env production

# 工作流服务
cd server/workflow-service
wrangler deploy --env production
```

### 第三步：部署前端应用

#### 1. 构建前端应用
```bash
# 安装依赖
npm install

# 构建所有微前端应用
npm run build

# 或单独构建
cd client/main-shell && npm run build
cd client/admin-builder && npm run build
cd client/client-runtime && npm run build
```

#### 2. 部署到 Cloudflare Pages
```bash
# 创建 Pages 项目
wrangler pages project create cf-nocode-main-shell --production-branch main

# 部署主应用
wrangler pages deploy client/main-shell/dist --project-name cf-nocode-main-shell

# 部署管理后台
wrangler pages project create cf-nocode-admin-builder --production-branch main
wrangler pages deploy client/admin-builder/dist --project-name cf-nocode-admin-builder

# 部署客户端运行时
wrangler pages project create cf-nocode-client-runtime --production-branch main
wrangler pages deploy client/client-runtime/dist --project-name cf-nocode-client-runtime
```

#### 3. 配置自定义域名
```bash
# 在 Cloudflare Dashboard 中配置域名
# 或使用 Wrangler
wrangler pages domain add cf-nocode-main-shell yourdomain.com
wrangler pages domain add cf-nocode-admin-builder admin.yourdomain.com
```

### 第四步：配置服务发现

#### 1. 更新前端配置
编辑 `client/main-shell/micro-apps.ts`：
```typescript
export const microApps = [
  {
    name: 'admin-builder',
    entry: '//admin.yourdomain.com',
    container: '#admin-container',
    activeRule: '/admin',
  },
  {
    name: 'client-runtime',
    entry: '//app.yourdomain.com',
    container: '#app-container',
    activeRule: '/app',
  },
];
```

#### 2. 更新 API 配置
编辑 `client/shared/api.ts`：
```typescript
export const API_BASE_URL = 'https://api.yourdomain.com';
export const WS_URL = 'wss://api.yourdomain.com/ws';
export const STORAGE_URL = 'https://storage.yourdomain.com';
```

## 🔄 CI/CD 自动化部署

### GitHub Actions 工作流

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # 代码质量检查
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build applications
        run: npm run build
      
      - name: Security audit
        run: npm audit --audit-level moderate

  # 数据库迁移
  database-migrate:
    needs: quality-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Wrangler
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      
      - name: Apply database migrations
        run: |
          wrangler d1 execute cf-nocode-db --remote --file=./server/api-worker/schema.sql
          curl -X POST https://api.yourdomain.com/api/migrations/up

  # 部署后端服务
  deploy-backend:
    needs: database-migrate
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [api-worker, auth-worker, realtime-worker, storage-service, workflow-service]
    steps:
      - uses: actions/checkout@v3
      - name: Deploy ${{ matrix.service }}
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: server/${{ matrix.service }}
          command: deploy --env production

  # 部署前端应用
  deploy-frontend:
    needs: deploy-backend
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [main-shell, admin-builder, client-runtime]
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Build ${{ matrix.app }}
        run: |
          cd client/${{ matrix.app }}
          npm ci
          npm run build
      
      - name: Deploy to Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: cf-nocode-${{ matrix.app }}
          directory: client/${{ matrix.app }}/dist

  # 部署后验证
  post-deploy-verification:
    needs: [deploy-backend, deploy-frontend]
    runs-on: ubuntu-latest
    steps:
      - name: Health checks
        run: |
          # 检查 API 服务
          curl -f https://api.yourdomain.com/ || exit 1
          
          # 检查前端应用
          curl -f https://yourdomain.com/ || exit 1
          curl -f https://admin.yourdomain.com/ || exit 1
          
          # 检查关键 API 端点
          curl -f https://api.yourdomain.com/api/models || exit 1
```

### 必需的 GitHub Secrets

在 GitHub 仓库设置中配置以下 secrets：

```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
```

## 🌍 环境配置

### 开发环境 (Development)
```bash
# 启动所有服务
npm run dev

# 服务访问地址
API: http://localhost:8787
Auth: http://localhost:8788
Admin: http://localhost:3001
App: http://localhost:3000
```

### 测试环境 (Staging)
```bash
# 部署到测试环境
npm run deploy:staging

# 测试环境域名
API: https://staging-api.yourdomain.com
Admin: https://staging-admin.yourdomain.com
App: https://staging-app.yourdomain.com
```

### 生产环境 (Production)
```bash
# 部署到生产环境
npm run deploy:production

# 生产环境域名
API: https://api.yourdomain.com
Admin: https://admin.yourdomain.com
App: https://app.yourdomain.com
```

## 🔒 安全配置

### 1. SSL/TLS 配置
- Cloudflare 自动提供免费 SSL 证书
- 强制 HTTPS 重定向
- HSTS 策略配置

### 2. 域名验证
```bash
# 设置 DNS 记录
A     @        192.0.2.1
CNAME api      api.yourdomain.com
CNAME admin    admin.yourdomain.com
CNAME app      app.yourdomain.com
```

### 3. 防火墙规则
在 Cloudflare Dashboard 中配置：
- IP 白名单（管理后台）
- 速率限制
- DDoS 保护
- WAF 规则

### 4. 环境变量安全
```bash
# 使用 Wrangler secrets 存储敏感信息
wrangler secret put JWT_SECRET
wrangler secret put DATABASE_URL
wrangler secret put R2_ACCESS_KEY

# 验证 secrets
wrangler secret list
```

## 📊 监控和日志

### 1. Cloudflare Analytics
```bash
# 启用 Web Analytics
wrangler analytics enable --project-name cf-nocode-api
```

### 2. 实时日志监控
```bash
# 查看实时日志
wrangler tail --env production

# 过滤日志
wrangler tail --env production --format json | jq '.log.message'
```

### 3. 自定义监控
```typescript
// 在 API Worker 中添加监控
app.get('/api/health', async (c) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.CF_PAGES_COMMIT_SHA,
    services: {
      database: await checkDatabaseHealth(c.env.DB),
      storage: await checkStorageHealth(c.env.R2_BUCKET),
      realtime: await checkRealtimeHealth(c.env.REALTIME_ROOM)
    }
  };
  
  return c.json(health);
});
```

## 🚨 故障排除

### 常见部署问题

#### 1. 数据库连接失败
```bash
# 检查 D1 数据库状态
wrangler d1 info cf-nocode-db

# 重新创建数据库
wrangler d1 create cf-nocode-db-new
wrangler d1 execute cf-nocode-db-new --file=./schema.sql
```

#### 2. 环境变量未配置
```bash
# 检查环境变量
wrangler secret list

# 更新环境变量
wrangler secret put JWT_SECRET
```

#### 3. 前端路由问题
检查微前端配置：
```typescript
// 确保 entry URL 正确
entry: process.env.NODE_ENV === 'production' 
  ? 'https://admin.yourdomain.com' 
  : '//localhost:3001'
```

### 性能优化

#### 1. 缓存策略
```typescript
// 在 API Worker 中添加缓存头
app.use('/api/*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'public, max-age=300'); // 5分钟缓存
});
```

#### 2. CDN 配置
在 Cloudflare Dashboard 中：
- 启用 Argo Smart Routing
- 配置页面规则缓存
- 优化图片压缩

#### 3. 数据库优化
```sql
-- 添加索引优化查询
CREATE INDEX idx_models_created_at ON models(created_at);
CREATE INDEX idx_records_table_id ON records(table_name, created_at);
```

## 🔄 维护和更新

### 滚动更新策略
1. 更新数据库架构（迁移）
2. 部署后端服务（向后兼容）
3. 更新前端应用
4. 验证全链路功能
5. 清理旧版本资源

### 备份策略
```bash
# 自动备份数据库
wrangler d1 export cf-nocode-db --output=backup-$(date +%Y%m%d).sql

# 备份 R2 存储
wrangler r2 object list cf-nocode-storage --recursive | \
  xargs -I {} wrangler r2 object get cf-nocode-storage {} > backup-{}
```

### 版本回滚
```bash
# 回滚到上一个版本
git checkout HEAD~1
npm run deploy:production

# 或使用 Wrangler 回滚
wrangler rollback --env production
```

## 📚 相关文档

- [快速开始指南](./GETTING_STARTED.md) - 环境设置和本地开发
- [项目架构](./ARCHITECTURE.md) - 技术架构和系统设计
- [API 参考](./API_REFERENCE.md) - 完整的 API 文档
- [安全最佳实践](./SECURITY.md) - 安全配置和最佳实践
- [性能监控](./PERFORMANCE_MONITORING.md) - 性能优化和监控

---

**注意**: 本指南基于 Cloudflare Workers 和 Pages 的最新版本。部署前请确保所有依赖和服务都处于最新状态。