import { ApolloServer } from '@apollo/server';
import { startServerAndCreateCloudflareWorkersHandler } from '@as-integrations/cloudflare-workers';
import type { ModelService } from './model-service';
import type { CrudService } from './crud-service';

// GraphQL类型定义
const typeDefs = `#graphql
  type ModelField {
    id: ID!
    name: String!
    label: String!
    type: String!
    required: Boolean!
    unique_key: Boolean!
    default_value: String
    validation_rules: JSON
  }

  type Model {
    id: ID!
    name: String!
    label: String!
    description: String
    created_at: String!
    updated_at: String!
    fields: [ModelField!]
  }

  type Query {
    # 获取所有模型
    models: [Model!]!
    
    # 根据ID获取模型
    model(id: ID!): Model
    
    # 获取动态表数据
    data(tableName: String!, page: Int = 1, pageSize: Int = 20): DataResult!
  }

  type DataResult {
    data: [JSON!]!
    total: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
  }

  type Mutation {
    # 创建模型
    createModel(name: String!, label: String!, description: String): Model!
    
    # 创建数据
    createData(tableName: String!, data: JSON!): CreateResult!
  }

  type CreateResult {
    success: Boolean!
    id: ID
    message: String
  }

  scalar JSON
`;

// 解析器
const resolvers = {
  Query: {
    models: async (_: any, __: any, context: { services: { modelService: ModelService } }) => {
      try {
        return await context.services.modelService.getAllModels();
      } catch (error: any) {
        console.error('GraphQL models query error:', error);
        throw new Error(`Failed to fetch models: ${error.message}`);
      }
    },
    
    model: async (_: any, { id }: { id: string }, context: { services: { modelService: ModelService } }) => {
      try {
        if (!id || id.trim() === '') {
          throw new Error('Model ID is required');
        }
        const model = await context.services.modelService.getModelById(id);
        if (!model) {
          // 返回null而不是抛出错误，这是GraphQL的常见模式
          return null;
        }
        return model;
      } catch (error: any) {
        console.error('GraphQL model query error:', error);
        throw new Error(`Failed to fetch model: ${error.message}`);
      }
    },
    
    data: async (_: any, { tableName, page, pageSize }: { tableName: string; page: number; pageSize: number }, 
      context: { services: { crudService: CrudService } }) => {
      try {
        // 验证参数
        if (!tableName || tableName.trim() === '') {
          throw new Error('Table name is required');
        }
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20; // 限制最大页大小
        
        const result = await context.services.crudService.getList(tableName, {
          page,
          pageSize,
          filters: {},
          sortBy: 'created_at',
          sortOrder: 'desc'
        });
        
        return {
          data: result.data,
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: Math.ceil(result.total / result.pageSize)
        };
      } catch (error: any) {
        console.error('GraphQL data query error:', error);
        throw new Error(`Failed to fetch data: ${error.message}`);
      }
    }
  },
  
  Mutation: {
    createModel: async (_: any, { name, label, description }: { name: string; label: string; description?: string }, 
      context: { services: { modelService: ModelService } }) => {
      try {
        // 验证输入
        if (!name || name.trim() === '') {
          throw new Error('Model name is required');
        }
        if (!label || label.trim() === '') {
          throw new Error('Model label is required');
        }
        
        return await context.services.modelService.createModel({ name, label, description });
      } catch (error: any) {
        console.error('GraphQL createModel mutation error:', error);
        throw new Error(`Failed to create model: ${error.message}`);
      }
    },
    
    createData: async (_: any, { tableName, data }: { tableName: string; data: any }, 
      context: { services: { crudService: CrudService } }) => {
      try {
        // 验证输入
        if (!tableName || tableName.trim() === '') {
          throw new Error('Table name is required');
        }
        if (!data || typeof data !== 'object') {
          throw new Error('Valid data object is required');
        }
        
        const result = await context.services.crudService.create(tableName, data);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create data');
        }
        
        return {
          success: result.success,
          id: result.id,
          message: 'Data created successfully'
        };
      } catch (error: any) {
        console.error('GraphQL createData mutation error:', error);
        throw new Error(`Failed to create data: ${error.message}`);
      }
    }
  },
  
  // JSON标量解析器
  JSON: {
    __serialize: (value: any) => value,
    __parseValue: (value: any) => value,
    __parseLiteral: (ast: any) => {
      try {
        return JSON.parse(ast.value);
      } catch {
        return ast.value;
      }
    }
  }
};

// 创建Apollo Server实例 - 生产环境增强版
export function createGraphQLServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production', // 生产环境关闭introspection
    formatError: (formattedError, error: any) => {
      // 生产环境错误格式化
      console.error('GraphQL Error:', {
        message: formattedError.message,
        path: formattedError.path,
        extensions: formattedError.extensions,
        originalError: error?.originalError?.message || error?.message
      });
      
      // 生产环境隐藏内部错误详情
      const isProduction = process.env.NODE_ENV === 'production';
      return {
        message: isProduction ? 'Internal server error' : formattedError.message,
        path: formattedError.path,
        extensions: isProduction ? undefined : formattedError.extensions
      };
    },
    plugins: [
      {
        async requestDidStart() {
          return {
            async didResolveOperation(requestContext) {
              // 简单的查询复杂度检查
              const query = requestContext.request.query || '';
              const operationCount = (query.match(/\{/g) || []).length;
              
              if (operationCount > 20) {
                throw new Error('Query too complex. Maximum depth exceeded.');
              }
            },
            async willSendResponse(requestContext) {
              // 添加缓存控制头
              const { response } = requestContext;
              if (response?.http) {
                response.http.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
                response.http.headers.set('Pragma', 'no-cache');
                response.http.headers.set('Expires', '0');
              }
            }
          };
        }
      }
    ]
  });

  return startServerAndCreateCloudflareWorkersHandler(server, {
    context: async (integrationContext: any) => ({
      services: {
        modelService: new (require('./model-service').ModelService)(integrationContext.env.DB),
        crudService: new (require('./crud-service').CrudService)(integrationContext.env.DB)
      }
    })
  });
}
