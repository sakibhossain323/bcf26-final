CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" varchar(50) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" varchar(50) NOT NULL,
	"order_id" varchar(50),
	"action" varchar(50) NOT NULL,
	"quantity_before" integer NOT NULL,
	"quantity_after" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"idempotency_key" varchar(100) NOT NULL,
	"order_id" varchar(50) NOT NULL,
	"response" varchar(1000),
	"processed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "processed_requests_idempotency_key_unique" UNIQUE("idempotency_key")
);
