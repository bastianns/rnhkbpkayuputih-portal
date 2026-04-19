# Portal Manajemen Data RNHKBP Kayu Putih (Portal-MVP)

Portal Manajemen Data RNHKBP (Naposobulung) adalah sistem terpadu untuk pengelolaan basis data jemaat yang berfokus pada **Single Source of Truth (SSOT)** dan integritas data melalui mekanisme **Quarantine** dan **Deduplikasi**.

## 🚀 Fitur Utama

- **Registrasi & Karantina Anggota**: Data pendaftaran baru masuk ke sistem karantina terlebih dahulu untuk divalidasi oleh admin sebelum masuk ke database utama (SSOT).
- **Identity Vetting (Deduplikasi)**: Menggunakan engine berbasis algoritma *Fellegi-Sunter* untuk mendeteksi potensi duplikasi data jemaat.
- **Admin Panel (SSOT Command Center)**:
  - **Manajemen Antrean**: Approval/Reject data dari karantina.
  - **Master Data (Golden Records)**: Manajemen data jemaat yang sudah terverifikasi.
  - **Manajemen Kegiatan**: Pembuatan jadwal kegiatan dan sistem absensi/check-in.
  - **Audit Log**: Jejak audit lengkap untuk setiap aksi yang dilakukan oleh operator/admin.
  - **Leaderboard Wijk**: Visualisasi keaktifan jemaat berdasarkan wilayah (Wijk).
- **Dashboard Jemaat**: Statistik kehadiran dan profil keaktifan individu.
- **Sistem Absensi**: Check-in berbasis web untuk kegiatan rutin gereja.

## 🔄 Alur Sistem (Workflow)

### 1. Alur Pendaftaran (Quarantine to SSOT)
1. **Anggota** melakukan pendaftaran melalui form registrasi.
2. Data masuk ke tabel **Quarantine** (Status: *Pending*).
3. **Admin** memeriksa antrean di menu "Queue".
4. Jika data valid dan tidak duplikat, Admin menekan tombol **Approve & Merge**.
5. Data dipindahkan ke tabel **Master Anggota** (Golden Record) dan akun autentikasi diaktifkan.

### 2. Alur Absensi (Check-in)
1. **Admin** membuka gerbang absensi pada kegiatan tertentu.
2. **Anggota** masuk ke halaman check-in kegiatan.
3. Sistem mencatat kehadiran secara *real-time* ke dalam database absensi.
4. Data absensi akan mempengaruhi skor keaktifan pada **Leaderboard Wijk**.

## 📖 Panduan Penggunaan

### A. Untuk Anggota / Jemaat
1. **Registrasi**: Buka halaman `/register`, lengkapi identitas, pilih Wijk, dan setujui UU PDP.
2. **Login**: Setelah akun divalidasi admin, login melalui `/login` menggunakan email terdaftar.
3. **Dashboard**: Lihat statistik kehadiran Anda dan histori kegiatan yang diikuti.

### B. Untuk Admin / Operator
1. **Validasi Antrean**: Cek menu **Queue** secara berkala. Pastikan data pendaftar valid sebelum di-approve.
2. **Manajemen Kegiatan**: Buat kegiatan baru di menu **Events** sebelum ibadah/kegiatan dimulai agar jemaat bisa melakukan check-in.
3. **Audit Log**: Pantau menu **Logs** untuk memastikan tidak ada aktivitas mencurigakan atau kesalahan operasional.

## 🛠️ Panduan Teknis (Developer)

### Tech Stack
- **Framework**: Next.js 15 (App Router).
- **Language**: TypeScript.
- **Database & Auth**: Supabase (PostgreSQL).
- **Styling**: Tailwind CSS & Vanilla CSS (prefixCls patterns).
- **Animations**: Anime.js & Motion.

### Arsitektur & Standar Kode
Proyek ini mengikuti standar **React Component Best Practices** (rc-components):
1. **Single Responsibility Principle (SRP)**: Komponen besar dipecah menjadi sub-komponen kecil.
2. **MVC Pattern**: Pemisahan tegas antara `Controller` (Server Actions), `Model` (Database Query), dan `View` (React Components).
3. **Custom Hooks**: Logika bisnis diekstraksi ke dalam hooks di folder `src/hooks/`.
4. **prefixCls**: Penggunaan properti `prefixCls` pada komponen UI untuk mendukung kustomisasi gaya global.

### Alur Git (Semantic Commit)
Commit harus menggunakan Bahasa Indonesia dengan format:
- `feat(<scope>):` untuk fitur baru.
- `refactor:` untuk perbaikan struktur kode.
- `fix:` untuk perbaikan bug.

## 💻 Instalasi Lokal

1. Clone repositori ini.
2. Jalankan `npm install`.
3. Buat file `.env.local` dan masukkan kredensial Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
4. Jalankan `npm run dev`.

## 📊 Evaluasi & Validasi
Sistem dievaluasi berdasarkan:
- **Integritas Data**: Tidak ada data ganda di dalam Golden Records (SSOT).
- **Auditability**: Setiap perubahan data harus tercatat di Audit Log.
- **Usability**: Kecepatan proses registrasi hingga approval oleh admin.

---
*© 2026 RNHKBP Kayu Putih - Dikembangkan untuk kemuliaan nama Tuhan.*
