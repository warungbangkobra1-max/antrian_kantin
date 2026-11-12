# 🏫 ANTREAN KANTIN SANTRI

> Sistem antrean kantin modern berbasis web & mobile terintegrasi **Supabase PostgreSQL**, sinkronisasi *real-time* multi-perangkat (Santri, Kasir, Dapur, Admin, Layar TV), dukungan **Online & Offline** dengan auto-sync, pemanggilan suara otomatis (*chime* & Text-to-Speech), serta laporan transaksi dan analitik lengkap yang dapat diunduh ke format **Excel (.xlsx)**, **CSV**, dan **PDF**.

---

## 📌 1. Konsep Utama & Alur Kerja

Aplikasi dirancang untuk efisiensi transaksi di kantin santri:

1. **HP Kiosk di Meja Kasir (Mode Santri)**:
   - Diletakkan menghadap santri.
   - Santri mengisi **Nomor Antrean** dan **Nama Santri** (opsional: pilih kelas/kamar atau menu makanan).
   - Menekan tombol hijau besar **`🟢 AMBIL ANTREAN`**.
   - Santri **tidak perlu login**, aman, cepat, dan higienis.
2. **Anti-Duplikasi & Nomor Otomatis**:
   - Sistem memvalidasi agar nomor antrean yang aktif tidak dapat diambil ganda pada hari yang sama.
   - Tersedia generator nomor harian otomatis (A001, A002, dst.) yang ter-reset setiap hari.
3. **Dukungan Online & Offline**:
   - **Online**: Data tersimpan langsung ke Supabase PostgreSQL dan tersinkronisasi *real-time* ke semua HP petugas.
   - **Offline**: Jika internet terputus, santri tetap bisa mengambil antrean. Pesanan tersimpan aman di penyimpanan lokal browser dengan ID unik (idempotency) dan otomatis dikirim saat koneksi internet kembali tanpa duplikasi.
4. **Alur 4 Role Terintegrasi**:
   - **SANTRI**: Mengambil antrean, melihat menu, dan mengecek status pesanan.
   - **KASIR**: Memanggil antrean (`🔊 PANGGIL`, `🔁 PANGGIL ULANG`, `⏭️ LEWATI`, `✅ SELESAI`), menerima pembayaran, dan mencetak/menampilkan nomor.
   - **DAPUR**: Melihat pesanan makanan masuk, memproses pesanan (`👨‍🍳 DIPROSES`), dan menandai siap diambil (`✨ SIAP`).
   - **ADMIN**: Memantau dashboard KPI, mengelola santri & menu, membatalkan/menghapus antrean salah, menganalisis jam sibuk, serta mengunduh laporan.

---

## 🌟 2. Fitur-Fitur Utama

### 📱 Mode Santri (Kiosk Mandiri)
- Tampilan sangat bersih, kontras tinggi, ramah sentuhan santri.
- Input nomor antrean dan nama santri.
- Tab **Menu Kantin**: Santri dapat melihat katalog menu dan memilih makanan/minuman yang dipesan.
- Tab **Cek Status**: Santri dapat memantau status pesanannya (*Menunggu*, *Diproses*, *Siap*, *Selesai*).
- Proteksi anti-dobel nomor aktif.
- Tiket konfirmasi berhasil dengan animasi countdown otomatis.
- Gembok PIN rahasia untuk akses petugas (Kasir, Dapur, Admin).

### 👨‍🍳 Mode Dapur (PIN: `2222` / Akun: `dapur` / `dapur123`)
- Tampilan Kanban pesanan:
  1. **Pesanan Masuk (Menunggu)**: Detail nama, nomor antrean, dan catatan pesanan.
  2. **Sedang Dimasak (Diproses)**: Tombol *Mulai Siapkan*.
  3. **Siap Diambil (Siap)**: Tombol *Makanan Siap* untuk menginfokan kasir & santri.

### 💼 Mode Operator / Kasir (PIN: `1234` / Akun: `kasir` / `kasir123`)
- **SEDANG DILAYANI**: Display raksasa nomor & nama santri.
- Tombol aksi:
  - `🔊 PANGGIL`: Membunyikan bel denting (*chime*) dan suara synthesizer panggilan Bahasa Indonesia:
    *“Nomor A025, atas nama Ahmad, silakan maju.”*
  - `🔁 PANGGIL ULANG`: Panggil ulang santri yang belum mendengar.
  - `✅ SELESAI`: Menyelesaikan pesanan.
  - `⏭️ LEWATI`: Menandai santri yang belum hadir.
- Daftar antrean menunggu terurut.
- Tombol pintas `📱 Layar Santri` untuk mengunci kembali HP ke meja santri.

### 👑 Mode Admin (PIN: `9999` / Akun: `admin` / `admin123`)
- **🏠 Dashboard**: Statistik KPI harian, ringkasan omzet, dan feed antrean aktif.
- **👥 Antrean**: Manajemen seluruh antrean, filter status lengkap, batalkan antrean, dan hapus antrean yang salah.
- **📊 Laporan**: Analisis jam sibuk kantin (06:00 - 18:00), rata-rata durasi tunggu, dan ekspor dokumen.
- **⚙️ Pengaturan**: Uji coba bel panggilan dan reset antrean harian.

### 📊 Laporan Lengkap (Excel, CSV, PDF)
- Filter rentang periode: **Hari ini**, **Kemarin**, **Minggu ini**, **Bulan ini**, atau **Pilih tanggal sendiri**.
- Indikator efisiensi:
  - Total antrean & persentase selesai.
  - Total omzet pendapatan kantin.
  - Rata-rata waktu tunggu santri (menit).
  - Rata-rata waktu pelayanan kasir (menit).
- **Format Unduhan**:
  - `📥 Excel (.xlsx)`: 2 Sheet rapi (*Data Antrean* & *Ringkasan & Omzet*).
  - `📄 CSV`: Format standar untuk diimpor ke aplikasi spreadsheet lainnya.
  - `📑 PDF`: Dokumen siap cetak dengan tata letak laporan formal.

### 📺 Papan Layar TV / Monitor Dinding
- Tampilan layar penuh gelap elegan (*dark mode*) untuk monitor/TV gantung kantin.
- Nomor yang sedang dipanggil tampil raksasa bersama antrean berikutnya.

---

## 🗄️ 3. Arsitektur Database: Supabase PostgreSQL

Aplikasi menggunakan **Supabase PostgreSQL** sebagai satu-satunya database online terpusat.

### Tabel Database Utama (`supabase/schema.sql`):
1. `profiles`: Data pengguna dan petugas kantin beserta perannya (`admin`, `kasir`, `dapur`, `santri`).
2. `students`: Data santri, NIS, kelas/kamar, dan saldo.
3. `categories`: Kategori produk kantin (*Makanan Berat*, *Minuman Segar*, *Camilan*).
4. `products`: Daftar menu makanan dan minuman, harga, dan stok.
5. `queue_numbers`: Nomor urut antrean harian dengan constraint unik anti-duplikasi (`queue_date`, `daily_seq`).
6. `orders`: Catatan antrean dan pesanan santri beserta status (`menunggu`, `diproses`, `siap`, `selesai`, `dibatalkan`, `dilewati`).
7. `order_items`: Rincian item menu makanan dalam setiap pesanan.
8. `payments`: Riwayat pembayaran kasir (tunai, saldo santri, QRIS).
9. `inventory` & `inventory_movements`: Pengelolaan stok bahan dan barang kantin.
10. `daily_reports`: Agregasi laporan harian dan omzet.

### Cara Menjalankan Skema SQL di Supabase:
1. Buka dashboard [supabase.com](https://supabase.com) dan buat project baru.
2. Di bilah samping, buka menu **SQL Editor**.
3. Buka file `supabase/schema.sql` dari project ini, salin seluruh kodenya, lalu tempel di SQL Editor Supabase.
4. Klik tombol **Run**. Seluruh tabel, fungsi anti-duplikasi, RLS, dan seed data menu awal akan otomatis terpasang!

---

## 🔑 4. Environment Variables

Salin file `.env.example` ke `.env.local` saat mengembangkan aplikasi secara lokal:

```bash
cp .env.example .env.local
```

### Daftar Environment Variables Final:

Aplikasi menggunakan **Supabase Auth** untuk autentikasi pengguna. Role (`ADMIN`, `KASIR`, `DAPUR`, `SANTRI`) dikontrol langsung dari tabel `profiles` di database Supabase PostgreSQL. Tidak ada username, password, atau PIN yang disimpan di environment variable.

Aplikasi **hanya membutuhkan 3 variabel**:

| Variabel | Keterangan | Wajib/Opsional | Sumber Nilai |
| :--- | :--- | :--- | :--- |
| **`NEXT_PUBLIC_SUPABASE_URL`** | URL API project Supabase | **Wajib** | Supabase Dashboard → Settings → API |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | Anon public key Supabase (Aman di browser) | **Wajib** | Supabase Dashboard → Settings → API |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Secret service role key (Hanya Backend/Serverless) | **Opsional (Server-side)** | Supabase Dashboard → Settings → API |

> **Catatan Bersih**: Variabel `DAPUR_USERNAME`, `DAPUR_PASSWORD`, `DAPUR_PIN`, `ADMIN_*`, `KASIR_*`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `GITHUB_TOKEN`, dan `VERCEL_TOKEN` tidak digunakan dan telah dihapus sepenuhnya dari aplikasi.

---

## 🚀 5. Cara Menjalankan Aplikasi Secara Lokal

### Prasyarat
- **Node.js** (versi 18+)
- **npm** atau **bun**

### Langkah Menjalankan:
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Jalankan development server:**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

3. **Build untuk produksi:**
   ```bash
   npm run build
   ```

---

## 🌐 6. Panduan Deployment ke GitHub & Vercel

### A. Push ke GitHub
```bash
git add .
git commit -m "feat: implement Supabase Auth, database-controlled roles, and clean env variables"
git branch -M main
git remote add origin https://github.com/<username>/<nama-repo>.git
git push -u origin main
```

### B. Deploy di Vercel
1. Buka [vercel.com](https://vercel.com) dan login.
2. Klik **Add New...** → **Project**.
3. Pilih repository GitHub Anda (`antrean-kantin-santri`).
4. Pada bagian **Environment Variables**, cukup tambahkan **3 variabel** berikut:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Klik **Deploy**.
6. Aplikasi Anda akan langsung aktif dengan domain Vercel online (contoh: `https://antrean-kantin-santri.vercel.app`).

