-- ==========================================================
-- 07_FIX_MISSING_TABLES.SQL
-- Menambahkan tabel ref_keahlian yang terlewat di Milestone 1
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.ref_keahlian (
    id_keahlian UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_keahlian VARCHAR(255) NOT NULL UNIQUE,
    bobot_keahlian NUMERIC DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Seed data awal untuk Keahlian
INSERT INTO public.ref_keahlian (nama_keahlian, bobot_keahlian) VALUES
('Musik/Band', 1.5),
('Vokal/Paduan Suara', 1.2),
('Multimedia/IT', 1.5),
('Dekorasi/Artistik', 1.0),
('Public Speaking/MC', 1.2),
('Administrasi/Sekretariat', 1.0)
ON CONFLICT (nama_keahlian) DO NOTHING;

-- Tambahkan audit trigger jika fungsi audit sudah ada
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_log_audit_pk') THEN
        DROP TRIGGER IF EXISTS tr_audit_keahlian ON public.ref_keahlian;
        CREATE TRIGGER tr_audit_keahlian AFTER INSERT OR UPDATE OR DELETE ON public.ref_keahlian 
        FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit_pk('id_keahlian');
    END IF;
END $$;
