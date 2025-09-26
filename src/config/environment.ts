/**
 * Environment Configuration Module
 * Centralizes all environment variable access with type safety and validation
 */

import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Core Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8080),
  APP_NAME: z.string().default('AI Pair Programmer'),
  APP_VERSION: z.string().default('1.0.0'),

  // AI Engine
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4'),
  OPENAI_MAX_TOKENS: z.coerce.number().default(2048),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  
  AI_SUGGESTION_TIMEOUT_MS: z.coerce.number().default(3000),
  AI_MAX_CANDIDATES: z.coerce.number().min(1).max(10).default(5),
  AI_CONTEXT_WINDOW_SIZE: z.coerce.number().default(4000),

  // Code Analysis
  PARSER_CACHE_SIZE_MB: z.coerce.number().default(256),
  AST_DELTA_TTL_SECONDS: z.coerce.number().default(300),
  SYMBOL_GRAPH_MAX_NODES: z.coerce.number().default(10000),

  // Telemetry
  TELEMETRY_ENABLED: z.coerce.boolean().default(true),
  TELEMETRY_ENDPOINT: z.string().url().optional(),
  TELEMETRY_SAMPLING_RATE: z.coerce.number().min(0).max(1).default(1.0),
  METRICS_EXPORT_INTERVAL_MS: z.coerce.number().default(5000),

  // Security
  PII_REDACTION_ENABLED: z.coerce.boolean().default(true),
  PII_PATTERNS_FILE: z.string().default('config/pii-patterns.json'),
  JWT_SECRET: z.string().min(32).optional(),
  SESSION_TIMEOUT_HOURS: z.coerce.number().default(24),
  REFRESH_TOKEN_DAYS: z.coerce.number().default(7),

  // Feature Flags
  FEATURE_REALTIME_COLLABORATION: z.coerce.boolean().default(false),
  FEATURE_MULTI_LANGUAGE_SUPPORT: z.coerce.boolean().default(false),
  FEATURE_ADVANCED_ANALYTICS: z.coerce.boolean().default(false),
  FEATURE_ENTERPRISE_SSO: z.coerce.boolean().default(false),

  // Performance
  BUNDLE_SIZE_LIMIT_KB: z.coerce.number().default(300),
  SUGGESTION_LATENCY_BUDGET_MS: z.coerce.number().default(2000),
  CACHE_TTL_SECONDS: z.coerce.number().default(60),

  // Development
  DEBUG_MODE: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  MOCK_AI_RESPONSES: z.coerce.boolean().default(false),
  TEST_DATA_SEED: z.coerce.number().optional(),
});

// Parse and validate environment variables
function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

// Export validated configuration
export const env = parseEnv();

// Environment utilities
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Feature flag utilities
export const features = {
  realtimeCollaboration: env.FEATURE_REALTIME_COLLABORATION,
  multiLanguageSupport: env.FEATURE_MULTI_LANGUAGE_SUPPORT,
  advancedAnalytics: env.FEATURE_ADVANCED_ANALYTICS,
  enterpriseSSO: env.FEATURE_ENTERPRISE_SSO,
} as const;

// Configuration groups for easier access
export const aiConfig = {
  apiKey: env.OPENAI_API_KEY,
  model: env.OPENAI_MODEL,
  maxTokens: env.OPENAI_MAX_TOKENS,
  temperature: env.OPENAI_TEMPERATURE,
  suggestionTimeout: env.AI_SUGGESTION_TIMEOUT_MS,
  maxCandidates: env.AI_MAX_CANDIDATES,
  contextWindowSize: env.AI_CONTEXT_WINDOW_SIZE,
} as const;

export const parserConfig = {
  cacheSizeMB: env.PARSER_CACHE_SIZE_MB,
  astDeltaTTL: env.AST_DELTA_TTL_SECONDS,
  symbolGraphMaxNodes: env.SYMBOL_GRAPH_MAX_NODES,
} as const;

export const telemetryConfig = {
  enabled: env.TELEMETRY_ENABLED,
  endpoint: env.TELEMETRY_ENDPOINT,
  samplingRate: env.TELEMETRY_SAMPLING_RATE,
  exportInterval: env.METRICS_EXPORT_INTERVAL_MS,
} as const;

export const securityConfig = {
  piiRedactionEnabled: env.PII_REDACTION_ENABLED,
  piiPatternsFile: env.PII_PATTERNS_FILE,
  jwtSecret: env.JWT_SECRET,
  sessionTimeout: env.SESSION_TIMEOUT_HOURS,
  refreshTokenDays: env.REFRESH_TOKEN_DAYS,
} as const;

export const performanceConfig = {
  bundleSizeLimit: env.BUNDLE_SIZE_LIMIT_KB,
  suggestionLatencyBudget: env.SUGGESTION_LATENCY_BUDGET_MS,
  cacheTTL: env.CACHE_TTL_SECONDS,
} as const;

// Validation helpers
export function validateRequiredConfig() {
  const errors: string[] = [];

  if (isProduction) {
    if (!env.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY is required in production');
    }
    if (!env.JWT_SECRET) {
      errors.push('JWT_SECRET is required in production');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Missing required configuration:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Configuration validation failed');
  }
}

// Runtime configuration check
if (isProduction) {
  validateRequiredConfig();
}

export default env;
