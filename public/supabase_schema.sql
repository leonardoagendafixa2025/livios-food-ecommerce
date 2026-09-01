-- ============================================================
-- SCHEMA DDL POSTGRESQL PARA SUPABASE — LIVIO'S FOOD INNOVATION
-- Cole este script no SQL Editor do seu projeto Supabase (https://app.supabase.com)
-- ============================================================

-- 1. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  "order" INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  short_description TEXT,
  full_description TEXT,
  price NUMERIC(10,2) NOT NULL,
  promotional_price NUMERIC(10,2),
  cost_price NUMERIC(10,2) DEFAULT 0.00,
  stock INT DEFAULT 0,
  min_stock INT DEFAULT 5,
  weight_kg NUMERIC(6,3) DEFAULT 0.450,
  volume_ml INT DEFAULT 250,
  heat_level TEXT DEFAULT 'Média',
  ingredients TEXT,
  nutrition_info JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT FALSE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_offer BOOLEAN DEFAULT FALSE,
  rating NUMERIC(3,2) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE USUÁRIOS E CLIENTES
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  cpf TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'customer',
  marketing_consent BOOLEAN DEFAULT TRUE,
  tags JSONB DEFAULT '[]'::jsonb,
  addresses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE PEDIDOS DE VENDA
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_cpf TEXT,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0.00,
  coupon_code TEXT,
  shipping_fee NUMERIC(10,2) DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'received',
  status_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE CUPONS DE DESCONTO
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  min_purchase NUMERIC(10,2) DEFAULT 0.00,
  usage_limit INT DEFAULT 1000,
  used_count INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE BANNERS
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  button_text TEXT,
  button_link TEXT,
  secondary_button_text TEXT,
  secondary_button_link TEXT,
  image_desktop TEXT NOT NULL,
  image_mobile TEXT,
  active BOOLEAN DEFAULT TRUE,
  "order" INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE LISTA DE ESPERA ("AVISE-ME QUANDO CHEGAR")
CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  channels JSONB DEFAULT '["email", "whatsapp"]'::jsonb,
  quantity INT DEFAULT 1,
  status TEXT DEFAULT 'Aguardando',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ
);

-- 8. TABELA DE MOVIMENTAÇÕES DE ESTOQUE (KARDEX)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason TEXT,
  "user" TEXT DEFAULT 'Administrador',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABELA DE MÓDULO DE CAMPANHAS DE MARKETING
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  type TEXT DEFAULT 'PROMOÇÃO',
  status TEXT DEFAULT 'Ativa',
  channels JSONB DEFAULT '["email", "whatsapp"]'::jsonb,
  segment JSONB DEFAULT '{}'::jsonb,
  message JSONB DEFAULT '{}'::jsonb,
  coupon_code TEXT,
  linked_product_id TEXT,
  image TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  stats JSONB DEFAULT '{"reachedCount": 0, "conversionsCount": 0, "totalRevenue": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABELA DE POP-UPS E BARRAS PROMOCIONAIS
CREATE TABLE IF NOT EXISTS popups (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'CUPOM',
  status TEXT DEFAULT 'Ativo',
  coupon_code TEXT,
  button_text TEXT,
  button_link TEXT,
  image TEXT,
  position TEXT DEFAULT 'center',
  trigger TEXT DEFAULT 'time_delay',
  trigger_delay_seconds INT DEFAULT 5,
  frequency TEXT DEFAULT 'once_per_day',
  active BOOLEAN DEFAULT TRUE,
  stats JSONB DEFAULT '{"viewsCount": 0, "clicksCount": 0, "conversionsCount": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotional_bars (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  coupon_code TEXT,
  button_text TEXT,
  button_link TEXT,
  background_color TEXT DEFAULT '#8B0000',
  text_color TEXT DEFAULT '#FFFFFF',
  countdown_end_date TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  stats JSONB DEFAULT '{"viewsCount": 0, "clicksCount": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABELA DE NOTAS E EVENTOS DE CRM
CREATE TABLE IF NOT EXISTS customer_notes (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  author TEXT DEFAULT 'Administrador',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_events (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW()
);
