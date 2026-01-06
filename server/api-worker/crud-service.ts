import type { D1Database } from '@cloudflare/workers-types';

interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'unique' | 'custom';
  value?: any;
  message?: string;
}

interface FieldValidation {
  [fieldName: string]: ValidationRule[];
}

interface QueryBuilder {
  selects?: string[];
  where?: string;
  orderBy?: string;
  limit?: number;
  offset?: number;
  joins?: string[];
  groupBy?: string[];
  having?: string;
}

export class CrudService {
  constructor(private db: D1Database) {}

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

      const keys = Object.keys(finalData);
      const placeholders = Object.keys(finalData).map(() => '?').join(', ');
      const values = Object.values(finalData);

      const stmt = this.db.prepare(
        `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`
      ).bind(...values);

      const { success } = await stmt.run();
      return { success, id: success ? id : undefined };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async update(tableName: string, id: string, data: Record<string, any>): Promise<{ success: boolean; error?: string }> {
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

  async validateData(tableName: string, data: Record<string, any>, validationRules: FieldValidation): Promise<{ success: boolean; errors?: Record<string, string> }> {
    try {
      const errors: Record<string, string> = {};

      for (const [fieldName, rules] of Object.entries(validationRules)) {
        const value = data[fieldName];
        
        for (const rule of rules) {
          const error = this.validateField(value, rule, fieldName);
          if (error) {
            errors[fieldName] = error;
            break;
          }
        }
      }

      return {
        success: Object.keys(errors).length === 0,
        errors: Object.keys(errors).length > 0 ? errors : undefined
      };
    } catch (error: any) {
      return { success: false, errors: { validation: error.message } };
    }
  }

  private validateField(value: any, rule: ValidationRule, fieldName: string): string | null {
    switch (rule.type) {
      case 'required':
        return value === null || value === undefined || value === '' ? `${fieldName} is required` : null;
      
      case 'email':
        if (value && typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return !emailRegex.test(value) ? 'Invalid email format' : null;
        }
        return null;
      
      case 'min':
        if (typeof value === 'number' && rule.value !== undefined) {
          return value < rule.value ? `${fieldName} must be at least ${rule.value}` : null;
        }
        return null;
      
      case 'max':
        if (typeof value === 'number' && rule.value !== undefined) {
          return value > rule.value ? `${fieldName} must be at most ${rule.value}` : null;
        }
        return null;
      
      case 'pattern':
        if (typeof value === 'string' && rule.value) {
          const regex = new RegExp(rule.value);
          return !regex.test(value) ? `${fieldName} format is invalid` : null;
        }
        return null;
      
      case 'unique':
        return rule.message || 'Value must be unique';
      
      case 'custom':
        if (typeof rule.value === 'function') {
          return rule.value(value);
        }
        return rule.message || 'Validation failed';
      
      default:
        return null;
    }
  }

  async advancedQuery(tableName: string, builder: QueryBuilder): Promise<{ success: boolean; data?: any[]; total?: number; error?: string }> {
    try {
      let query = 'SELECT ';
      const params: any[] = [];

      if (builder.selects && builder.selects.length > 0) {
        query += builder.selects.join(', ');
      } else {
        query += '*';
      }

      query += ` FROM ${tableName}`;

      if (builder.joins && builder.joins.length > 0) {
        query += ' ' + builder.joins.join(' ');
      }

      if (builder.where) {
        query += ` WHERE ${builder.where}`;
      }

      if (builder.groupBy && builder.groupBy.length > 0) {
        query += ` GROUP BY ${builder.groupBy.join(', ')}`;
      }

      if (builder.having) {
        query += ` HAVING ${builder.having}`;
      }

      if (builder.orderBy) {
        query += ` ORDER BY ${builder.orderBy}`;
      }

      if (builder.limit !== undefined) {
        query += ' LIMIT ?';
        params.push(builder.limit);
      }

      if (builder.offset !== undefined) {
        query += ' OFFSET ?';
        params.push(builder.offset);
      }

      const { results } = await this.db.prepare(query).bind(...params).all();
      return {
        success: true,
        data: results || [],
        total: results ? results.length : 0
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async searchTable(tableName: string, searchTerm: string, searchFields: string[] = [], options: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}): Promise<{ success: boolean; data?: any[]; total?: number; error?: string }> {
    try {
      const { page = 1, pageSize = 20, sortBy = 'created_at', sortOrder = 'desc' } = options;
      
      let whereClause = '';
      const params: any[] = [];

      if (searchTerm && searchTerm.trim() !== '') {
        if (searchFields.length > 0) {
          const searchConditions = searchFields.map(field => `(${field} LIKE ?)`);
          whereClause = `(${searchConditions.join(' OR ')})`;
          searchFields.forEach(() => params.push(`%${searchTerm}%`));
        } else {
          whereClause = '(id LIKE ? OR created_at LIKE ? OR updated_at LIKE ?)';
          params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
        }
      }

      const offset = (page - 1) * pageSize;
      const query = `
        SELECT * FROM ${tableName} 
        ${whereClause ? 'WHERE ' + whereClause : ''}
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT ? OFFSET ?
      `;

      const { results } = await this.db.prepare(query).bind(...params).all();
      const totalCount = await this.db.prepare(`
        SELECT COUNT(*) as count FROM ${tableName} ${whereClause ? 'WHERE ' + whereClause : ''}
      `).bind(...params.slice(0, params.length > 3 ? 3 : params.length)).first() as any;

      return {
        success: true,
        data: results || [],
        total: totalCount?.count || 0
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async aggregateData(tableName: string, aggregation: { type: 'count' | 'sum' | 'avg' | 'min' | 'max'; field: string; groupBy?: string[] }, options: { where?: string; having?: string } = {}): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      let selectClause = '';
      
      switch (aggregation.type) {
        case 'count':
          selectClause = `COUNT(*) as ${aggregation.field}`;
          break;
        case 'sum':
          selectClause = `SUM(${aggregation.field}) as ${aggregation.field}`;
          break;
        case 'avg':
          selectClause = `AVG(${aggregation.field}) as ${aggregation.field}`;
          break;
        case 'min':
          selectClause = `MIN(${aggregation.field}) as ${aggregation.field}`;
          break;
        case 'max':
          selectClause = `MAX(${aggregation.field}) as ${aggregation.field}`;
          break;
      }

      let query = `SELECT ${selectClause} FROM ${tableName}`;
      const params: any[] = [];

      if (options.where) {
        query += ` WHERE ${options.where}`;
      }

      if (aggregation.groupBy && aggregation.groupBy.length > 0) {
        query += ` GROUP BY ${aggregation.groupBy.join(', ')}`;
      }

      if (options.having) {
        query += ` HAVING ${options.having}`;
      }

      const { results } = await this.db.prepare(query).bind(...params).all();
      return {
        success: true,
        data: results || []
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async exportData(tableName: string, options: { format?: 'json' | 'csv'; fields?: string[]; where?: string; orderBy?: string; limit?: number } = {}): Promise<{ success: boolean; data?: string | Blob; error?: string }> {
    try {
      const { format = 'json', fields, where, orderBy, limit } = options;
      
      let query = `SELECT ${fields && fields.length > 0 ? fields.join(', ') : '*'} FROM ${tableName}`;
      const params: any[] = [];

      if (where) {
        query += ` WHERE ${where}`;
      }

      if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
      }

      if (limit) {
        query += ` LIMIT ${limit}`;
      }

      const { results } = await this.db.prepare(query).bind(...params).all();
      const data = results || [];

      switch (format) {
        case 'json':
          return {
            success: true,
            data: JSON.stringify(data, null, 2)
          };
        
        case 'csv':
          const csv = this.convertToCSV(data, fields);
          return {
            success: true,
            data: csv
          };
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private convertToCSV(data: any[], fields?: string[]): string {
    if (data.length === 0) return '';
    
    const headers = fields || Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return String(value);
        }).join(',')
      )
    ].join('\n');
    
    return csv;
  }
}