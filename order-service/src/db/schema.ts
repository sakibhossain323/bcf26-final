import { pgTable, serial, varchar, integer, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';

export const orderStatusEnum = pgEnum('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']);

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderId: varchar('order_id', { length: 50 }).unique().notNull(),
  userId: varchar('user_id', { length: 50 }).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  productId: varchar('product_id', { length: 50 }).notNull(),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
});

// Idempotency table for handling duplicate requests
export const inventoryUpdates = pgTable('inventory_updates', {
  id: serial('id').primaryKey(),
  orderId: varchar('order_id', { length: 50 }).unique().notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'pending', 'completed', 'failed'
  retryCount: integer('retry_count').default(0).notNull(),
  lastAttempt: timestamp('last_attempt').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});