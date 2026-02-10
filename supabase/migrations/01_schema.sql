-- ==========================================================
-- 01_SCHEMA.SQL: DATABASE FOUNDATION (MILESTONE 1)
-- ==========================================================

-- 1. AKTIVASI EKSTENSI (EXTENSIONS)
-- Digunakan untuk UUID dan pencarian nama yang mirip (fuzzy matching)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  

-- ==========================================================
-- LEVEL 0: TABEL REFERENSI & LOG (MASTER DATA)
-- ==========================================================

CREATE TABLE public.wijk (
    id_wijk UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_wijk VARCHAR(255) NOT NULL UNIQUE,
    kode_wijk VARCHAR(50) UNIQUE,
    status_wijk VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE public.ref_kategori_peran (
    id_kategori_peran UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kategori VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE public.kategori_kegiatan (
    id_kategori_kegiatan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kategori VARCHAR(255) NOT NULL UNIQUE,
    bobot_dasar NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE public.ref_kategori_kesibukan (
    id_kategori_kesibukan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kategori VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE public.dedup_parameter (
    field_name VARCHAR(50) PRIMARY KEY,
    match_probability_m NUMERIC NOT NULL,
    unmatch_probability_u NUMERIC NOT NULL,
    weight_agreement NUMERIC GENERATED ALWAYS AS (ln(match_probability_m / unmatch_probability_u)) STORED,
    weight_disagreement NUMERIC GENERATED ALWAYS AS (ln((1 - match_probability_m) / (1 - unmatch_probability_u))) STORED,
    CONSTRAINT chk_prob_range CHECK (
        match_probability_m > 0 AND match_probability_m < 1 AND 
        unmatch_probability_u > 0 AND unmatch_probability_u < 1 AND 
        match_probability_m > unmatch_probability_u
    )
);

CREATE TABLE public.audit_log (
    id_audit UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- LEVEL 1: ENTITAS UTAMA
-- ==========================================================

CREATE TABLE public.anggota (
    id_anggota UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_wijk UUID REFERENCES public.wijk(id_wijk),
    nama_lengkap VARCHAR(255) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    alamat TEXT,
    no_telp VARCHAR(20) CHECK (char_length(no_telp) <= 20),
    status_keanggotaan VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE public.katalog_peran (
    id_peran UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_kategori_peran UUID REFERENCES public.ref_kategori_peran(id_kategori_peran),
    nama_peran VARCHAR(255) NOT NULL,
    bobot_kontribusi NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE public.kegiatan (
    id_kegiatan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_kategori_kegiatan UUID REFERENCES public.kategori_kegiatan(id_kategori_kegiatan),
    nama_kegiatan VARCHAR(255) NOT NULL,
    tanggal_mulai TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE public.quarantine_anggota (
    id_quarantine UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_data JSONB,
    error_details TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- LEVEL 2: TABEL OPERASIONAL & KUALITAS (DEPENDEN)
-- ==========================================================

CREATE TABLE public.riwayat_partisipasi (
    id_partisipasi UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_peran UUID REFERENCES public.katalog_peran(id_peran),
    id_kegiatan UUID REFERENCES public.kegiatan(id_kegiatan) ON DELETE CASCADE,
    id_anggota UUID REFERENCES public.anggota(id_anggota) ON DELETE CASCADE,
    status_kehadiran VARCHAR(50),
    waktu_check_in TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.kesibukan_anggota (
    id_kesibukan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_anggota UUID REFERENCES public.anggota(id_anggota) ON DELETE CASCADE,
    id_kategori_kesibukan UUID REFERENCES public.ref_kategori_kesibukan(id_kategori_kesibukan),
    domisili_aktivitas TEXT,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.anggota_consent (
    id_consent UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_anggota UUID NOT NULL REFERENCES public.anggota(id_anggota) ON DELETE CASCADE,
    consent_text_version VARCHAR(50) NOT NULL,
    purpose TEXT NOT NULL,
    consent_given_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consent_withdrawn_at TIMESTAMPTZ,
    withdrawn_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menjamin hanya ada 1 consent aktif per anggota (PDP Compliance)
CREATE UNIQUE INDEX IF NOT EXISTS uq_consent_active 
ON public.anggota_consent(id_anggota) WHERE consent_withdrawn_at IS NULL;

-- Antrean review duplikasi (menghubungkan anggota lama vs data karantina)
CREATE TABLE public.dedup_candidate (
    id_candidate UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_anggota_a UUID NOT NULL REFERENCES public.anggota(id_anggota) ON DELETE CASCADE,
    id_anggota_b UUID REFERENCES public.anggota(id_anggota) ON DELETE CASCADE,
    id_quarantine_b UUID REFERENCES public.quarantine_anggota(id_quarantine) ON DELETE CASCADE,
    score NUMERIC NOT NULL,
    decision VARCHAR(20) NOT NULL DEFAULT 'possible',
    decided_by UUID,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_target_exists CHECK (id_anggota_b IS NOT NULL OR id_quarantine_b IS NOT NULL),
    CONSTRAINT chk_not_self_pair CHECK (id_anggota_a <> id_anggota_b)
);

-- ==========================================================
-- OPTIMASI: INDEKS PERFORMA
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_anggota_id_wijk ON public.anggota(id_wijk);
CREATE INDEX IF NOT EXISTS idx_partisipasi_id_anggota ON public.riwayat_partisipasi(id_anggota);
CREATE INDEX IF NOT EXISTS idx_anggota_nama_trgm ON public.anggota USING gin (nama_lengkap gin_trgm_ops);