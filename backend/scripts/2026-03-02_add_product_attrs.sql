ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS size text,
  ADD COLUMN IF NOT EXISTS voltage text,
  ADD COLUMN IF NOT EXISTS finish text,
  ADD COLUMN IF NOT EXISTS compatibility text,
  ADD COLUMN IF NOT EXISTS warranty text,
  ADD COLUMN IF NOT EXISTS safety_info text,
  ADD COLUMN IF NOT EXISTS specs jsonb,
  ADD COLUMN IF NOT EXISTS manuals jsonb;

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_material ON products(material);
CREATE INDEX IF NOT EXISTS idx_products_voltage ON products(voltage);
CREATE INDEX IF NOT EXISTS idx_products_finish ON products(finish);

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
