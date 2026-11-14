# SUANGGI CARI KO

Sistem Informasi Lalu Lintas Hewan, Produk Hewan, dan Olahannya
Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika

---

## 1. Ringkasan Sistem

SUANGGI CARI KO (Sistem Updating Arus Niaga dan Gerak Hewan, produk hewan, dan olahannya – Catatan Arus, Rekapitulasi, dan Informasi KOmoditas) merupakan platform digital terpadu milik Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika. Sistem ini berfungsi untuk memonitor, mencatat, merekapitulasi, dan melayani lalu lintas komoditas hewan hidup, bahan pangan asal hewan segar/beku, serta olahan hasil peternakan yang masuk maupun keluar dari wilayah Kabupaten Mimika melalui pos pemeriksaan Pelabuhan Laut Pomako dan Bandara Mozes Kilangin.

Sistem terdiri atas tiga komponen utama dalam satu repositori (monorepo):
- Frontend: Portal publik dan dashboard internal berbasis React, TypeScript, dan Tailwind CSS.
- Backend API: Layanan RESTful API berkinerja tinggi berbasis Rust (Axum, Tokio, SQLx).
- WhatsApp Bot: Layanan bot interaktif berbasis Node.js (NestJS dan Baileys) untuk pelayanan informasi publik dan pencatatan aduan masyarakat langsung ke database.

---

## 2. Struktur Repositori

```text
silantas/
├── backend/                  # REST API berbasis Rust (Axum + SQLx)
│   ├── Cargo.toml
│   ├── dockerfile            # Multi-stage Docker build untuk binary Rust
│   └── src/                  # Kode sumber modul API, rute, dan model
├── frontend/                 # Web aplikasi React + Vite + Tailwind CSS
│   ├── package.json
│   ├── src/                  # Komponen UI, halaman publik, dan dashboard admin
│   └── vite.config.ts
├── whatsapp-bot/             # Chatbot WhatsApp resmi berbasis NestJS + Baileys
│   ├── dockerfile            # Multi-stage Docker build untuk NestJS bot
│   ├── .dockerignore
│   ├── package.json
│   └── src/                  # Modul chatbot, Baileys socket, dan koneksi database
├── .github/
│   └── workflows/
│       └── ci.yml            # CI/CD pipeline: build GHCR, deploy DewaCloud & Vercel
├── docker-compose.yml        # Orkestrasi container API dan WhatsApp Bot
├── .env.example              # Template variabel lingkungan sistem
└── .gitignore
```

---

## 3. Komponen Sistem

### 3.1. Frontend Web

Aplikasi web publik dan dashboard operasional petugas.
- Teknologi: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion.
- Hosting: Vercel (Production URL: https://silantas.vercel.app/).
- Modul Publik:
  - Beranda dan panduan regulasi komoditas hewan hidup, daging beku, dan telur.
  - Persyaratan administrasi pemasukan, pengeluaran, dan penerbitan SKKH.
  - Standar rantai dingin (cold chain) dan higinitas sanitasi (NKV).
  - Integrasi tombol konsultasi cepat WhatsApp resmi dinas.
- Modul Dashboard Internal (Petugas):
  - Pencatatan dan verifikasi lalu lintas hewan (arus masuk/keluar).
  - Rekapitulasi data komoditas dan visualisasi volume arus niaga.
  - Manajemen rekapan aduan WhatsApp (WhatsappRecapPage).
  - Manajemen akun pengguna dan hak akses berbasis peran (RBAC).
  - Audit logging seluruh aktivitas transaksi data.
  - Backup dan restore database.

### 3.2. Backend REST API

Layanan inti pengolahan data dan aturan bisnis sistem.
- Teknologi: Rust 1.80+, Axum framework, Tokio runtime, SQLx.
- Port Container: 8000 (Dipetakan ke host port 8002 untuk reverse proxy Nginx).
- Database: PostgreSQL (schema `silantas`).
- Cache: Mini-Redis in-node cache untuk optimasi performa ringkasan data.
- Fitur Utama:
  - Autentikasi aman menggunakan JSON Web Token (JWT) dan hashing Argon2id.
  - Endpoint CRUD komoditas lalu lintas hewan beserta manajemen lampiran berkas.
  - Endpoint rekapan aduan WhatsApp dan unggah bukti tangkapan layar.
  - Pencatatan jejak audit (audit trail) otomatis untuk setiap operasi data.
  - Streaming backup database PostgreSQL.

### 3.3. WhatsApp Bot Pelayanan Publik

Layanan otomatisasi interaksi pesan WhatsApp untuk masyarakat dan pelaku usaha.
- Teknologi: Node.js 22 LTS, NestJS framework, @whiskeysockets/baileys, pg (node-postgres).
- Mode Akses: Berjalan di server yang sama, terhubung langsung ke database PostgreSQL dan backend internal tanpa mengekspos port ke internet publik.
- Fitur Utama:
  - Menu Interaktif Formal (4 Pilihan):
    1. Persyaratan Pemasukan Hewan dan Produk Masuk.
    2. Pengeluaran Hewan dan Penerbitan SKKH.
    3. Ketentuan Produk Olahan dan Rantai Dingin.
    4. Lapor Keluhan / Aduan Masyarakat dan Penyakit Ternak.
  - Integrasi Aduan Otomatis ke Database:
    Setiap pesan yang dikirimkan warga melalui Menu 4 secara otomatis disimpan ke tabel `silantas.whatsapp_recaps` dengan atribut:
    - service_type: 'BANTUAN'
    - status: 'BARU'
    - address: 'Kabupaten Mimika'
    - reporter_name dan reporter_phone: diambil otomatis dari akun pengirim.
    - Menghasilkan nomor tiket aduan resmi (contoh: ADU-XXXXXXXX).
    - Laporan langsung muncul di tabel teratas dashboard admin web untuk ditindaklanjuti petugas.
  - Admin Interlock 100% Otomatis:
    Bot membedakan pesan otomatis sistem dengan pesan yang diketik langsung oleh petugas admin melalui smartphone, WhatsApp Web, atau Desktop. Saat admin membalas chat warga, bot seketika membisu (mute) tanpa memerlukan perintah manual.
  - Jeda Cooldown 4 Jam:
    Bot tetap hening selama 4 jam setelah balasan terakhir admin agar percakapan personal tidak terganggu. Sesi tersimpan persisten di `data/chatbot_sessions.json`.
  - Override Perintah Warga:
    Jika warga ingin memunculkan kembali menu layanan sebelum 4 jam berakhir, warga cukup mengetik kata kunci `MENU`, `#MENU`, atau `0`.
  - Proteksi Anti-Spam:
    Dilengkapi buffer debouncing 1.5 detik untuk merangkum pesan beruntun, rate limiting (maksimal 6 pesan per 30 detik), dan pengabaian pesan grup/broadcast.

---

## 4. Konfigurasi Variabel Lingkungan (.env)

Buat file `.env` di root direktori dengan menyalin dari `.env.example`:

```env
# Frontend Web
FRONTEND_WEB_URL=https://silantas.vercel.app/

# Backend API Configuration
HOST=localhost
PORT=8000
JWT_SECRET=rahasia-kunci-jwt-ganti-di-produksi
VITE_API_BASE_URL=http://localhost:8000
MINI_REDIS_ENABLED=true

# Database PostgreSQL
POSTGRESQL_USERNAME=webadmin
POSTGRESQL_PASSWORD=password_database_anda
POSTGRESQL_HOST=host_database_anda
POSTGRESQL_PORT=5432
POSTGRESQL_DATABASE=postgres

# WhatsApp Bot Configuration
# Catatan: Di docker-compose, PORT=3000 otomatis disetel untuk container bot
ADMIN_COOLDOWN_HOURS=4
DEBOUNCE_MS=1500
SILANTAS_BACKEND_URL=http://silantas-api:8000
```

---

## 5. Menjalankan Sistem Secara Lokal (Development)

### 5.1. Prasyarat Sistem
- Node.js versi 20 atau 22 LTS
- Rust compiler versi stable (1.80+)
- PostgreSQL Database
- Git

### 5.2. Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
Aplikasi frontend akan aktif di http://localhost:5173.

### 5.3. Menjalankan Backend API
```bash
cd backend
cargo run
```
API akan aktif di http://localhost:8000.

### 5.4. Menjalankan WhatsApp Bot
```bash
cd whatsapp-bot
npm install
npm run start:dev
```
Terminal akan menampilkan QR Code untuk dipindai menggunakan nomor resmi WhatsApp dinas. Setelah terhubung, kredensial tersimpan di folder `whatsapp-bot/auth_info/`.

---

## 6. Orkestrasi Docker dan Deployment Server (Production)

### 6.1. Docker Compose
Sistem menggunakan `docker-compose.yml` untuk mengorkestrasikan backend API dan WhatsApp Bot pada server produksi (DewaCloud).

Isi layanan compose:
- `silantas-api`:
  - Image: `ghcr.io/evangelionxyz/silantas-api:latest`
  - Port: `8002:8000` (terbuka ke host untuk Nginx)
  - Volume: `./uploads:/app/uploads`
- `whatsapp-bot`:
  - Image: `ghcr.io/evangelionxyz/silantas-whatsapp-bot:latest`
  - Port: Tidak mengekspos port ke host (komunikasi privat)
  - Volume:
    - `./whatsapp-bot/auth_info:/app/auth_info` (persisik kredensial login WhatsApp)
    - `./whatsapp-bot/data:/app/data` (persisik data sesi dan cooldown chatbot)
  - Dependency: Membutuhkan `silantas-api` berjalan terlebih dahulu.

Perintah menjalankan di server:
```bash
cd ~/Silantas
docker compose pull
docker compose up -d --remove-orphans
```

### 6.2. Memindahkan Kredensial WhatsApp (auth_info) ke Server
Agar server produksi tidak perlu melakukan scan ulang QR code, folder `auth_info/` dari komputer lokal dapat disalin langsung ke server:

1. Pastikan proses WhatsApp bot di komputer lokal sudah dihentikan.
2. Kompres folder `auth_info`:
   ```bash
   tar -czf auth_info.tar.gz -C whatsapp-bot auth_info
   ```
3. Unggah ke server via SCP:
   ```bash
   scp -P <PORT_SSH> auth_info.tar.gz <USER>@<HOST>:~/Silantas/whatsapp-bot/
   ```
4. Ekstrak di server:
   ```bash
   cd ~/Silantas/whatsapp-bot
   tar -xzf auth_info.tar.gz
   rm auth_info.tar.gz
   ```
5. Restart container bot:
   ```bash
   docker restart silantas-whatsapp-bot
   ```

---

## 7. CI/CD dan Otomasi Rilis (.github/workflows/ci.yml)

Repositori dikonfigurasi dengan GitHub Actions untuk penerapan otomatis (Continuous Deployment):
1. Setiap commit yang di-push ke branch `master` pada direktori terkait akan memicu alur kerja otomatis.
2. Build Image Paralel:
   - `build-and-push`: Membangun Docker image backend Rust dan mengunggah ke GitHub Container Registry (`ghcr.io/evangelionxyz/silantas-api`).
   - `build-and-push-bot`: Membangun Docker image NestJS WhatsApp bot dan mengunggah ke GitHub Container Registry (`ghcr.io/evangelionxyz/silantas-whatsapp-bot`).
3. Deploy DewaCloud:
   - Menghubungkan ke VPS/server via SSH.
   - Menyiapkan folder penyimpanan persisten.
   - Menarik image terbaru dari GHCR dan me-restart container dengan Docker Compose.
4. Deploy Vercel:
   - Mengompilasi dan men-deploy frontend web publik secara otomatis ke Vercel production.

---

## 8. Pengujian dan Standar Kualitas Kode

Pengujian unit dan linting dapat dijalankan pada modul masing-masing:

### 8.1. Pengujian WhatsApp Bot
```bash
cd whatsapp-bot
# Menjalankan 17 unit test cases
npm test

# Menjalankan type-aware linter
npm run lint

# Kompilasi build NestJS
npm run build
```

### 8.2. Pengujian Backend Rust
```bash
cd backend
cargo test
cargo check --release
```

---

## 9. Lisensi dan Hak Cipta

Hak Cipta (c) 2026 Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika.
Seluruh hak cipta dilindungi undang-undang.
