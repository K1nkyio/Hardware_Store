CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  username text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'customer',
  auth_domain text NOT NULL DEFAULT 'customer',
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  email_verified_at timestamptz,
  email_verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  mfa_enabled boolean NOT NULL DEFAULT false,
  mfa_secret text,
  mfa_recovery_codes text[] NOT NULL DEFAULT '{}',
  mfa_reset_required boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- If the table already existed from a previous schema, ensure columns exist before indexes/updates below.
ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users ((lower(username)));
CREATE INDEX IF NOT EXISTS idx_users_auth_domain ON users(auth_domain);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  address text,
  account_type text NOT NULL DEFAULT 'customer',
  company_name text,
  company_role text,
  tax_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label text NOT NULL,
  payment_type text NOT NULL DEFAULT 'card',
  brand text,
  last4 text,
  exp_month integer,
  exp_year integer,
  provider text,
  provider_token text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (payment_type IN ('card', 'mpesa'))
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL UNIQUE,
  device text,
  ip text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE TABLE IF NOT EXISTS user_auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_type text NOT NULL CHECK (token_type IN ('email_verify', 'password_reset')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_auth_tokens_user_id ON user_auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_auth_tokens_expires_at ON user_auth_tokens(expires_at);

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  username text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('viewer', 'manager', 'super_admin')),
  mfa_enabled boolean NOT NULL DEFAULT false,
  mfa_secret text,
  mfa_recovery_codes text[] NOT NULL DEFAULT '{}',
  mfa_reset_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz
);

-- If the table already existed from a previous schema, ensure columns exist before indexes/updates below.
ALTER TABLE admins ADD COLUMN IF NOT EXISTS username text;

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_username ON admins ((lower(username)));
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);

CREATE TABLE IF NOT EXISTS admin_roles (
  admin_id uuid PRIMARY KEY REFERENCES admins(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('viewer', 'manager', 'super_admin')),
  assigned_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL UNIQUE,
  ip text,
  device text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS admin_auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_type text NOT NULL CHECK (token_type IN ('password_reset')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_auth_tokens_admin_id ON admin_auth_tokens(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_auth_tokens_expires_at ON admin_auth_tokens(expires_at);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auth_domain text NOT NULL DEFAULT 'customer',
  refresh_token_hash text NOT NULL UNIQUE,
  user_agent text,
  ip_address text,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_domain ON auth_sessions(auth_domain);

CREATE TABLE IF NOT EXISTS auth_user_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auth_domain text NOT NULL DEFAULT 'customer',
  token_type text NOT NULL CHECK (token_type IN ('email_verify', 'password_reset')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_user_tokens_user_id ON auth_user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_user_tokens_expires_at ON auth_user_tokens(expires_at);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text,
  category text,
  description text,
  brand text,
  material text,
  size text,
  voltage text,
  finish text,
  compatibility text,
  warranty text,
  safety_info text,
  specs jsonb,
  manuals jsonb,
  weight_kg numeric(10, 2),
  length_cm numeric(10, 2),
  width_cm numeric(10, 2),
  height_cm numeric(10, 2),
  backorderable boolean NOT NULL DEFAULT false,
  backorder_eta_days integer,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PHP',
  stock integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  image_url text,
  reorder_threshold integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_material ON products(material);
CREATE INDEX IF NOT EXISTS idx_products_voltage ON products(voltage);
CREATE INDEX IF NOT EXISTS idx_products_finish ON products(finish);

CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value integer NOT NULL,
  minimum_subtotal_cents integer NOT NULL DEFAULT 0,
  max_discount_cents integer,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  per_user_limit integer NOT NULL DEFAULT 1,
  eligible_account_type text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_window ON promo_codes(starts_at, ends_at);

CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  redeemed_code text NOT NULL,
  discount_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promo_code_redemptions_code_id ON promo_code_redemptions(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_redemptions_user_id ON promo_code_redemptions(user_id);

CREATE TABLE IF NOT EXISTS user_wishlist (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_wishlist_product_id ON user_wishlist(product_id);

CREATE TABLE IF NOT EXISTS product_search_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alias text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_search_aliases_product_id ON product_search_aliases(product_id);
CREATE INDEX IF NOT EXISTS idx_product_search_aliases_alias ON product_search_aliases ((lower(alias)));

CREATE TABLE IF NOT EXISTS branch_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  phone text,
  pickup_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_branch_inventory (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branch_locations(id) ON DELETE CASCADE,
  stock integer NOT NULL DEFAULT 0,
  pickup_eta text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_product_branch_inventory_branch_id ON product_branch_inventory(branch_id);

CREATE TABLE IF NOT EXISTS product_bulk_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  min_quantity integer NOT NULL CHECK (min_quantity > 0),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_bulk_pricing_product_id ON product_bulk_pricing(product_id);

CREATE TABLE IF NOT EXISTS product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bundled_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bundle_price_cents integer,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_bundles_product_id ON product_bundles(product_id);

CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branch_locations(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  company_name text,
  account_type text NOT NULL DEFAULT 'customer',
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'quoted', 'won', 'lost')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  payment_provider text,
  payment_reference text,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_metadata jsonb,
  currency text NOT NULL,
  subtotal_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  shipping_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  shipping_method text,
  shipping_address jsonb,
  billing_address jsonb,
  promo_code text,
  discount_cents integer NOT NULL DEFAULT 0,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  sla_due_at timestamptz,
  shipped_at timestamptz,
  tracking_number text,
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
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created_at ON analytics_events(event_name, created_at DESC);

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

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  email text,
  phone text,
  lead_time_days integer NOT NULL DEFAULT 7,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_supplier_map (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_sku text,
  lead_time_days integer,
  min_order_qty integer NOT NULL DEFAULT 1,
  preferred boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_product_supplier_map_supplier_id ON product_supplier_map(supplier_id);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity integer NOT NULL,
  previous_stock integer NOT NULL,
  next_stock integer NOT NULL,
  reason text,
  performed_by text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);

CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text NOT NULL,
  author_name text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);

CREATE TABLE IF NOT EXISTS product_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  author_name text NOT NULL,
  author_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_product_questions_product_id ON product_questions(product_id);

CREATE TABLE IF NOT EXISTS customer_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  order_number text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'spam')),
  moderation_note text,
  moderated_by uuid REFERENCES admins(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_inquiries_status ON customer_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_created_at ON customer_inquiries(created_at DESC);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('review', 'question')),
  entity_id uuid NOT NULL,
  action text NOT NULL,
  template_key text,
  note text,
  actor_role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_entity ON moderation_actions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text,
  actor_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text,
  method text,
  path text,
  status_code integer,
  message text NOT NULL,
  stack text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_threshold integer NOT NULL DEFAULT 10;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sla_due_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_metadata jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'customer';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company_role text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tax_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_domain text NOT NULL DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_recovery_codes text[] NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_reset_required boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS auth_domain text NOT NULL DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '';
ALTER TABLE admins ADD COLUMN IF NOT EXISTS username text;

UPDATE users
SET username = CONCAT('user_', REPLACE(LEFT(id::text, 8), '-', ''))
WHERE username IS NULL OR BTRIM(username) = '';

UPDATE admins
SET username = CONCAT('admin_', REPLACE(LEFT(id::text, 8), '-', ''))
WHERE username IS NULL OR BTRIM(username) = '';

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE admins ALTER COLUMN username SET NOT NULL;

UPDATE users
SET email_verified = true
WHERE email_verified = false
  AND email_verified_at IS NOT NULL;

UPDATE users
SET status = CASE WHEN is_active THEN 'active' ELSE 'disabled' END
WHERE status IS NULL OR status = '';

INSERT INTO user_profiles (user_id, name)
SELECT id, COALESCE(NULLIF(full_name, ''), split_part(email, '@', 1))
FROM users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO admins (id, email, username, full_name, password_hash, role, mfa_enabled, mfa_secret, mfa_recovery_codes, mfa_reset_required, created_at, status, failed_login_attempts, locked_until, last_login_at)
SELECT
  id,
  email,
  COALESCE(NULLIF(username, ''), CONCAT('admin_', REPLACE(LEFT(id::text, 8), '-', ''))),
  COALESCE(NULLIF(full_name, ''), split_part(email, '@', 1)),
  password_hash,
  CASE
    WHEN role IN ('viewer', 'manager', 'super_admin') THEN role
    ELSE 'viewer'
  END,
  COALESCE(mfa_enabled, false),
  mfa_secret,
  COALESCE(mfa_recovery_codes, '{}'),
  COALESCE(mfa_reset_required, false),
  COALESCE(created_at, now()),
  CASE
    WHEN is_active THEN 'active'
    ELSE 'disabled'
  END,
  COALESCE(failed_login_attempts, 0),
  locked_until,
  last_login_at
FROM users
WHERE auth_domain = 'admin'
ON CONFLICT (id) DO NOTHING;

INSERT INTO admin_roles (admin_id, role)
SELECT id, role
FROM admins
ON CONFLICT (admin_id) DO UPDATE SET role = EXCLUDED.role;

UPDATE users
SET auth_domain = CASE
  WHEN role IN ('viewer', 'manager', 'super_admin') THEN 'admin'
  ELSE 'customer'
END
WHERE auth_domain IS NULL OR auth_domain = '';

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON suppliers;
CREATE TRIGGER trg_suppliers_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON app_settings;
CREATE TRIGGER trg_app_settings_updated_at
BEFORE UPDATE ON app_settings
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_customer_inquiries_updated_at ON customer_inquiries;
CREATE TRIGGER trg_customer_inquiries_updated_at
BEFORE UPDATE ON customer_inquiries
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER trg_payment_methods_updated_at
BEFORE UPDATE ON payment_methods
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER trg_promo_codes_updated_at
BEFORE UPDATE ON promo_codes
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_branch_locations_updated_at ON branch_locations;
CREATE TRIGGER trg_branch_locations_updated_at
BEFORE UPDATE ON branch_locations
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_product_bulk_pricing_updated_at ON product_bulk_pricing;
CREATE TRIGGER trg_product_bulk_pricing_updated_at
BEFORE UPDATE ON product_bulk_pricing
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_quote_requests_updated_at ON quote_requests;
CREATE TRIGGER trg_quote_requests_updated_at
BEFORE UPDATE ON quote_requests
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

INSERT INTO branch_locations (slug, name, city, address, phone, pickup_enabled)
VALUES
  ('nairobi-westlands', 'Westlands Trade Counter', 'Nairobi', 'Westlands Commercial Centre, Nairobi', '+254 700 000 101', true),
  ('industrial-area', 'Industrial Area Depot', 'Nairobi', 'Enterprise Road, Industrial Area, Nairobi', '+254 700 000 102', true),
  ('mombasa-port', 'Mombasa Port Yard', 'Mombasa', 'Shimanzi Logistics Park, Mombasa', '+254 700 000 103', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO promo_codes (
  code,
  description,
  discount_type,
  discount_value,
  minimum_subtotal_cents,
  max_discount_cents,
  usage_limit,
  per_user_limit,
  eligible_account_type,
  is_active
)
VALUES
  ('WELCOME5', '5% off first orders above KES 2,500', 'percent', 5, 250000, 50000, 500, 1, NULL, true),
  ('TRADE12', '12% trade discount for contractor and company accounts', 'percent', 12, 1000000, 300000, NULL, 10, 'contractor', true),
  ('BULK1500', 'KES 1,500 off qualifying bulk orders', 'fixed', 150000, 3500000, NULL, NULL, 5, NULL, true)
ON CONFLICT (code) DO NOTHING;
