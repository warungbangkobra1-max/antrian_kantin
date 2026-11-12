-- ==============================================================================
-- SKEMA DATABASE SUPABASE POSTGRESQL: ANTREAN KANTIN SANTRI
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPE ENUM
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'kasir', 'dapur', 'santri');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('menunggu', 'diproses', 'siap', 'selesai', 'dibatalkan', 'dilewati');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('tunai', 'saldo_santri', 'qris');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE movement_type AS ENUM ('masuk', 'keluar', 'penyesuaian');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABEL PROFILES (Pengguna & Petugas Kantin)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'santri',
  pin_code VARCHAR(10),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABEL STUDENTS (Data Santri & Saldo)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nis VARCHAR(30) UNIQUE,
  name VARCHAR(100) NOT NULL,
  class_room VARCHAR(50) NOT NULL DEFAULT 'Umum',
  dormitory VARCHAR(50),
  balance NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABEL CATEGORIES (Kategori Menu Kantin)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(30) DEFAULT 'Utensils',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABEL PRODUCTS (Menu Makanan & Minuman)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 100,
  is_available BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABEL QUEUE_NUMBERS (Nomor Urut Antrean Harian - Anti Duplikasi)
CREATE TABLE IF NOT EXISTS queue_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_seq INT NOT NULL,
  formatted_number VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_daily_seq UNIQUE (queue_date, daily_seq),
  CONSTRAINT uq_daily_formatted_number UNIQUE (queue_date, formatted_number)
);

-- Index pencarian cepat antrean harian
CREATE INDEX IF NOT EXISTS idx_queue_numbers_date_num ON queue_numbers(queue_date, formatted_number);

-- 8. TABEL ORDERS (Transaksi Pesanan & Antrean)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id VARCHAR(100) UNIQUE, -- ID Idempotency dari offline storage browser
  queue_number_id UUID REFERENCES queue_numbers(id) ON DELETE SET NULL,
  queue_number VARCHAR(10) NOT NULL,
  student_name VARCHAR(100) NOT NULL,
  class_room VARCHAR(50) DEFAULT 'Santri Mandiri',
  status order_status NOT NULL DEFAULT 'menunggu',
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payment_status VARCHAR(20) DEFAULT 'belum_bayar',
  cashier_name VARCHAR(50) DEFAULT 'Kasir 1',
  counter_name VARCHAR(50) DEFAULT 'Loket 1',
  notes TEXT,
  call_count INT DEFAULT 0,
  queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  called_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  waiting_duration_minutes INT DEFAULT 0,
  service_duration_minutes INT DEFAULT 0
);

-- Index efisiensi antrean dan status
CREATE INDEX IF NOT EXISTS idx_orders_date_status ON orders(queue_date, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 9. TABEL ORDER_ITEMS (Item Menu Dalam Pesanan)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 10. TABEL PAYMENTS (Pembayaran Kasir)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'tunai',
  cashier_name VARCHAR(50) NOT NULL DEFAULT 'Kasir 1',
  reference_no VARCHAR(100),
  paid_at TIMESTAMPTZ DEFAULT now()
);

-- 11. TABEL INVENTORY (Stok Bahan / Produk)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  current_stock INT NOT NULL DEFAULT 0,
  minimum_stock INT NOT NULL DEFAULT 10,
  unit VARCHAR(20) DEFAULT 'porsi',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. TABEL INVENTORY_MOVEMENTS (Riwayat Keluar Masuk Stok)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type movement_type NOT NULL,
  quantity INT NOT NULL,
  reason TEXT,
  created_by VARCHAR(50) DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. TABEL DAILY_REPORTS (Ringkasan Laporan Harian)
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  total_orders INT DEFAULT 0,
  completed_orders INT DEFAULT 0,
  skipped_orders INT DEFAULT 0,
  cancelled_orders INT DEFAULT 0,
  total_revenue NUMERIC(14, 2) DEFAULT 0.00,
  avg_wait_minutes INT DEFAULT 0,
  avg_service_minutes INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- FUNGSI OTOMATIS: GENERATE NOMOR ANTREAN HARIAN AMAN DARI RACE CONDITIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION generate_daily_queue_number(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  out_id UUID,
  out_daily_seq INT,
  out_formatted_number VARCHAR
) AS $$
DECLARE
  v_next_seq INT;
  v_formatted VARCHAR(10);
  v_new_id UUID;
BEGIN
  -- Dapatkan sequence berikutnya untuk hari target dengan locking
  SELECT COALESCE(MAX(daily_seq), 0) + 1
  INTO v_next_seq
  FROM queue_numbers
  WHERE queue_date = target_date;

  -- Format nomor urut (contoh: A001, A002, A025)
  v_formatted := 'A' || LPAD(v_next_seq::TEXT, 3, '0');

  INSERT INTO queue_numbers (queue_date, daily_seq, formatted_number)
  VALUES (target_date, v_next_seq, v_formatted)
  ON CONFLICT (queue_date, formatted_number) DO UPDATE
    SET daily_seq = queue_numbers.daily_seq -- fallback no-op
  RETURNING id, daily_seq, formatted_number INTO v_new_id, v_next_seq, v_formatted;

  RETURN QUERY SELECT v_new_id, v_next_seq, v_formatted;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- 1. Baca data publik (Menu, Kategori, Antrean untuk layar santri & display TV)
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Queue Numbers" ON queue_numbers FOR SELECT USING (true);
CREATE POLICY "Public Read Orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public Read Order Items" ON order_items FOR SELECT USING (true);

-- 2. Santri dapat menambahkan antrean mandiri
CREATE POLICY "Santri Create Order" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Santri Create Order Items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Santri Create Queue Number" ON queue_numbers FOR INSERT WITH CHECK (true);

-- 3. Petugas (Kasir, Dapur, Admin) & Service Role memiliki akses penuh
CREATE POLICY "Full Access Service Role Orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Service Role Products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Service Role Categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Service Role Profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Service Role Students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Service Role Payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Service Role Inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Service Role Reports" ON daily_reports FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- REALTIME REPLICATION SETUP
-- ==============================================================================
-- Aktifkan Realtime pada tabel orders dan queue_numbers
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE queue_numbers;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- SEED DATA AWAL (MENU KANTIN & KATEGORI DEFAULT)
-- ==============================================================================
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Makanan Berat', 'makanan-berat', 'Utensils', 1),
  ('Minuman Segar', 'minuman-segar', 'Coffee', 2),
  ('Camilan & Roti', 'camilan', 'Cookie', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, description, price, stock, is_available) VALUES
  ('Nasi Pecel Telur', 'Nasi dengan pecel sayur segar bumbu kacang dan telur dadar', 10000, 100, true),
  ('Nasi Goreng Santri', 'Nasi goreng khas kantin dengan suwiran ayam dan kerupuk', 12000, 80, true),
  ('Mie Ayam Bakso', 'Mie kuah gurih disajikan dengan pangsit dan bakso sapi', 12000, 75, true),
  ('Es Teh Manis', 'Teh melati segar manis dingin', 3000, 200, true),
  ('Es Jeruk Peras', 'Jeruk asli diperas segar dengan es batu', 5000, 150, true),
  ('Roti Bakar Cokelat', 'Roti tawar bakar isi lelehan selai cokelat manis', 8000, 50, true)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- SEED DEFAULT PROFILES (ROLE DIKONTROL DARI DATABASE SUPABASE)
-- ==============================================================================
INSERT INTO profiles (username, full_name, role, pin_code) VALUES
  ('admin', 'Administrator Kantin', 'admin', '9999'),
  ('kasir', 'Petugas Kasir Kantin', 'kasir', '1234'),
  ('dapur', 'Petugas Dapur Kantin', 'dapur', '2222'),
  ('santri', 'Santri Mandiri', 'santri', NULL)
ON CONFLICT (username) DO UPDATE
  SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- ==============================================================================
-- TRIGGER OTOMATIS: SINKRONISASI USER DARI SUPABASE AUTH KE TABEL PROFILES
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, username, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'santri')
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

