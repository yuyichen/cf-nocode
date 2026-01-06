# Cloudflare Eco No-Code Platform

一个基于 Cloudflare 生态系统构建的企业级开源无代码平台，提供类似 Supabase 的功能，包括动态数据建模、自动化 RESTful/GraphQL API、可视化拖拽界面，以及完整的企业级特性。

## ✨ 核心特性

### 🚀 数据建模与 API
- **动态数据建模**: 可视化创建和管理数据库表结构，支持复杂关系和验证规则
- **自动化 API**: 自动生成 RESTful 和 GraphQL API，支持高级查询、排序和分页
- **实时数据同步**: 基于 Durable Objects 的毫秒级数据同步和变更通知

### 🔐 企业级安全与权限
- **完整认证**: JWT 认证和用户管理系统，支持密码重置和令牌刷新
- **角色权限控制**: 基于角色的访问控制 (RBAC)，细粒度权限管理
- **数据安全**: 输入验证、SQL 注入防护、CORS 配置和 HTTPS 强制

### 🎨 用户界面与体验
- **可视化设计**: PC 和移动端响应式拖拽布局，所见即所得
- **动态表单**: 基于 Formily 的动态表单生成和验证
- **微前端架构**: 基于 Qiankun 的模块化前端架构

### 📁 企业服务集成
- **文件存储**: 集成 Cloudflare R2 存储服务，支持文件上传、下载和管理
- **工作流自动化**: 数据变更触发器和业务逻辑自动化引擎
- **实时通信**: WebSocket 支持的实时消息推送和协作功能

### 🛠️ 开发者友好
- **数据库迁移**: 版本化数据库迁移系统，支持回滚
- **API 文档**: 内置 API 测试界面和完整文档
- **开发工具**: 完整的开发工具链和调试支持

## 📚 完整文档

我们提供了完善的文档来帮助您快速上手：

### 🚀 入门指南
- **[快速开始指南](./docs/GETTING_STARTED.md)** - 环境设置和项目运行
- **[功能指南](./docs/FEATURES.md)** - 平台功能详细介绍和使用方法
- **[API 参考](./docs/API_REFERENCE.md)** - 详细的 API 文档和使用示例

### 🏗️ 技术文档
- **[项目架构](./docs/ARCHITECTURE.md)** - 技术架构和项目结构
- **[开发指南](./docs/DEVELOPMENT.md)** - 开发环境、工作流和贡献指南
- **[部署指南](./docs/DEPLOYMENT.md)** - 生产环境部署和配置

### 🔧 运维与安全
- **[性能与监控](./docs/PERFORMANCE_MONITORING.md)** - 性能优化和监控配置
- **[安全最佳实践](./docs/SECURITY.md)** - 安全配置和最佳实践
- **[故障排除指南](./docs/TROUBLESHOOTING.md)** - 常见问题和解决方案

## 🚀 快速开始

### 1. 环境准备
```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
```

### 2. 启动服务
```bash
# 一键启动所有服务
npm run dev
```

### 3. 访问应用
- **主应用**: http://localhost:3000
- **管理后台**: http://localhost:3001
- **API 服务**: http://localhost:8787
- **GraphQL Playground**: http://localhost:8787/graphql-playground

## 📊 功能状态

### ✅ 已完成 (生产就绪)
- **数据管理**: 动态数据建模、自动 CRUD API、高级查询支持
- **认证系统**: JWT 认证、用户管理、密码重置、令牌刷新
- **权限控制**: 基于角色的访问控制 (RBAC)、细粒度权限管理
- **API 服务**: RESTful API、GraphQL API、API 文档生成
- **数据库**: D1 数据库集成、迁移系统、关系管理
- **开发工具**: 完整 CLI 工具、开发环境、调试支持
- **CI/CD**: 自动化部署、多环境支持、安全扫描

### 🚧 开发中 (近期待发布)
- **实时通信**: WebSocket 服务、实时数据同步、消息推送
- **文件存储**: R2 存储集成、文件上传下载、元数据管理
- **工作流引擎**: 触发器系统、业务逻辑自动化、可视化设计器
- **前端优化**: 管理界面完善、用户体验提升、移动端适配

### 📅 计划中 (未来版本)
- **多租户**: 组织管理、资源隔离、计费系统
- **高级功能**: API 网关、数据分析报表、插件生态系统
- **企业集成**: SSO 集成、审计日志、合规支持
- **性能优化**: 缓存策略、CDN 集成、性能监控

## 🏗️ 技术栈

### 🚀 后端服务架构
- **运行时**: Cloudflare Workers (V8 JavaScript Engine)
- **Web 框架**: Hono (轻量级高性能 Web 框架)
- **GraphQL**: Apollo Server (灵活的 GraphQL 查询)
- **数据库**: D1 Database (分布式 SQLite 兼容数据库)
- **实时通信**: Durable Objects (毫秒级数据同步)
- **文件存储**: Cloudflare R2 (兼容 S3 的对象存储)
- **认证**: JWT (JSON Web Token) + SHA-256 密码哈希
- **工作流**: 自定义工作流引擎 (触发器和动作系统)

### 🎨 前端微服务架构
- **核心框架**: Vue 3 + Composition API + TypeScript
- **构建工具**: Vite (极速开发和构建)
- **微前端**: Qiankun (企业级微前端解决方案)
- **UI 框架**: Element Plus (企业级 UI 组件库)
- **样式系统**: UnoCSS (原子化 CSS 引擎)
- **表单引擎**: Formily (动态表单和验证)
- **状态管理**: Pinia (Vue 3 官方推荐状态管理)

### 🛠️ 开发与运维
- **类型系统**: TypeScript (全栈类型安全)
- **包管理**: npm (依赖管理和版本控制)
- **CI/CD**: GitHub Actions (自动化构建部署)
- **代码质量**: ESLint + Prettier (代码规范和格式化)
- **监控**: Cloudflare Analytics (性能和错误监控)
- **安全**: 依赖扫描 + 安全最佳实践

### 🔧 基础设施
- **边缘计算**: Cloudflare 全球网络
- **内容分发**: Cloudflare CDN
- **域名管理**: Cloudflare DNS
- **SSL 证书**: 自动 HTTPS 证书
- **防护系统**: DDoS 防护 + WAF 规则

## 🤝 贡献

欢迎开发者参与项目贡献！请参考我们的 [贡献指南](./docs/DEVELOPMENT.md)。

### 开发流程
1. Fork 项目并创建功能分支
2. 遵循项目代码规范和提交约定
3. 编写测试用例确保功能稳定
4. 提交 Pull Request 并描述变更内容

## 📞 支持与反馈

- **GitHub Issues**: [报告问题或请求功能](https://github.com/yuyichen/cf-nocode/issues)
- **文档**: 查看详细的使用指南和 API 文档
- **社区**: 参与技术讨论和问题解答

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**Built with ❤️ using Cloudflare Workers.**

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)](https://workers.cloudflare.com/)
[![Vue 3](https://img.shields.io/badge/Vue-3-green?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
