# 安全最佳实践

本文档详细介绍 Cloudflare Eco No-Code 平台的安全配置、最佳实践和合规要求。

## 🔐 安全架构概览

平台采用多层安全防护体系：

```
┌─────────────────────────────────────────────────────────────┐
│                    网络安全层                                │
│  Cloudflare CDN + DDoS Protection + WAF                    │
├─────────────────────────────────────────────────────────────┤
│                    应用安全层                                │
│  JWT 认证 + RBAC 权限 + 输入验证 + CORS                    │
├─────────────────────────────────────────────────────────────┤
│                    数据安全层                                │
│  数据库加密 + 传输加密 + 访问控制 + 审计日志                  │
├─────────────────────────────────────────────────────────────┤
│                    基础设施层                                │
│  Cloudflare Workers + D1 + R2 + Secrets Management          │
└─────────────────────────────────────────────────────────────┘
```

## 🛡️ 认证与授权

### JWT 认证配置

#### 1. 安全的 JWT 配置
```typescript
// server/api-worker/index.ts
app.use('/api/*', jwt({
  secret: async (c) => c.env.JWT_SECRET,
  alg: 'HS256',
  exp: 24 * 60 * 60, // 24小时过期
}));

// JWT 中间件
app.use('/api/*', async (c, next) => {
  const payload = c.get('jwtPayload');
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // 验证用户状态
  const user = await getUserById(payload.userId);
  if (!user || user.status !== 'active') {
    return c.json({ error: 'Account disabled' }, 401);
  }
  
  await next();
});
```

#### 2. 密码安全策略
```typescript
// 密码强度验证
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// 安全的密码哈希
import { createHash } from 'crypto';

function hashPassword(password: string, salt: string): string {
  return createHash('sha256')
    .update(password + salt)
    .digest('hex');
}
```

### 基于角色的访问控制 (RBAC)

#### 1. 权限模型
```typescript
// 权限定义
export interface Permission {
  id: string;
  module: string;
  action: string;
  resource?: string;
  description: string;
}

// 角色定义
export interface Role {
  id: string;
  name: string;
  code: string;
  permissions: string[];
}

// 检查权限的中间件
function requirePermission(module: string, action: string) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    const hasPermission = await checkUserPermission(user.id, module, action);
    
    if (!hasPermission) {
      return c.json({ 
        error: 'Insufficient permissions',
        required: `${module}:${action}`
      }, 403);
    }
    
    await next();
  };
}

// 使用示例
app.post('/api/models', requirePermission('models', 'create'), createModel);
app.get('/api/users', requirePermission('users', 'read'), getUsers);
```

#### 2. 默认角色和权限
```typescript
// 系统默认角色
export const DEFAULT_ROLES = {
  admin: {
    name: '管理员',
    permissions: ['*'] // 所有权限
  },
  editor: {
    name: '编辑者',
    permissions: [
      'models:create', 'models:read', 'models:update',
      'records:create', 'records:read', 'records:update',
      'files:upload', 'files:read'
    ]
  },
  viewer: {
    name: '查看者',
    permissions: [
      'models:read',
      'records:read',
      'files:read'
    ]
  }
};
```

## 🔒 API 安全

### 输入验证和清理

#### 1. 请求验证中间件
```typescript
import { body, validationResult } from 'express-validator';

// 通用验证中间件
function validateRequest(validations: any[]) {
  return async (c: Context, next: Next) => {
    // 解析请求体
    const body = await c.req.json();
    
    // 执行验证
    for (const validation of validations) {
      const result = await validation.run({ body });
      if (!result.isEmpty()) {
        return c.json({
          error: 'Validation failed',
          details: result.array()
        }, 400);
      }
    }
    
    await next();
  };
}

// 模型创建验证
app.post('/api/models', validateRequest([
  body('name')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-z_][a-z0-9_]*$/)
    .withMessage('Model name must be lowercase and alphanumeric'),
  body('label')
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
]), createModel);
```

#### 2. SQL 注入防护
```typescript
// 使用参数化查询
class CrudService {
  async getRecords(tableName: string, filters: Record<string, any>) {
    // 验证表名
    if (!isValidTableName(tableName)) {
      throw new Error('Invalid table name');
    }
    
    // 构建参数化查询
    const conditions: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(filters)) {
      if (isValidColumn(key)) {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    const query = `
      SELECT * FROM ${tableName} 
      ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;
    
    return this.db.prepare(query).bind(...values).all();
  }
}

// 表名和列名验证
function isValidTableName(name: string): boolean {
  return /^[a-z_][a-z0-9_]*$/.test(name);
}

function isValidColumn(name: string): boolean {
  return /^[a-z_][a-z0-9_]*$/.test(name);
}
```

### CORS 配置

```typescript
// 安全的 CORS 配置
app.use('/*', async (c, next) => {
  const origin = c.req.header('Origin');
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://admin.yourdomain.com',
    'https://app.yourdomain.com'
  ];
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400' // 24小时预检缓存
  };
  
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  await next();
  
  Object.entries(corsHeaders).forEach(([k, v]) => c.header(k, v));
});
```

### 速率限制

```typescript
// 简单的内存速率限制
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const now = Date.now();
    const key = `${clientIP}:${c.req.path}`;
    
    const current = rateLimiter.get(key);
    
    if (!current || now > current.resetTime) {
      rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
      return await next();
    }
    
    if (current.count >= maxRequests) {
      return c.json({
        error: 'Too many requests',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      }, 429);
    }
    
    current.count++;
    await next();
  };
}

// 应用速率限制
app.use('/api/auth/login', rateLimit(5, 15 * 60 * 1000)); // 5次/15分钟
app.use('/api/', rateLimit(1000, 60 * 1000)); // 1000次/分钟
```

## 📊 数据安全

### 数据库安全

#### 1. 数据库连接安全
```typescript
// wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "cf-nocode-db"
database_id = "your-database-id"

# 使用环境变量存储敏感信息
[vars]
JWT_SECRET = "@jwt_secret"
DB_ENCRYPTION_KEY = "@db_encryption_key"
```

#### 2. 敏感数据加密
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

class EncryptionService {
  private key: Buffer;
  
  constructor(key: string) {
    this.key = Buffer.from(key, 'hex');
  }
  
  encrypt(text: string): { encrypted: string; iv: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex')
    };
  }
  
  decrypt(encrypted: string, iv: string): string {
    const decipher = createDecipheriv('aes-256-cbc', this.key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

// 使用示例
const encryption = new EncryptionService(c.env.DB_ENCRYPTION_KEY);

// 存储敏感数据
const sensitiveData = encryption.encrypt(user.email);
await db.prepare(`
  INSERT INTO users (id, email_encrypted, email_iv) 
  VALUES (?, ?, ?)
`).bind(userId, sensitiveData.encrypted, sensitiveData.iv).run();
```

### 文件上传安全

```typescript
// 文件上传安全检查
app.post('/upload', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }
  
  // 文件大小检查
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return c.json({ error: 'File too large' }, 400);
  }
  
  // 文件类型检查
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf', 'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'File type not allowed' }, 400);
  }
  
  // 文件名安全检查
  const originalName = file.name;
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // 扫描文件内容（可选）
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // 检查恶意文件签名
  if (isMaliciousFile(buffer)) {
    return c.json({ error: 'Malicious file detected' }, 400);
  }
  
  // 上传到 R2
  const key = `uploads/${Date.now()}-${safeName}`;
  await c.env.R2_BUCKET.put(key, buffer, {
    httpMetadata: {
      contentType: file.type
    }
  });
  
  return c.json({
    success: true,
    key,
    originalName,
    size: file.size,
    type: file.type
  });
});

function isMaliciousFile(buffer: Buffer): boolean {
  // 检查常见的恶意文件签名
  const maliciousSignatures = [
    Buffer.from([0x4D, 0x5A]), // PE executable
    Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
    Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Java class
  ];
  
  return maliciousSignatures.some(sig => 
    buffer.slice(0, sig.length).equals(sig)
  );
}
```

## 🌐 网络安全

### HTTPS 强制

```typescript
// 强制 HTTPS
app.use('*', async (c, next) => {
  if (c.req.header('CF-Visitor')?.includes('"scheme":"https"') === false) {
    const httpsUrl = `https://${c.req.header('Host')}${c.req.url}`;
    return c.redirect(httpsUrl, 301);
  }
  await next();
});
```

### 安全头设置

```typescript
// 安全响应头
app.use('*', async (c, next) => {
  await next();
  
  // 基础安全头
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 内容安全策略
  c.header('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' wss:",
    "frame-ancestors 'none'"
  ].join('; '));
  
  // HSTS (仅在 HTTPS)
  if (c.req.url.startsWith('https://')) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
});
```

## 🔍 审计和监控

### 安全日志记录

```typescript
// 安全事件日志
interface SecurityEvent {
  timestamp: string;
  userId?: string;
  ip: string;
  userAgent: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  details?: Record<string, any>;
}

async function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
  const logEntry: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString()
  };
  
  // 存储到数据库
  await c.env.DB.prepare(`
    INSERT INTO security_logs (timestamp, user_id, ip, user_agent, action, resource, result, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    logEntry.timestamp,
    logEntry.userId || null,
    logEntry.ip,
    logEntry.userAgent,
    logEntry.action,
    logEntry.resource,
    logEntry.result,
    JSON.stringify(logEntry.details || {})
  ).run();
  
  // 发送到外部日志服务
  if (c.env.WEBHOOK_URL) {
    await fetch(c.env.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    });
  }
}

// 使用示例
app.post('/api/auth/login', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';
  const { email, password } = await c.req.json();
  
  try {
    const user = await authenticateUser(email, password);
    
    await logSecurityEvent({
      userId: user.id,
      ip,
      userAgent,
      action: 'login',
      resource: 'auth',
      result: 'success',
      details: { email }
    });
    
    return c.json({ token: generateJWT(user) });
    
  } catch (error) {
    await logSecurityEvent({
      ip,
      userAgent,
      action: 'login',
      resource: 'auth',
      result: 'failure',
      details: { email, error: error.message }
    });
    
    return c.json({ error: 'Invalid credentials' }, 401);
  }
});
```

### 安全监控仪表板

```typescript
// 安全统计端点
app.get('/api/security/stats', requirePermission('system', 'read'), async (c) => {
  const db = c.env.DB;
  
  const stats = await Promise.all([
    // 登录尝试统计
    db.prepare(`
      SELECT result, COUNT(*) as count 
      FROM security_logs 
      WHERE action = 'login' AND timestamp > datetime('now', '-24 hours')
      GROUP BY result
    `).all(),
    
    // 可疑 IP 统计
    db.prepare(`
      SELECT ip, COUNT(*) as failed_attempts
      FROM security_logs 
      WHERE action = 'login' AND result = 'failure' 
        AND timestamp > datetime('now', '-1 hour')
      GROUP BY ip 
      HAVING failed_attempts > 5
    `).all(),
    
    // 权限违规统计
    db.prepare(`
      SELECT COUNT(*) as violations
      FROM security_logs 
      WHERE action = 'access_denied' 
        AND timestamp > datetime('now', '-24 hours')
    `).first()
  ]);
  
  return c.json({
    loginAttempts: stats[0].results,
    suspiciousIPs: stats[1].results,
    accessViolations: stats[2].results?.violations || 0,
    timestamp: new Date().toISOString()
  });
});
```

## 🚨 威胁防护

### DDoS 防护配置

在 Cloudflare Dashboard 中配置：

1. **Basic DDoS Protection** (免费)
   - 自动流量分析
   - 攻击缓解
   - 全球分布

2. **Advanced DDoS Protection** (付费)
   - 实时流量分析
   - 自定义规则
   - API 保护

### Web 应用防火墙 (WAF)

```yaml
# Cloudflare WAF 规则示例
rules:
  - name: "SQL Injection Protection"
    expression: "http.request.uri.query contains \"SELECT\" || http.request.uri.query contains \"DROP\""
    action: "block"
  
  - name: "XSS Protection"
    expression: "http.request.body contains \"<script\" || http.request.body contains \"javascript:\""
    action: "block"
  
  - name: "Rate Limiting - Auth"
    expression: "(http.request.uri.path contains \"/api/auth\")"
    action: "rate_limit"
    rate_limit:
      period: 300
      requests_per_period: 10
```

### 入侵检测系统

```typescript
// 异常行为检测
class AnomalyDetector {
  private suspiciousPatterns = {
    rapidRequests: { threshold: 100, window: 60000 }, // 100次/分钟
    failedLogins: { threshold: 5, window: 300000 },   // 5次/5分钟
    unusualAccess: { threshold: 1000, window: 3600000 } // 1000次/小时
  };
  
  async detectAnomalies(ip: string, action: string): Promise<string[]> {
    const anomalies: string[] = [];
    const now = Date.now();
    
    // 检查快速请求
    const recentRequests = await this.countRecentActions(ip, '*', now - this.suspiciousPatterns.rapidRequests.window);
    if (recentRequests > this.suspiciousPatterns.rapidRequests.threshold) {
      anomalies.push('rapid_requests');
    }
    
    // 检查失败登录
    const failedLogins = await this.countRecentActions(ip, 'login_failure', now - this.suspiciousPatterns.failedLogins.window);
    if (failedLogins > this.suspiciousPatterns.failedLogins.threshold) {
      anomalies.push('failed_logins');
    }
    
    return anomalies;
  }
  
  private async countRecentActions(ip: string, action: string, since: number): Promise<number> {
    // 实现数据库查询逻辑
    return 0; // 占位符
  }
}

// 在中间件中使用
app.use('/api/*', async (c, next) => {
  const detector = new AnomalyDetector();
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  
  const anomalies = await detector.detectAnomalies(ip, c.req.method);
  
  if (anomalies.length > 0) {
    await logSecurityEvent({
      ip,
      userAgent: c.req.header('User-Agent') || 'unknown',
      action: 'anomaly_detected',
      resource: c.req.url,
      result: 'failure',
      details: { anomalies }
    });
    
    // 可以选择阻止请求或要求额外验证
    return c.json({ error: 'Suspicious activity detected' }, 429);
  }
  
  await next();
});
```

## 🔐 密钥管理

### 环境变量安全

```bash
# 使用 Wrangler secrets
wrangler secret put JWT_SECRET
# 输入: your-super-secure-jwt-secret

wrangler secret put DB_ENCRYPTION_KEY
# 输入: your-32-character-hex-encryption-key

wrangler secret put WEBHOOK_SECRET
# 输入: your-webhook-signing-secret

# 列出所有 secrets
wrangler secret list

# 删除 secret
wrangler secret delete OLD_SECRET
```

### API 密钥管理

```typescript
// API 密钥服务
class APIKeyService {
  private db: D1Database;
  
  constructor(db: D1Database) {
    this.db = db;
  }
  
  async createKey(userId: string, permissions: string[], expiresAt?: Date): Promise<string> {
    const keyId = crypto.randomUUID();
    const key = this.generateKey();
    const hashedKey = this.hashKey(key);
    
    await this.db.prepare(`
      INSERT INTO api_keys (id, user_id, hashed_key, permissions, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(keyId, userId, hashedKey, JSON.stringify(permissions), expiresAt?.toISOString(), new Date().toISOString()).run();
    
    return key;
  }
  
  async validateKey(key: string): Promise<{ userId: string; permissions: string[] } | null> {
    const hashedKey = this.hashKey(key);
    
    const result = await this.db.prepare(`
      SELECT user_id, permissions, expires_at 
      FROM api_keys 
      WHERE hashed_key = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).bind(hashedKey).first();
    
    if (!result) return null;
    
    return {
      userId: result.user_id,
      permissions: JSON.parse(result.permissions)
    };
  }
  
  private generateKey(): string {
    return `cf_nocode_${Buffer.from(crypto.randomUUID()).toString('base64').replace(/[+/=]/g, '')}`;
  }
  
  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}

// API 密钥认证中间件
function requireAPIKey(requiredPermission?: string) {
  return async (c: Context, next: Next) => {
    const apiKey = c.req.header('X-API-Key');
    
    if (!apiKey) {
      return c.json({ error: 'API key required' }, 401);
    }
    
    const keyService = new APIKeyService(c.env.DB);
    const keyData = await keyService.validateKey(apiKey);
    
    if (!keyData) {
      return c.json({ error: 'Invalid API key' }, 401);
    }
    
    if (requiredPermission && !keyData.permissions.includes(requiredPermission)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    c.set('apiKeyUser', keyData.userId);
    await next();
  };
}

// 使用示例
app.get('/api/data/:tableName', requireAPIKey('data:read'), async (c) => {
  // API 密钥认证的处理逻辑
});
```

## 📋 安全检查清单

### 部署前检查

- [ ] JWT 密钥强度足够 (至少 32 字符)
- [ ] 所有环境变量使用 Wrangler secrets
- [ ] HTTPS 强制启用
- [ ] CORS 配置正确
- [ ] 安全响应头配置
- [ ] 速率限制配置
- [ ] 输入验证和清理
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] 文件上传安全检查
- [ ] 错误处理不泄露敏感信息

### 运行时监控

- [ ] 安全事件日志记录
- [ ] 异常行为检测
- [ ] 定期安全扫描
- [ ] 依赖漏洞检查
- [ ] 访问日志审计
- [ ] 权限使用情况监控
- [ ] 数据访问模式分析

### 定期维护

- [ ] 密钥轮换（每 90 天）
- [ ] 安全策略更新
- [ ] 威胁情报更新
- [ ] 安全培训更新
- [ ] 应急响应演练
- [ ] 合规性检查

## 🚨 应急响应

### 安全事件响应流程

1. **检测** (Detection)
   - 自动监控告警
   - 人工安全审计
   - 第三方威胁情报

2. **分析** (Analysis)
   - 事件影响评估
   - 攻击向量分析
   - 数据泄露检查

3. **响应** (Response)
   - 立即阻断攻击
   - 隔离受影响系统
   - 通知相关人员

4. **恢复** (Recovery)
   - 系统修复加固
   - 数据恢复验证
   - 安全策略更新

5. **总结** (Post-mortem)
   - 事件报告编写
   - 改进措施制定
   - 预防策略优化

### 联系信息

```typescript
// 紧急联系配置
export const EMERGENCY_CONTACTS = {
  security_team: 'security@yourdomain.com',
  dev_team: 'dev@yourdomain.com',
  incident_manager: '+1-555-0123',
  cloudflare_support: 'https://www.cloudflare.com/support/'
};
```

## 📚 相关文档

- [API 参考](./API_REFERENCE.md) - 完整的 API 安全配置
- [部署指南](./DEPLOYMENT.md) - 生产环境部署安全
- [项目架构](./ARCHITECTURE.md) - 安全架构设计
- [性能监控](./PERFORMANCE_MONITORING.md) - 安全监控配置

---

**重要提醒**: 安全是持续的过程，不是一次性的配置。请定期审查和更新安全策略，确保系统始终处于受保护状态。