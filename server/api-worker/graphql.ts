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
      return await context.services.modelService.getAllModels();
    },
    
    model: async (_: any, { id }: { id: string }, context: { services: { modelService: ModelService } }) => {
      return await context.services.modelService.getModelById(id);
    },
    
    data: async (_: any, { tableName, page, pageSize }: { tableName: string; page: number; pageSize: number }, 
      context: { services: { crudService: CrudService } }) => {
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
    }
  },
  
  Mutation: {
    createModel: async (_: any, { name, label, description }: { name: string; label: string; description?: string }, 
      context: { services: { modelService: ModelService } }) => {
      return await context.services.modelService.createModel({ name, label, description });
    },
    
    createData: async (_: any, { tableName, data }: { tableName: string; data: any }, 
      context: { services: { crudService: CrudService } }) => {
      const result = await context.services.crudService.create(tableName, data);
      
      return {
        success: result.success,
        id: result.id,
        message: result.success ? 'Data created successfully' : result.error
      };
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

// 创建Apollo Server实例
export function createGraphQLServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true
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
