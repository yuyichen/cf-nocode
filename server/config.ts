/**
 * 环境配置管理
 * 支持多环境：development, testing, production
 */

export interface AppConfig {
  environment: 'development' | 'testing' | 'production';
  database: {
    name: string;
    localId?: string;
    remoteId?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  api: {
    port: number;
    corsOrigin: string[];
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableFile: boolean;
  };
}

// 默认开发环境配置
const defaultConfig: AppConfig = {
  environment: 'development',
  database: {
    name: 'cf-nocode-db',
    localId: '3bf43ef3-714b-4533-b788-72910d944e49', // 本地开发占位符
    remoteId: '' // 生产环境需要设置
  },
  jwt: {
    secret: 'your-secret-key-change-in-production',
    expiresIn: '7d'
  },
  api: {
    port: 8787,
    corsOrigin: ['*']
  },
  logging: {
    level: 'debug',
    enableConsole: true,
    enableFile: false
  }
};

// 环境特定配置
const environmentConfigs: Record<string, Partial<AppConfig>> = {
  development: {
    environment: 'development',
    logging: {
      level: 'debug',
      enableConsole: true,
      enableFile: false
    }
  },
  testing: {
    environment: 'testing',
    database: {
      name: 'cf-nocode-db-test'
    },
    logging: {
      level: 'info',
      enableConsole: true,
      enableFile: true
    }
  },
  production: {
    environment: 'production',
    jwt: {
      secret: '', // 生产环境必须设置
      expiresIn: '1d'
    },
    logging: {
      level: 'warn',
      enableConsole: true,
      enableFile: true
    }
  }
};

/**
 * 加载配置
 * 优先级：环境变量 > 环境特定配置 > 默认配置
 */
export function loadConfig(env: Record<string, any> = {}): AppConfig {
  // 确定当前环境
  const envName = env.NODE_ENV || process.env.NODE_ENV || 'development';
  const environment = (envName === 'production' ? 'production' : 
                      envName === 'testing' ? 'testing' : 'development') as 'development' | 'testing' | 'production';
  
  // 合并配置
  const baseConfig = { ...defaultConfig };
  const envConfig = environmentConfigs[environment] || {};
  
  const config: AppConfig = {
    ...baseConfig,
    ...envConfig,
    environment
  };
  
  // 从环境变量覆盖配置
  if (env.JWT_SECRET) {
    config.jwt.secret = env.JWT_SECRET;
  }
  
  if (env.D1_DATABASE_ID) {
    if (environment === 'production') {
      config.database.remoteId = env.D1_DATABASE_ID;
    } else {
      config.database.localId = env.D1_DATABASE_ID;
    }
  }
  
  // 验证必要配置
  validateConfig(config);
  
  return config;
}

/**
 * 验证配置
 */
function validateConfig(config: AppConfig): void {
  const errors: string[] = [];
  
  // 验证JWT密钥
  if (!config.jwt.secret || config.jwt.secret === 'your-secret-key-change-in-production') {
    if (config.environment === 'production') {
      errors.push('JWT_SECRET must be set in production environment');
    } else {
      console.warn('⚠️  Using default JWT secret. Change this in production!');
    }
  }
  
  // 验证数据库ID
  if (config.environment === 'production' && !config.database.remoteId) {
    errors.push('D1_DATABASE_ID must be set for production environment');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * 获取当前环境配置
 */
export const config = loadConfig();

/**
 * 工具函数：检查是否生产环境
 */
export function isProduction(): boolean {
  return config.environment === 'production';
}

/**
 * 工具函数：检查是否开发环境
 */
export function isDevelopment(): boolean {
  return config.environment === 'development';
}

/**
 * 工具函数：检查是否测试环境
 */
export function isTesting(): boolean {
  return config.environment === 'testing';
}

/**
 * 工具函数：获取数据库ID（根据环境）
 */
export function getDatabaseId(): string {
  if (isProduction()) {
    return config.database.remoteId || '';
  }
  return config.database.localId || '';
}
