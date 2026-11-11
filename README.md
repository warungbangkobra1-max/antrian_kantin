# 🏫 ANTREAN KANTIN SANTRI

> Sistem antrean kantin modern berbasis web & mobile dengan arsitektur **1 HP terpusat di meja kasir**, database online terpusat, sinkronisasi *real-time* multi-perangkat (Santri, Kasir, Admin, Layar TV), pemanggilan suara otomatis (*chime* & Text-to-Speech), serta laporan analitik lengkap yang dapat diekspor ke format Excel (.xlsx 3 Sheet).

---

## 📌 1. Konsep Utama & Alur Kerja

Aplikasi dirancang agar **sangat sederhana, cepat, dan mandiri**:

1. **1 HP di Meja Kasir**: Diletakkan menghadap santri saat memesan/mengambil makanan.
2. **Santri Mengisi Sendiri**:
   - Santri datang ke meja kasir.
   - Mengisi **Nomor Antrean** (kupon fisik/otomatis) dan **Nama Santri**.
   - Menekan tombol hijau besar **`🟢 AMBIL ANTREAN`**.
   - Santri **tidak perlu login**, tidak perlu akun, dan tidak perlu membawa HP pribadi.
3. **Data Langsung Tersimpan ke Server**:
   - Server memvalidasi agar nomor antrean yang sedang aktif **tidak dapat digunakan ganda**.
   - Layar santri menampilkan tiket berhasil:
     ```
     ✅ ANTREAN BERHASIL
     A025 - Ahmad
     Silakan menunggu sampai nomor dipanggil.
     ```
   - Dalam 4 detik, layar otomatis kembali ke form awal untuk santri berikutnya.
4. **Kasir Memanggil Antrean**:
   - Kasir membuka Mode Operator dengan **PIN 4-digit** (`1234`).
   - Kasir menekan `🔊 PANGGIL` / `🔁 PANGGIL ULANG` / `✅ SELESAI` / `⏭️ LEWATI`.
   - Speaker HP membunyikan bel denting (*crystal chime*) dan suara panggilan Bahasa Indonesia:
     *“Nomor A025, atas nama Ahmad, silakan maju.”*
   - Dengan 1 sentuhan tombol `📱 Layar Santri`, HP langsung terkunci kembali ke mode santri.
5. **Admin & Layar TV Terhubung Real-Time**:
   - Setiap aksi pemanggilan atau penyelesaian di kasir langsung terupdate di HP Admin dan Layar TV tanpa perlu refresh manual.

---

## 🌟 2. Fitur-Fitur Utama

### 📱 Mode Santri (Kiosk Mandiri)
- Tampilan sangat bersih, kontras tinggi, dan ramah sentuhan.
- Hanya menampilkan kolom input nomor, nama, dan tombol besar **AMBIL ANTREAN**.
- Proteksi anti-dobel: Menolak jika nomor antrean sedang aktif di antrean.
- Layar konfirmasi berhasil dengan animasi countdown otomatis.
- Tombol rahasia gembok PIN untuk petugas di sudut atas.

### 💼 Mode Operator / Kasir (PIN: `1234`)
- **SEDANG DIPANGGIL**: Kartu display besar nomor & nama santri.
- **Kontrol Antrean**:
  - `🔊 PANGGIL`: Membunyikan bel dan suara panggilan.
  - `🔁 PANGGIL ULANG`: Memanggil kembali santri yang belum mendengar.
  - `✅ SELESAI`: Menyelesaikan pesanan dan memuat antrean berikutnya.
  - `⏭️ LEWATI`: Menandai santri yang belum hadir.
- **Daftar Antrean Menunggu**: Urutan santri berikutnya siap dilayani.
- **Tombol Pintas `📱 Layar Santri`**: Mengunci kembali ke mode santri dalam 1 klik.

### 👑 Mode Admin (PIN: `9999` / Akun: `admin` / `admin123`)
- **🏠 Dashboard**: Ringkasan KPI antrean harian, antrean aktif, dan feed waktu nyata.
- **👥 Antrean**: Tabel manajemen status antrean, batalkan antrean, dan hapus antrean salah.
- **📊 Laporan**: Filter laporan berdasarkan tanggal/periode, grafik jam sibuk, dan unduh Excel.
- **⚙️ Pengaturan**: Uji coba suara bel dan konfirmasi reset antrean harian.

### 📊 Laporan & Unduh Excel (.xlsx)
- Pilihan periode: **Hari ini**, **Kemarin**, **Minggu ini**, **Bulan ini**, atau **Pilih tanggal sendiri**.
- Indikator efisiensi:
  - Rata-rata waktu tunggu santri.
  - Rata-rata waktu pelayanan kasir.
  - Grafik batang jumlah antrean per jam (jam sibuk kantin 06:00 - 18:00).
- **Unduh File Excel (.xlsx) 3 Sheet Rapi**:
  - `Sheet 1 – Data Antrean`: Detail lengkap per santri (ID, Tanggal, Jam Masuk, Nomor, Nama, Status, Jam Dipanggil, Jam Selesai, Waktu Tunggu, Operator).
  - `Sheet 2 – Ringkasan`: Rekapitulasi total santri, persentase penyelesaian, rata-rata durasi.
  - `Sheet 3 – Statistik Harian`: Tren antrean per tanggal.

### 📺 Papan Layar TV / Monitor Dinding
- Tampilan layar penuh gelap elegan (*dark mode*) untuk dipasang di monitor/TV dinding kantin.
- Menampilkan nomor yang sedang dipanggil dalam ukuran raksasa dan antrean berikutnya.

---

## 🗄️ 3. Arsitektur Database & Real-Time

- **Server-Authoritative**: Server Node.js/Express (`server.ts`) menjadi satu-satunya sumber kebenaran (*single source of truth*).
- **Real-Time Streaming**: Menggunakan teknologi **Server-Sent Events (SSE)** pada rute `/api/queues/events`.
- **Penyimpanan Persisten**: Data tersimpan secara persisten pada file `data/queues.json` dengan penulisan atomik. Data tidak akan hilang saat server atau browser di-refresh.
- **Resiliensi Jaringan**:
  - Tampilan indikator `🟢 ONLINE` / `🔴 OFFLINE`.
  - Otomatis rekonsiliasi dan sinkronisasi ulang saat koneksi internet pulih.

---

## 🚀 4. Panduan Menjalankan Aplikasi

### Prasyarat
- **Node.js** (versi 18 ke atas)
- **npm** atau **bun**

### Langkah Instalasi

1. **Clone repository:**
   ```bash
   git clone https://github.com/<username>/<nama-repo>.git
   cd antrean-kantin-santri
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment:**
   Salin file konfigurasi contoh:
   ```bash
   cp .env.example .env
   ```
   Sesuaikan variabel jika diperlukan (misal: PIN kasir, password admin).

4. **Jalankan Mode Pengembangan:**
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:3000`.

5. **Build Produksi:**
   ```bash
   npm run build
   npm start
   ```

---

## ⚙️ 5. Konfigurasi Environment (`.env`)

Aplikasi hanya memerlukan variabel lingkungan berikut untuk autentikasi server-side dan port server (tidak menggunakan GitHub OAuth atau token eksternal di aplikasi):

| Variabel | Keterangan | Default | Lokasi Validasi |
|---|---|---|---|
| `PORT` | Port server Node.js | `3000` | Server-side |
| `NODE_ENV` | Mode runtime (`development` / `production`) | `production` | Server-side |
| `APP_URL` | Base URL deployment aplikasi | `http://localhost:3000` | Server-side |
| `ADMIN_USERNAME` | Username login Administrator | `admin` | Server-side |
| `ADMIN_PASSWORD` | Password login Administrator | `admin123` | Server-side |
| `ADMIN_PIN` | PIN 4-digit akses Administrator di layar kiosk | `9999` | Server-side |
| `KASIR_USERNAME` | Username login Operator Kasir | `kasir` | Server-side |
| `KASIR_PASSWORD` | Password login Operator Kasir | `kasir123` | Server-side |
| `KASIR_PIN` | PIN 4-digit akses Mode Kasir di meja kasir | `1234` | Server-side |

> **Catatan Sinkronisasi GitHub**: Penyimpanan dan sinkronisasi source code GitHub dikelola langsung melalui fitur GitHub bawaan Google AI Studio. Aplikasi tidak membutuhkan `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, atau `GITHUB_TOKEN`.

---

## ☁️ 6. Panduan Deployment ke Vercel

Aplikasi ini sudah dikonfigurasi penuh dengan file `vercel.json` dan serverless entry point `api/index.ts` sehingga dapat langsung di-deploy dari repository GitHub ke Vercel:

```
Google AI Studio  →  GitHub (antrean-kantin-santri)  →  Vercel  →  Aplikasi Online
```

### Langkah Deployment ke Vercel:

1. **Login ke Vercel**: Buka [vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
2. **Import Repository**:
   - Klik tombol **"Add New..."** lalu pilih **"Project"**.
   - Cari dan pilih repository **`antrean-kantin-santri`** (atau repository yang Anda hubungkan).
3. **Konfigurasi Project**:
   - **Framework Preset**: *Vite* (terdeteksi otomatis).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables di Vercel Dashboard** (Settings → Environment Variables):
   Tambahkan variabel berikut:
   - `ADMIN_USERNAME` = `admin`
   - `ADMIN_PASSWORD` = `(password admin Anda)`
   - `ADMIN_PIN` = `9999`
   - `KASIR_USERNAME` = `kasir`
   - `KASIR_PASSWORD` = `(password kasir Anda)`
   - `KASIR_PIN` = `1234`
   - *(Opsional Database Online)*: Tambahkan integrasi **Upstash Redis / Vercel KV** di tab **Storage** Vercel, maka variabel `KV_REST_API_URL` dan `KV_REST_API_TOKEN` akan otomatis terisi untuk database online terpusat permanen.
5. **Klik "Deploy"**:
   - Vercel akan otomatis melakukan build frontend (`dist`) dan mendeploy API backend ke Serverless Function (`/api`).
   - Aplikasi siap diakses online melalui domain Vercel Anda, misalnya: `https://antrean-kantin-santri.vercel.app`.

---

## ☁️ 7. Panduan Deployment Alternatif (Docker / VPS)

### A. Google Cloud Run / Docker
Aplikasi sudah siap dijalankan di container Docker atau Google Cloud Run:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### B. VPS (Ubuntu/Debian dengan PM2)
```bash
# Build aplikasi
npm run build

# Jalankan dengan PM2
npm install -g pm2
pm2 start server.ts --name "kantin-santri" --interpreter tsx
pm2 save
pm2 startup
```

---

## 📄 Lisensi
Apache-2.0 License. Dibuat khusus untuk kenyamanan dan ketertiban kantin santri di pondok pesantren.
