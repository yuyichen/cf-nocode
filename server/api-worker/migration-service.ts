import { D1Database } from '@cloudflare/workers-types';
import * as crypto from 'crypto';

export interface Migration {
  version: string;
  name: string;
  up: string;
  down: string;
  checksum: string;
}

export class MigrationService {
  constructor(private db: D1Database) {}

  /**
   * 初始化迁移系统
   */
  async initialize(): Promise<boolean> {
    try {
      // 检查migrations表是否存在
      const tableExists = await this.db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'")
        .first();

      if (!tableExists) {
        // 创建迁移表 - 使用单独的语句避免exec问题
        await this.db.prepare(`
          CREATE TABLE migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            checksum TEXT NOT NULL
          )
        `).run();
        
        // 创建索引
        await this.db.prepare(`
          CREATE INDEX idx_migrations_version ON migrations(version)
        `).run();
        
        console.log('Migration system initialized');
      }
      return true;
    } catch (error) {
      console.error('Failed to initialize migration system:', error);
      return false;
    }
  }

  /**
   * 获取已应用的迁移
   */
  async getAppliedMigrations(): Promise<{ version: string; name: string; applied_at: string; checksum: string }[]> {
    try {
      const result = await this.db
        .prepare('SELECT version, name, applied_at, checksum FROM migrations ORDER BY version')
        .all();
      return result.results as any[];
    } catch (error) {
      console.error('Failed to get applied migrations:', error);
      return [];
    }
  }

  /**
   * 计算SQL内容的校验和
   */
  calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 解析迁移文件
   */
  parseMigrationFile(content: string): { up: string; down: string } {
    const lines = content.split('\n');
    let upSection = '';
    let downSection = '';
    let currentSection: 'up' | 'down' | null = null;

    for (const line of lines) {
      if (line.includes('-- Up migration')) {
        currentSection = 'up';
        continue;
      } else if (line.includes('-- Down migration')) {
        currentSection = 'down';
        continue;
      }

      if (currentSection === 'up') {
        upSection += line + '\n';
      } else if (currentSection === 'down') {
        downSection += line + '\n';
      }
    }

    return {
      up: upSection.trim(),
      down: downSection.trim()
    };
  }

  /**
   * 应用单个迁移
   */
  async applyMigration(version: string, name: string, upSQL: string, checksum: string): Promise<boolean> {
    try {
      // 开始事务
      await this.db.exec('BEGIN TRANSACTION');

      try {
        // 执行迁移SQL
        const statements = upSQL.split(';').filter(stmt => stmt.trim().length > 0);
        for (const statement of statements) {
          if (statement.trim()) {
            await this.db.exec(statement);
          }
        }

        // 记录迁移
        await this.db
          .prepare('INSERT INTO migrations (version, name, checksum) VALUES (?, ?, ?)')
          .bind(version, name, checksum)
          .run();

        // 提交事务
        await this.db.exec('COMMIT');
        console.log(`Applied migration: ${version} - ${name}`);
        return true;
      } catch (error) {
        // 回滚事务
        await this.db.exec('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Failed to apply migration ${version}:`, error);
      return false;
    }
  }

  /**
   * 回滚单个迁移
   */
  async rollbackMigration(version: string, downSQL: string): Promise<boolean> {
    try {
      // 开始事务
      await this.db.exec('BEGIN TRANSACTION');

      try {
        // 执行回滚SQL
        const statements = downSQL.split(';').filter(stmt => stmt.trim().length > 0);
        for (const statement of statements) {
          if (statement.trim()) {
            await this.db.exec(statement);
          }
        }

        // 删除迁移记录
        await this.db
          .prepare('DELETE FROM migrations WHERE version = ?')
          .bind(version)
          .run();

        // 提交事务
        await this.db.exec('COMMIT');
        console.log(`Rolled back migration: ${version}`);
        return true;
      } catch (error) {
        // 回滚事务
        await this.db.exec('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Failed to rollback migration ${version}:`, error);
      return false;
    }
  }

  /**
   * 检查迁移状态
   */
  async checkStatus(): Promise<{
    initialized: boolean;
    appliedMigrations: number;
    pendingMigrations: number;
    details: Array<{ version: string; name: string; status: 'applied' | 'pending' }>;
  }> {
    try {
      const applied = await this.getAppliedMigrations();
      const allMigrations = await this.discoverMigrations();
      
      const details: Array<{ version: string; name: string; status: 'applied' | 'pending' }> = allMigrations.map(migration => {
        const appliedMigration = applied.find(m => m.version === migration.version);
        return {
          version: migration.version,
          name: migration.name,
          status: appliedMigration ? 'applied' : 'pending'
        };
      });

      return {
        initialized: true,
        appliedMigrations: applied.length,
        pendingMigrations: allMigrations.length - applied.length,
        details
      };
    } catch (error) {
      console.error('Failed to check migration status:', error);
      return {
        initialized: false,
        appliedMigrations: 0,
        pendingMigrations: 0,
        details: []
      };
    }
  }

  /**
   * 发现所有迁移文件
   */
  async discoverMigrations(): Promise<Array<{ version: string; name: string; path: string }>> {
    // 这是一个简化版本，实际实现需要读取文件系统
    // 这里返回硬编码的迁移文件列表
    return [
      { version: '001', name: 'create_migration_table', path: 'migrations/001_create_migration_table.sql' },
      { version: '002', name: 'create_metadata_tables', path: 'migrations/002_create_metadata_tables.sql' }
    ];
  }
}
