# 快速开始指南

本文档将指导您如何快速设置和运行 Cloudflare Eco No-Code 平台。

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

1. 将 `.env.example` 复制并重命名为 `.env`
2. 同时也建议创建一个 `.dev.vars` 文件用于本地开发时的秘密变量（Secrets）
3. **重要**：`.env` 和 `.dev.vars` 已包含在 `.gitignore` 中，不会被推送到 Git 仓库

### 2. 数据库准备 (D1)

在命令行中创建 D1 数据库：

```bash
npx wrangler d1 create cf-nocode-db
```

执行后，将输出的 `database_id` 填写到 `.env` 文件中记录，并手动更新 `wrangler.toml` 中的 `database_id`

> [!TIP]
> 生产环境的 `database_id` 必须保留在 `wrangler.toml` 中以便 Cloudflare 识别绑定。对于其他敏感变量（如 API 密钥），请使用 `npx wrangler secret put KEY_NAME` 命令

### 3. 数据库迁移

初始化元数据表：

```bash
npx wrangler d1 execute cf-nocode-db --file=./server/api-worker/schema.sql --local
```

### 4. 持久化对象配置

由于本项目使用了 Durable Objects（实时通信），如果您部署到生产环境，请确保您的 Cloudflare 账号已开启 Workers 订阅

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

访问 `http://localhost:3000` 即可通过主应用访问整个平台

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

1. 将代码推送至 GitHub
2. 在 Cloudflare Dashboard 中创建新的 Pages 项目
3. 连接 GitHub 仓库并配置构建命令：
   - 构建命令: `npm run build`
   - 输出目录: `dist`

## 📚 下一步

- 查看 [功能指南](./FEATURES.md) 了解平台的核心功能
- 阅读 [API 参考](./API_REFERENCE.md) 了解详细的 API 使用方法
- 了解 [项目架构](./ARCHITECTURE.md) 和开发计划

---

**遇到问题？** 请查看 [GitHub Issues](https://github.com/yuyichen/cf-nocode/issues) 或提交新的问题
