-- ShipLedger migration 0001: in-app notifications + settings key-value store.
-- Run against the database:  psql "$DATABASE_URL" -f lib/db/migrations/0001_notifications.sql

CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  "userId" text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  "invoiceId" integer,
  "readAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT notifications_type_check CHECK (type IN ('new_invoice', 'invoice_updated', 'invoice_deleted', 'info'))
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications ("userId", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text,
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
