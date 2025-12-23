import type { D1Database } from '@cloudflare/workers-types';

export interface ModelField {
  id: string;
  model_id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'relation';
  required: boolean;
  unique_key: boolean;
  default_value?: string;
  validation_rules?: Record<string, any>;
}

export interface Model {
  id: string;
  name: string;
  label: string;
  description?: string;
  created_at: string;
  updated_at: string;
  fields?: ModelField[];
}

export class ModelService {
  constructor(private db: D1Database) {}

  // 获取所有模型
  async getAllModels(): Promise<Model[]> {
    const { results } = await this.db.prepare('SELECT * FROM models ORDER BY created_at DESC').all();
    return (results || []) as unknown as Model[];
  }

  // 获取单个模型及其字段
  async getModelById(id: string): Promise<Model | null> {
    const model = await this.db.prepare('SELECT * FROM models WHERE id = ?').bind(id).first() as unknown as Model | null;
    if (!model) return null;

    // 使用更兼容的查询，不依赖created_at字段
    const { results: fields } = await this.db
      .prepare('SELECT * FROM fields WHERE model_id = ? ORDER BY name')
      .bind(id)
      .all();

    return {
      ...model,
      fields: (fields || []) as unknown as ModelField[]
    };
  }

  // 创建新模型
  async createModel(data: Omit<Model, 'id' | 'created_at' | 'updated_at'>): Promise<Model> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(
      'INSERT INTO models (id, name, label, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, data.name, data.label, data.description || null, now, now).run();

    return {
      id,
      name: data.name,
      label: data.label,
      description: data.description,
      created_at: now,
      updated_at: now
    };
  }

  // 更新模型
  async updateModel(id: string, data: Partial<Omit<Model, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.label !== undefined) {
      updates.push('label = ?');
      values.push(data.label);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }

    if (updates.length === 0) return false;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(
      `UPDATE models SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values);

    const { success } = await stmt.run();
    return success;
  }

  // 删除模型
  async deleteModel(id: string): Promise<boolean> {
    // 先删除关联的字段
    await this.db.prepare('DELETE FROM fields WHERE model_id = ?').bind(id).run();
    
    // 删除模型
    const { success } = await this.db.prepare('DELETE FROM models WHERE id = ?').bind(id).run();
    return success;
  }

  // 添加字段到模型
  async addField(modelId: string, field: Omit<ModelField, 'id' | 'model_id'>): Promise<ModelField> {
    const id = crypto.randomUUID();
    
    await this.db.prepare(
      'INSERT INTO fields (id, model_id, name, label, type, required, unique_key, default_value, validation_rules) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      modelId,
      field.name,
      field.label,
      field.type,
      field.required ? 1 : 0,
      field.unique_key ? 1 : 0,
      field.default_value || null,
      field.validation_rules ? JSON.stringify(field.validation_rules) : null
    ).run();

    return {
      id,
      model_id: modelId,
      ...field
    };
  }

  // 更新字段
  async updateField(id: string, updates: Partial<Omit<ModelField, 'id' | 'model_id'>>): Promise<boolean> {
    const fieldUpdates: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fieldUpdates.push('name = ?');
      values.push(updates.name);
    }
    if (updates.label !== undefined) {
      fieldUpdates.push('label = ?');
      values.push(updates.label);
    }
    if (updates.type !== undefined) {
      fieldUpdates.push('type = ?');
      values.push(updates.type);
    }
    if (updates.required !== undefined) {
      fieldUpdates.push('required = ?');
      values.push(updates.required ? 1 : 0);
    }
    if (updates.unique_key !== undefined) {
      fieldUpdates.push('unique_key = ?');
      values.push(updates.unique_key ? 1 : 0);
    }
    if (updates.default_value !== undefined) {
      fieldUpdates.push('default_value = ?');
      values.push(updates.default_value);
    }
    if (updates.validation_rules !== undefined) {
      fieldUpdates.push('validation_rules = ?');
      values.push(JSON.stringify(updates.validation_rules));
    }

    if (fieldUpdates.length === 0) return false;

    values.push(id);
    const stmt = this.db.prepare(
      `UPDATE fields SET ${fieldUpdates.join(', ')} WHERE id = ?`
    ).bind(...values);

    const { success } = await stmt.run();
    return success;
  }

  // 删除字段
  async deleteField(id: string): Promise<boolean> {
    const { success } = await this.db.prepare('DELETE FROM fields WHERE id = ?').bind(id).run();
    return success;
  }

  // 根据模型定义生成CREATE TABLE SQL
  generateCreateTableSQL(modelName: string, fields: ModelField[]): string {
    const columns = [
      'id TEXT PRIMARY KEY',
      'created_at DATETIME DEFAULT CURRENT_TIMESTAMP',
      'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP'
    ];

    fields.forEach(field => {
      let columnDef = `${field.name} ${this.mapFieldTypeToSQL(field.type)}`;
      
      if (field.required) {
        columnDef += ' NOT NULL';
      }
      
      if (field.unique_key) {
        columnDef += ' UNIQUE';
      }
      
      if (field.default_value !== undefined && field.default_value !== null) {
        columnDef += ` DEFAULT '${field.default_value}'`;
      }

      columns.push(columnDef);
    });

    return `CREATE TABLE IF NOT EXISTS ${modelName} (\n  ${columns.join(',\n  ')}\n);`;
  }

  // 字段类型映射到SQL类型
  private mapFieldTypeToSQL(type: ModelField['type']): string {
    const typeMap: Record<ModelField['type'], string> = {
      text: 'TEXT',
      number: 'REAL',
      boolean: 'INTEGER',
      date: 'DATE',
      datetime: 'DATETIME',
      relation: 'TEXT' // 存储关联ID
    };
    return typeMap[type];
  }

  // 执行动态表创建
  async createDynamicTable(modelName: string, fields: ModelField[]): Promise<boolean> {
    try {
      const sql = this.generateCreateTableSQL(modelName, fields);
      // 使用prepare和run而不是exec来避免D1 API错误
      await this.db.prepare(sql).run();
      return true;
    } catch (error) {
      console.error('Failed to create dynamic table:', error);
      return false;
    }
  }
}
