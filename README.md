# Cloudflare Eco No-Code Platform

一个基于 Cloudflare 生态系统构建的开源无代码平台，提供类似 Supabase 的功能，包括动态数据建模、自动化 RESTful/GraphQL API、以及可视化拖拽界面。

## ✨ 核心特性

- **🚀 动态数据建模**: 可视化创建和管理数据库表结构
- **🔧 自动化 API**: 自动生成 RESTful 和 GraphQL API
- **🔐 完整认证**: JWT 认证和用户管理系统
- **🎨 可视化设计**: PC 和移动端响应式拖拽布局
- **🔄 实时通信**: 基于 Durable Objects 的毫秒级数据同步
- **📁 文件存储**: 集成 Cloudflare R2 存储服务
- **⚙️ 工作流自动化**: 数据变更触发器和业务逻辑自动化

## 📚 文档

我们提供了完善的文档来帮助您快速上手：

### 入门指南
- **[快速开始指南](./docs/GETTING_STARTED.md)** - 环境设置和项目运行
- **[功能指南](./docs/FEATURES.md)** - 平台功能详细介绍和使用方法
- **[API 参考](./docs/API_REFERENCE.md)** - 详细的 API 文档和使用示例

### 开发文档
- **[项目架构](./docs/ARCHITECTURE.md)** - 技术架构和项目结构
- **[开发指南](./docs/DEVELOPMENT.md)** - 开发计划、路线图和贡献指南

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

### ✅ 已完成
- 动态数据建模和模型管理
- 自动化 RESTful API 生成
- JWT 认证和用户管理系统
- GraphQL API 支持
- 数据库迁移系统
- 多环境配置管理

### 🚧 开发中
- 实时通信系统 (WebSocket + Durable Objects)
- 文件存储服务 (R2 集成)
- 工作流自动化引擎
- 前端界面优化

### 📅 计划中
- 多租户支持
- API 网关和监控
- 数据分析和报表
- 插件系统

## 🏗️ 技术栈

### 后端
- **运行时**: Cloudflare Workers
- **框架**: Hono + Apollo Server
- **数据库**: D1 Database (SQLite)
- **存储**: R2 + Durable Objects
- **认证**: JWT + SHA-256 哈希

### 前端
- **框架**: Vue 3 + TypeScript
- **构建**: Vite
- **微前端**: Qiankun
- **UI 组件**: Element Plus + UnoCSS
- **表单**: Formily

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
