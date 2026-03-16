ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight_kg numeric(10, 2),
  ADD COLUMN IF NOT EXISTS length_cm numeric(10, 2),
  ADD COLUMN IF NOT EXISTS width_cm numeric(10, 2),
  ADD COLUMN IF NOT EXISTS height_cm numeric(10, 2),
  ADD COLUMN IF NOT EXISTS backorderable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS backorder_eta_days integer;

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  status text NOT NULL DEFAULT 'pending',
  currency text NOT NULL,
  subtotal_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  shipping_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  shipping_method text,
  shipping_address jsonb,
  billing_address jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  sku text,
  quantity integer NOT NULL,
  price_cents integer NOT NULL,
  currency text NOT NULL,
  backordered boolean NOT NULL DEFAULT false,
  backorder_eta_days integer
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_number text NOT NULL UNIQUE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  reason text NOT NULL,
  items jsonb NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON return_requests(order_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  session_id text,
  user_email text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  currency text NOT NULL,
  subtotal_cents integer NOT NULL DEFAULT 0,
  cart_items jsonb NOT NULL,
  status text NOT NULL DEFAULT 'open',
  last_seen timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(customer_email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_abandoned_carts_email ON abandoned_carts(customer_email);

CREATE TABLE IF NOT EXISTS inventory_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock_level integer NOT NULL,
  threshold integer NOT NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
