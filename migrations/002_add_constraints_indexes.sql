-- ============================================================
-- Migration 002: Constraints, Indexes, and product_attribute_links
-- Run this AFTER database_schema.sql
-- ============================================================

-- Prevent duplicate open sessions per terminal (DB-level unique partial index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_session_per_terminal
  ON sessions(terminal_id)
  WHERE status = 'OPEN';

-- Prevent negative product prices
ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_base_price_positive;
ALTER TABLE products ADD CONSTRAINT chk_base_price_positive CHECK (base_price >= 0);

-- Ensure extra_price on attribute values is non-negative
ALTER TABLE attribute_values DROP CONSTRAINT IF EXISTS chk_extra_price_non_negative;
ALTER TABLE attribute_values ADD CONSTRAINT chk_extra_price_non_negative CHECK (extra_price >= 0);

-- Order total cannot be negative
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_total_non_negative;
ALTER TABLE orders ADD CONSTRAINT chk_total_non_negative CHECK (total_amount >= 0 OR total_amount IS NULL);

-- Tables must have at least 1 seat
ALTER TABLE tables DROP CONSTRAINT IF EXISTS chk_seats_positive;
ALTER TABLE tables ADD CONSTRAINT chk_seats_positive CHECK (seats >= 1 OR seats IS NULL);

-- Performance indexes for report queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_status ON kitchen_tickets(status);

-- Product attribute links: which attributes apply to which product
CREATE TABLE IF NOT EXISTS product_attribute_links (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  attribute_id INT REFERENCES attributes(id) ON DELETE CASCADE,
  UNIQUE(product_id, attribute_id)
);

CREATE INDEX IF NOT EXISTS idx_product_attr_links_product ON product_attribute_links(product_id);
