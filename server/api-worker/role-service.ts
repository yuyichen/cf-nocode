import type { D1Database } from '@cloudflare/workers-types';

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string | null;
  parent_id: string | null;
  user_count: number;
  permission_count: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  module: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  created_at: string;
}

export class RoleService {
  constructor(private db: D1Database) {}

  // 初始化角色权限表
  async initializeSchema(): Promise<boolean> {
    try {
      console.log('Starting role schema initialization...');
      
      // 先删除现有表（如果存在）
      console.log('Dropping existing tables...');
      try {
        await this.db.exec("DROP TABLE IF EXISTS user_roles");
        await this.db.exec("DROP TABLE IF EXISTS role_permissions");
        await this.db.exec("DROP TABLE IF EXISTS permissions");
        await this.db.exec("DROP TABLE IF EXISTS roles");
        console.log('Existing tables dropped.');
      } catch (dropError) {
        console.log('Error dropping tables (may not exist):', dropError);
      }
      
      // 创建roles表 - 使用单行SQL避免格式问题
      console.log('Creating roles table...');
      await this.db.exec("CREATE TABLE roles (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, code TEXT NOT NULL UNIQUE, description TEXT, parent_id TEXT, user_count INTEGER DEFAULT 0, permission_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
      console.log('Roles table created.');

      // 创建permissions表
      console.log('Creating permissions table...');
      await this.db.exec("CREATE TABLE permissions (id TEXT PRIMARY KEY, module TEXT NOT NULL, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
      console.log('Permissions table created.');

      // 创建role_permissions表
      console.log('Creating role_permissions table...');
      await this.db.exec("CREATE TABLE role_permissions (role_id TEXT NOT NULL, permission_id TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (role_id, permission_id))");
      console.log('Role_permissions table created.');

      // 创建user_roles表
      console.log('Creating user_roles table...');
      await this.db.exec("CREATE TABLE user_roles (user_id TEXT NOT NULL, role_id TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id, role_id))");
      console.log('User_roles table created.');

      // 插入默认权限数据
      console.log('Seeding default permissions...');
      await this.seedDefaultPermissions();
      console.log('Default permissions seeded successfully.');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize role schema:', error);
      console.error('Error details:', String(error));
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      return false;
    }
  }

  // 插入默认权限数据
  private async seedDefaultPermissions(): Promise<void> {
    try {
      console.log('Starting to seed default permissions...');
      
      const defaultPermissions = [
        // 仪表盘模块
        { module: 'dashboard', name: '查看仪表盘', code: 'dashboard:view', description: '查看仪表盘数据' },
        { module: 'dashboard', name: '导出数据', code: 'dashboard:export', description: '导出仪表盘数据' },
        
        // 数据模型模块
        { module: 'models', name: '查看模型', code: 'models:view', description: '查看数据模型' },
        { module: 'models', name: '创建模型', code: 'models:create', description: '创建新的数据模型' },
        { module: 'models', name: '编辑模型', code: 'models:edit', description: '编辑现有数据模型' },
        { module: 'models', name: '删除模型', code: 'models:delete', description: '删除数据模型' },
        
        // 数据记录模块
        { module: 'records', name: '查看记录', code: 'records:view', description: '查看数据记录' },
        { module: 'records', name: '创建记录', code: 'records:create', description: '创建新的数据记录' },
        { module: 'records', name: '编辑记录', code: 'records:edit', description: '编辑现有数据记录' },
        { module: 'records', name: '删除记录', code: 'records:delete', description: '删除数据记录' },
        { module: 'records', name: '导出记录', code: 'records:export', description: '导出数据记录' },
        
        // API管理模块
        { module: 'api', name: '查看 API', code: 'api:view', description: '查看API文档' },
        { module: 'api', name: '测试 API', code: 'api:test', description: '测试API接口' },
        { module: 'api', name: '管理 API', code: 'api:manage', description: '管理API配置' },
        
        // 用户管理模块
        { module: 'users', name: '查看用户', code: 'users:view', description: '查看用户列表' },
        { module: 'users', name: '创建用户', code: 'users:create', description: '创建新用户' },
        { module: 'users', name: '编辑用户', code: 'users:edit', description: '编辑用户信息' },
        { module: 'users', name: '删除用户', code: 'users:delete', description: '删除用户' },
        
        // 角色管理模块
        { module: 'roles', name: '查看角色', code: 'roles:view', description: '查看角色列表' },
        { module: 'roles', name: '创建角色', code: 'roles:create', description: '创建新角色' },
        { module: 'roles', name: '编辑角色', code: 'roles:edit', description: '编辑角色信息' },
        { module: 'roles', name: '删除角色', code: 'roles:delete', description: '删除角色' },
        { module: 'roles', name: '分配权限', code: 'roles:assign', description: '为角色分配权限' },
        
        // 系统设置模块
        { module: 'system', name: '系统配置', code: 'system:config', description: '管理系统配置' }
      ];

      console.log(`Total default permissions: ${defaultPermissions.length}`);

      // 存储权限ID映射（code -> id）
      const permissionIdMap: Record<string, string> = {};

      // 插入或获取权限
      for (const perm of defaultPermissions) {
        console.log(`Processing permission: ${perm.code}`);
        
        let existing = await this.db.prepare(
          'SELECT id FROM permissions WHERE code = ?'
        ).bind(perm.code).first() as { id: string } | null;

        if (!existing) {
          console.log(`Permission ${perm.code} does not exist, creating...`);
          const id = crypto.randomUUID();
          await this.db.prepare(
            'INSERT INTO permissions (id, module, name, code, description) VALUES (?, ?, ?, ?, ?)'
          ).bind(id, perm.module, perm.name, perm.code, perm.description || null).run();
          permissionIdMap[perm.code] = id;
          console.log(`Created permission ${perm.code} with ID: ${id}`);
        } else {
          permissionIdMap[perm.code] = existing.id;
          console.log(`Permission ${perm.code} already exists with ID: ${existing.id}`);
        }
      }

      console.log('Permission ID map:', permissionIdMap);

      // 插入默认角色
      const defaultRoles = [
        {
          name: '管理员',
          code: 'admin',
          description: '系统管理员，拥有所有权限',
          permissionCodes: defaultPermissions.map(p => p.code) // 所有权限
        },
        {
          name: '编辑者',
          code: 'editor',
          description: '内容编辑者，可以创建和编辑内容',
          permissionCodes: defaultPermissions.slice(0, 16).map(p => p.code) // 前16个权限
        },
        {
          name: '查看者',
          code: 'viewer',
          description: '内容查看者，只能查看内容',
          permissionCodes: defaultPermissions.slice(0, 8).map(p => p.code) // 前8个权限
        }
      ];

      for (const roleData of defaultRoles) {
        console.log(`Processing role: ${roleData.code}`);
        
        const existingRole = await this.db.prepare(
          'SELECT id FROM roles WHERE code = ?'
        ).bind(roleData.code).first() as { id: string } | null;

        if (!existingRole) {
          console.log(`Role ${roleData.code} does not exist, creating...`);
          const roleId = crypto.randomUUID();
          await this.db.prepare(
            'INSERT INTO roles (id, name, code, description, permission_count) VALUES (?, ?, ?, ?, ?)'
          ).bind(roleId, roleData.name, roleData.code, roleData.description, roleData.permissionCodes.length).run();
          console.log(`Created role ${roleData.code} with ID: ${roleId}`);

          // 为角色分配权限
          console.log(`Assigning ${roleData.permissionCodes.length} permissions to role ${roleData.code}`);
          for (const permCode of roleData.permissionCodes) {
            const permissionId = permissionIdMap[permCode];
            if (permissionId) {
              await this.db.prepare(
                'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)'
              ).bind(roleId, permissionId).run();
              console.log(`Assigned permission ${permCode} to role ${roleData.code}`);
            } else {
              console.warn(`Permission ID not found for code: ${permCode}`);
            }
          }
        } else {
          console.log(`Role ${roleData.code} already exists with ID: ${existingRole.id}`);
        }
      }

      console.log('Default permissions seeding completed successfully.');
    } catch (error) {
      console.error('Error in seedDefaultPermissions:', error);
      console.error('Error details:', String(error));
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  // 获取所有角色
  async getAllRoles(): Promise<Role[]> {
    try {
      const result = await this.db.prepare(`
        SELECT r.*, 
               COUNT(DISTINCT ur.user_id) as user_count,
               COUNT(DISTINCT rp.permission_id) as permission_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        GROUP BY r.id
        ORDER BY r.created_at DESC
      `).all();

      return (result.results || []) as unknown as Role[];
    } catch (error) {
      console.error('Failed to get roles:', error);
      return [];
    }
  }

  // 获取单个角色
  async getRoleById(id: string): Promise<Role | null> {
    try {
      const role = await this.db.prepare(`
        SELECT r.*, 
               COUNT(DISTINCT ur.user_id) as user_count,
               COUNT(DISTINCT rp.permission_id) as permission_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        WHERE r.id = ?
        GROUP BY r.id
      `).bind(id).first();

      return role as Role | null;
    } catch (error) {
      console.error('Failed to get role:', error);
      return null;
    }
  }

  // 创建角色
  async createRole(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at' | 'user_count' | 'permission_count'>): Promise<Role | null> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.db.prepare(
        'INSERT INTO roles (id, name, code, description, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(id, roleData.name, roleData.code, roleData.description, roleData.parent_id, now, now).run();

      return await this.getRoleById(id);
    } catch (error) {
      console.error('Failed to create role:', error);
      return null;
    }
  }

  // 更新角色
  async updateRole(id: string, roleData: Partial<Role>): Promise<boolean> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (roleData.name !== undefined) {
        updates.push('name = ?');
        values.push(roleData.name);
      }
      if (roleData.description !== undefined) {
        updates.push('description = ?');
        values.push(roleData.description);
      }
      if (roleData.parent_id !== undefined) {
        updates.push('parent_id = ?');
        values.push(roleData.parent_id);
      }

      if (updates.length === 0) {
        return true;
      }

      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      const query = `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`;
      await this.db.prepare(query).bind(...values).run();

      return true;
    } catch (error) {
      console.error('Failed to update role:', error);
      return false;
    }
  }

  // 删除角色
  async deleteRole(id: string): Promise<boolean> {
    try {
      // 检查是否有用户使用此角色
      const userCount = await this.db.prepare(
        'SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?'
      ).bind(id).first() as any;

      if (userCount?.count > 0) {
        throw new Error('该角色下还有用户，无法删除');
      }

      await this.db.prepare('DELETE FROM roles WHERE id = ?').bind(id).run();
      return true;
    } catch (error) {
      console.error('Failed to delete role:', error);
      throw error;
    }
  }

  // 获取所有权限
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const result = await this.db.prepare(
        'SELECT * FROM permissions ORDER BY module, name'
      ).all();

      return (result.results || []) as unknown as Permission[];
    } catch (error) {
      console.error('Failed to get permissions:', error);
      return [];
    }
  }

  // 获取角色的权限
  async getRolePermissions(roleId: string): Promise<string[]> {
    try {
      const result = await this.db.prepare(
        'SELECT permission_id FROM role_permissions WHERE role_id = ?'
      ).bind(roleId).all();

      return (result.results || []).map((r: any) => r.permission_id);
    } catch (error) {
      console.error('Failed to get role permissions:', error);
      return [];
    }
  }

  // 更新角色权限 - 支持权限ID或权限代码
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<boolean> {
    try {
      console.log(`Updating permissions for role ${roleId}:`, permissions);
      
      // 验证角色是否存在
      const role = await this.db.prepare('SELECT id FROM roles WHERE id = ?').bind(roleId).first();
      if (!role) {
        console.error(`Role ${roleId} not found`);
        return false;
      }

      // 判断permissions是权限ID还是权限代码
      // 如果看起来像UUID（包含连字符），则认为是权限ID
      // 否则认为是权限代码
      const isLikelyUuid = permissions.length > 0 && permissions[0].includes('-');
      
      let permissionIds: string[] = [];
      
      if (isLikelyUuid) {
        // 输入的是权限ID，直接使用
        permissionIds = permissions;
      } else {
        // 输入的是权限代码，需要转换为权限ID
        console.log('Converting permission codes to IDs:', permissions);
        const placeholders = permissions.map(() => '?').join(',');
        const permissionResults = await this.db.prepare(
          `SELECT id FROM permissions WHERE code IN (${placeholders})`
        ).bind(...permissions).all();
        
        permissionIds = permissionResults.results.map((r: any) => r.id);
        
        if (permissionIds.length !== permissions.length) {
          console.error(`Some permissions not found. Expected ${permissions.length}, found ${permissionIds.length}`);
          return false;
        }
      }

      console.log('Final permission IDs:', permissionIds);

      // 验证权限是否存在
      if (permissionIds.length > 0) {
        const placeholders = permissionIds.map(() => '?').join(',');
        const permissionCheck = await this.db.prepare(
          `SELECT id FROM permissions WHERE id IN (${placeholders})`
        ).bind(...permissionIds).all();
        
        if (permissionCheck.results.length !== permissionIds.length) {
          console.error(`Some permission IDs not found. Expected ${permissionIds.length}, found ${permissionCheck.results.length}`);
          return false;
        }
      }

      // 不使用事务，直接执行操作
      console.log('Deleting existing permissions...');
      await this.db.prepare('DELETE FROM role_permissions WHERE role_id = ?').bind(roleId).run();

      console.log('Inserting new permissions...');
      for (const permId of permissionIds) {
        await this.db.prepare(
          'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)'
        ).bind(roleId, permId).run();
      }

      // 更新角色的权限计数
      console.log('Updating role permission count...');
      await this.db.prepare(
        'UPDATE roles SET permission_count = ?, updated_at = ? WHERE id = ?'
      ).bind(permissionIds.length, new Date().toISOString(), roleId).run();

      console.log('Permissions updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update role permissions:', error);
      console.error('Error details:', String(error));
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      return false;
    }
  }

  // 获取按模块分组的权限
  async getPermissionsByModule(): Promise<Record<string, Permission[]>> {
    try {
      const permissions = await this.getAllPermissions();
      const grouped: Record<string, Permission[]> = {};

      for (const perm of permissions) {
        if (!grouped[perm.module]) {
          grouped[perm.module] = [];
        }
        grouped[perm.module].push(perm);
      }

      return grouped;
    } catch (error) {
      console.error('Failed to group permissions:', error);
      return {};
    }
  }
}
