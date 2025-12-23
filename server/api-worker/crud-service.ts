import type { D1Database } from '@cloudflare/workers-types';

export class CrudService {
  constructor(private db: D1Database) {}

  // 获取数据列表（支持分页、过滤、排序）
  async getList(
    tableName: string,
    options: {
      page?: number;
      pageSize?: number;
      filters?: Record<string, any>;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ data: any[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 20, filters = {}, sortBy = 'created_at', sortOrder = 'desc' } = options;

    // 构建WHERE子句
    const whereConditions: string[] = [];
    const values: any[] = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && value.includes('%')) {
          whereConditions.push(`${key} LIKE ?`);
          values.push(value);
        } else {
          whereConditions.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取总数
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`)
      .bind(...values)
      .first();
    const total = (countResult as any)?.total || 0;

    // 计算分页
    const offset = (page - 1) * pageSize;

    // 获取数据
    const { results } = await this.db
      .prepare(
        `SELECT * FROM ${tableName} ${whereClause} ORDER BY ${sortBy} ${sortOrder.toUpperCase()} LIMIT ? OFFSET ?`
      )
      .bind(...values, pageSize, offset)
      .all();

    return {
      data: (results || []) as unknown as any[],
      total,
      page,
      pageSize
    };
  }

  // 获取单条数据
  async getById(tableName: string, id: string): Promise<any | null> {
    const result = await this.db
      .prepare(`SELECT * FROM ${tableName} WHERE id = ?`)
      .bind(id)
      .first();
    return result as unknown as any | null;
  }

  // 创建数据
  async create(tableName: string, data: Record<string, any>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const finalData = {
        id,
        ...data,
        created_at: now,
        updated_at: now
      };

      const keys = Object.keys(finalData).join(', ');
      const placeholders = Object.keys(finalData).map(() => '?').join(', ');
      const values = Object.values(finalData);

      const stmt = this.db.prepare(
        `INSERT INTO ${tableName} (${keys}) VALUES (${placeholders})`
      ).bind(...values);

      const { success } = await stmt.run();
      return { success, id: success ? id : undefined };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // 更新数据
  async update(
    tableName: string,
    id: string,
    data: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at') {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (updates.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      const stmt = this.db.prepare(
        `UPDATE ${tableName} SET ${updates.join(', ')} WHERE id = ?`
      ).bind(...values);

      const { success } = await stmt.run();
      return { success, error: success ? undefined : 'Update failed' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // 删除数据
  async delete(tableName: string, id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { success } = await this.db
        .prepare(`DELETE FROM ${tableName} WHERE id = ?`)
        .bind(id)
        .run();
      return { success, error: success ? undefined : 'Delete failed' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // 批量删除
  async batchDelete(tableName: string, ids: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      if (ids.length === 0) {
        return { success: false, error: 'No IDs provided' };
      }

      const placeholders = ids.map(() => '?').join(', ');
      const { success } = await this.db
        .prepare(`DELETE FROM ${tableName} WHERE id IN (${placeholders})`)
        .bind(...ids)
        .run();
      return { success, error: success ? undefined : 'Batch delete failed' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
