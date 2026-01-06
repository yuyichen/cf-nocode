interface WorkflowTrigger {
  id: string;
  name: string;
  type: 'data_change' | 'schedule' | 'webhook' | 'manual';
  config: Record<string, any>;
  conditions: Record<string, any>;
  workflowId: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowAction {
  id: string;
  type: 'email' | 'webhook' | 'data_update' | 'script' | 'notification';
  config: Record<string, any>;
  workflowId: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'paused';
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  triggerData: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Record<string, any>;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

export class WorkflowService {
  constructor(private db: any) {}

  async createWorkflow(workflow: any, userId: string): Promise<{ success: boolean; workflow?: Workflow; error?: string }> {
    try {
      const workflowId = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.db.prepare(`
        INSERT INTO workflows (
          id, name, description, status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        workflowId,
        workflow.name,
        workflow.description,
        workflow.status || 'inactive',
        userId,
        now,
        now
      ).run();

      const workflowRecord: Workflow = {
        id: workflowId,
        name: workflow.name,
        description: workflow.description,
        status: workflow.status || 'inactive',
        triggers: [],
        actions: [],
        createdBy: userId,
        createdAt: now,
        updatedAt: now
      };

      return { success: true, workflow: workflowRecord };
    } catch (error: any) {
      console.error('Create workflow error:', error);
      return { success: false, error: error.message };
    }
  }

  async getWorkflows(userId?: string): Promise<{ success: boolean; workflows?: Workflow[]; error?: string }> {
    try {
      let query = 'SELECT * FROM workflows';
      const params: any[] = [];

      if (userId) {
        query += ' WHERE created_by = ?';
        params.push(userId);
      }

      query += ' ORDER BY created_at DESC';

      const { results } = await this.db.prepare(query).bind(...params).all();
      const workflows: Workflow[] = (results || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status,
        triggers: [],
        actions: [],
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return { success: true, workflows };
    } catch (error: any) {
      console.error('Get workflows error:', error);
      return { success: false, error: error.message };
    }
  }

  async executeWorkflow(workflowId: string, triggerData: Record<string, any>): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const executionId = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.db.prepare(`
        INSERT INTO workflow_executions (
          id, workflow_id, trigger_data, status, started_at
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        executionId,
        workflowId,
        JSON.stringify(triggerData),
        'running',
        now
      ).run();

      await this.db.prepare(`
        UPDATE workflow_executions 
        SET status = 'completed', completed_at = ?
        WHERE id = ?
      `).bind(
        new Date().toISOString(),
        executionId
      ).run();

      return { success: true, executionId };
    } catch (error: any) {
      console.error('Execute workflow error:', error);
      return { success: false, error: error.message };
    }
  }

  async getWorkflowExecutions(workflowId?: string, limit = 50): Promise<{ success: boolean; executions?: WorkflowExecution[]; error?: string }> {
    try {
      let query = 'SELECT * FROM workflow_executions';
      const params: any[] = [];

      if (workflowId) {
        query += ' WHERE workflow_id = ?';
        params.push(workflowId);
      }

      query += ' ORDER BY started_at DESC LIMIT ?';
      params.push(limit.toString());

      const { results } = await this.db.prepare(query).bind(...params).all();
      const executions: WorkflowExecution[] = (results || []).map((row: any) => ({
        id: row.id,
        workflowId: row.workflow_id,
        triggerData: JSON.parse(row.trigger_data || '{}'),
        status: row.status,
        results: JSON.parse(row.results || '{}'),
        error: row.error,
        startedAt: row.started_at,
        completedAt: row.completed_at
      }));

      return { success: true, executions };
    } catch (error: any) {
      console.error('Get executions error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateWorkflow(workflowId: string, updates: any, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        values.push(updates.name);
      }

      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        values.push(updates.description);
      }

      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        values.push(updates.status);
      }

      if (updateFields.length === 0) {
        return { success: true };
      }

      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(workflowId);

      await this.db.prepare(`
        UPDATE workflows 
        SET ${updateFields.join(', ')} 
        WHERE id = ? AND created_by = ?
      `).bind(...values).run();

      return { success: true };
    } catch (error: any) {
      console.error('Update workflow error:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteWorkflow(workflowId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.db.prepare('BEGIN TRANSACTION').run();

      await this.db.prepare(`
        DELETE FROM workflow_executions WHERE workflow_id = ?
      `).bind(workflowId).run();

      await this.db.prepare(`
        DELETE FROM workflows WHERE id = ? AND created_by = ?
      `).bind(workflowId, userId).run();

      await this.db.prepare('COMMIT').run();

      return { success: true };
    } catch (error: any) {
      await this.db.prepare('ROLLBACK').run();
      console.error('Delete workflow error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const authHeader = request.headers.get('Authorization');
    let userId = 'anonymous';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }

    const workflow = new WorkflowService(env.DB);

    try {
      switch (path) {
        case '/workflows':
          if (request.method === 'GET') {
            const result = await workflow.getWorkflows(userId);
            return Response.json(result, {
              headers: { 'Access-Control-Allow-Origin': '*' }
            });
          } else if (request.method === 'POST') {
            const data = await request.json();
            const result = await workflow.createWorkflow(data, userId);
            return Response.json(result, {
              headers: { 'Access-Control-Allow-Origin': '*' }
            });
          }
          break;

        case '/workflows/trigger':
          if (request.method === 'POST') {
            const { workflowId, triggerData } = await request.json();
            const result = await workflow.executeWorkflow(workflowId, triggerData);
            return Response.json(result, {
              headers: { 'Access-Control-Allow-Origin': '*' }
            });
          }
          break;

        case '/executions':
          if (request.method === 'GET') {
            const workflowId = url.searchParams.get('workflowId');
            const limit = parseInt(url.searchParams.get('limit') || '50');
            const result = await workflow.getWorkflowExecutions(workflowId, limit);
            return Response.json(result, {
              headers: { 'Access-Control-Allow-Origin': '*' }
            });
          }
          break;
      }
    } catch (error: any) {
      console.error('Workflow service error:', error);
      return Response.json({ error: error.message }, {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    return Response.json({ error: 'Not found' }, {
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
};