-- ==========================================================
-- SEED.SQL: INITIAL DATA FOR MILESTONE 1 (FIXED)
-- ==========================================================

-- 1. DATA MASTER WIJK (WILAYAH)
-- Mengisi daftar wilayah awal agar dropdown di portal tidak kosong
INSERT INTO public.wijk (nama_wijk, kode_wijk, status_wijk) VALUES
('Wijk 1', 'W01', 'active'),
('Wijk 2', 'W02', 'active'),
('Wijk 3', 'W03', 'active'),
('Wijk 4', 'W04', 'active'),
('Wijk 5', 'W05', 'active')
ON CONFLICT (nama_wijk) DO NOTHING;

-- 2. PARAMETER DEDUPLIKASI (FELLEGI-SUNTER)
-- match_probability_m: Probabilitas data sama jika orangnya memang sama.
-- unmatch_probability_u: Probabilitas data sama padahal orangnya berbeda.
-- Bobot agreement/disagreement akan dihitung otomatis oleh kolom GENERATED.
INSERT INTO public.dedup_parameter (field_name, match_probability_m, unmatch_probability_u) VALUES
('nama_lengkap', 0.9, 0.01),
('tanggal_lahir', 0.95, 0.005),
('id_wijk', 0.7, 0.1)
ON CONFLICT (field_name) DO UPDATE SET 
    match_probability_m = EXCLUDED.match_probability_m,
    unmatch_probability_u = EXCLUDED.unmatch_probability_u;

-- 3. DATA MASTER KATEGORI (PENDUKUNG UI)
-- Perbaikan: Setiap nilai kategori dibungkus kurung terpisah
INSERT INTO public.ref_kategori_peran (nama_kategori) VALUES 
('BPH'), 
('Seksi'), 
('Anggota Biasa') 
ON CONFLICT (nama_kategori) DO NOTHING;

INSERT INTO public.kategori_kegiatan (nama_kategori, bobot_dasar) VALUES 
('Ibadah Rutin', 1.0), 
('Rapat', 0.5), 
('Seminar/Workshop', 1.5) 
ON CONFLICT (nama_kategori) DO NOTHING;

-- PERBAIKAN DI SINI: Baris data dipisahkan dengan koma dan kurung masing-masing
INSERT INTO public.ref_kategori_kesibukan (nama_kategori) VALUES 
('Pelajar'), 
('Mahasiswa'), 
('Bekerja'), 
('Mencari Kerja') 
ON CONFLICT (nama_kategori) DO NOTHING;