import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Lily Edge AI System Tables
 * Comprehensive monitoring, logging, and configuration for multi-model orchestration
 */

// Layer status tracking
export const layerMetrics = mysqlTable('layer_metrics', {
  id: int('id').autoincrement().primaryKey(),
  layerName: varchar('layer_name', { length: 64 }).notNull(), // acquisition, obfuscation, tunnel, edge, generation, feedback
  status: mysqlEnum('status', ['healthy', 'degraded', 'critical', 'offline']).default('healthy').notNull(),
  latency: int('latency').notNull(), // milliseconds
  throughput: int('throughput').notNull(), // requests per second
  errorRate: int('error_rate').notNull(), // percentage
  activeConnections: int('active_connections').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// AI Model provider status
export const modelProviders = mysqlTable('model_providers', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 64 }).notNull().unique(), // groq, cerebras, gemini, cloudflare-llama
  status: mysqlEnum('status', ['active', 'degraded', 'offline']).default('active').notNull(),
  latency: int('latency').notNull(),
  successRate: int('success_rate').notNull(), // percentage
  requestsPerMinute: int('requests_per_minute').notNull(),
  lastHealthCheck: timestamp('last_health_check').defaultNow().notNull(),
  fallbackOrder: int('fallback_order').notNull(), // priority in fallback chain
  config: text('config'), // JSON configuration
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Real-time metrics
export const metrics = mysqlTable('metrics', {
  id: int('id').autoincrement().primaryKey(),
  layerId: int('layer_id').notNull(),
  modelId: int('model_id'),
  metricType: varchar('metric_type', { length: 64 }).notNull(), // latency, throughput, error_rate, etc
  value: int('value').notNull(),
  region: varchar('region', { length: 64 }), // geographic region
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Request logs
export const requestLogs = mysqlTable('request_logs', {
  id: int('id').autoincrement().primaryKey(),
  requestId: varchar('request_id', { length: 128 }).notNull().unique(),
  layerName: varchar('layer_name', { length: 64 }).notNull(),
  modelName: varchar('model_name', { length: 64 }),
  statusCode: int('status_code').notNull(),
  latency: int('latency').notNull(),
  region: varchar('region', { length: 64 }),
  errorMessage: text('error_message'),
  payload: text('payload'), // JSON
  response: text('response'), // JSON
  userId: int('user_id'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Alerts and incidents
export const alerts = mysqlTable('alerts', {
  id: int('id').autoincrement().primaryKey(),
  alertType: varchar('alert_type', { length: 64 }).notNull(), // model_failure, high_latency, edge_error, traffic_anomaly
  severity: mysqlEnum('severity', ['info', 'warning', 'critical']).default('warning').notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description').notNull(),
  affectedComponent: varchar('affected_component', { length: 128 }),
  status: mysqlEnum('alert_status', ['active', 'acknowledged', 'resolved']).default('active').notNull(),
  notifiedOwner: int('notified_owner').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// System configuration
export const systemConfig = mysqlTable('system_config', {
  id: int('id').autoincrement().primaryKey(),
  configKey: varchar('config_key', { length: 128 }).notNull().unique(),
  configValue: text('config_value').notNull(), // JSON
  description: text('description'),
  updatedBy: int('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Model configurations
export const modelConfigs = mysqlTable('model_configs', {
  id: int('id').autoincrement().primaryKey(),
  modelName: varchar('model_name', { length: 64 }).notNull(),
  systemPrompt: text('system_prompt'),
  temperature: int('temperature'), // 0-100
  maxTokens: int('max_tokens'),
  topP: int('top_p'), // 0-100
  frequencyPenalty: int('frequency_penalty'), // 0-100
  presencePenalty: int('presence_penalty'), // 0-100
  rateLimitPerMinute: int('rate_limit_per_minute'),
  routingWeight: int('routing_weight'), // 0-100 for load distribution
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Reports
export const reports = mysqlTable('reports', {
  id: int('id').autoincrement().primaryKey(),
  reportType: varchar('report_type', { length: 64 }).notNull(), // performance, comparison, optimization
  title: varchar('title', { length: 256 }).notNull(),
  content: text('content'), // JSON
  generatedBy: int('generated_by'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Audit logs
export const auditLogs = mysqlTable('audit_logs', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull(),
  action: varchar('action', { length: 128 }).notNull(),
  resource: varchar('resource', { length: 128 }).notNull(),
  changes: text('changes'), // JSON
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// User roles and permissions
export const userRoles = mysqlTable('user_roles', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().unique(),
  role: mysqlEnum('role', ['admin', 'operator', 'viewer']).default('viewer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Type exports
export type LayerMetrics = typeof layerMetrics.$inferSelect;
export type ModelProvider = typeof modelProviders.$inferSelect;
export type Metric = typeof metrics.$inferSelect;
export type RequestLog = typeof requestLogs.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type ModelConfig = typeof modelConfigs.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;