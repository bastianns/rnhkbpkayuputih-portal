-- ==========================================================
-- 05_PERFORMANCE_INDEXES.SQL: OPTIMIZATION
-- ==========================================================

-- 1. Index untuk filter tahun lahir (expression index)
-- Mempercepat pencarian kandidat berdasarkan tahun lahir tanpa scan seluruh tabel
CREATE INDEX IF NOT EXISTS idx_anggota_tahun_lahir 
ON public.anggota (EXTRACT(YEAR FROM tanggal_lahir));

-- 2. Composite index untuk kandidat terkuat
-- Menggabungkan wijk dan tanggal lahir untuk pencarian presisi
CREATE INDEX IF NOT EXISTS idx_anggota_wijk_lahir 
ON public.anggota (id_wijk, tanggal_lahir);

-- 3. Index untuk tabel karantina agar admin dashboard lancar
CREATE INDEX IF NOT EXISTS idx_quarantine_status ON public.quarantine_anggota (status);
CREATE INDEX IF NOT EXISTS idx_quarantine_created_at ON public.quarantine_anggota (created_at DESC);
