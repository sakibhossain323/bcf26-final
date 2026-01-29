import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  productId: varchar('product_id', { length: 50 }).unique().notNull(),
  productName: varchar('product_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  reservedQuantity: integer('reserved_quantity').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Idempotency key tracking
export const processedRequests = pgTable('processed_requests', {
  id: serial('id').primaryKey(),
  idempotencyKey: varchar('idempotency_key', { length: 100 }).unique().notNull(),
  orderId: varchar('order_id', { length: 50 }).notNull(),
  response: varchar('response', { length: 1000 }),
  processedAt: timestamp('processed_at').defaultNow().notNull(),
});

// Inventory audit log
export const inventoryAuditLog = pgTable('inventory_audit_log', {
  id: serial('id').primaryKey(),
  productId: varchar('product_id', { length: 50 }).notNull(),
  orderId: varchar('order_id', { length: 50 }),
  action: varchar('action', { length: 50 }).notNull(), // 'reserve', 'release', 'update'
  quantityBefore: integer('quantity_before').notNull(),
  quantityAfter: integer('quantity_after').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});