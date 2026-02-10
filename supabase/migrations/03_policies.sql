-- ==========================================================
-- 03_POLICIES.SQL: SECURITY & ACCESS CONTROL (RLS)
-- ==========================================================

-- 1. AKTIVASI RLS PADA TABEL UTAMA
-- Memastikan tidak ada akses publik tanpa kebijakan eksplisit
ALTER TABLE public.anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anggota_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarantine_anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dedup_candidate ENABLE ROW LEVEL SECURITY;

-- 2. KEBIJAKAN UNTUK AUDIT LOG
-- Siapapun yang terautentikasi bisa mencatat log, tapi hanya Admin yang bisa melihat
DROP POLICY IF EXISTS audit_insert_auth ON public.audit_log;
CREATE POLICY audit_insert_auth ON public.audit_log 
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS audit_read_mgr ON public.audit_log;
CREATE POLICY audit_read_mgr ON public.audit_log 
    FOR SELECT TO authenticated 
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','internal') );

-- 3. KEBIJAKAN UNTUK TABEL ANGGOTA
-- Pengurus bisa melihat daftar anggota, tapi hanya Admin yang bisa menambah/ubah secara manual
DROP POLICY IF EXISTS anggota_read_auth ON public.anggota;
CREATE POLICY anggota_read_auth ON public.anggota 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS anggota_mgr_write ON public.anggota;
CREATE POLICY anggota_mgr_write ON public.anggota 
    FOR ALL TO authenticated 
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','internal') )
    WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','internal') );

-- 4. KEBIJAKAN KARANTINA & DEDUP (KHUSUS ADMIN)
-- Data di karantina bersifat sensitif karena berisi potensi duplikat
DROP POLICY IF EXISTS quarantine_mgr ON public.quarantine_anggota;
CREATE POLICY quarantine_mgr ON public.quarantine_anggota 
    FOR ALL TO authenticated 
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','internal') );

DROP POLICY IF EXISTS dedup_mgr ON public.dedup_candidate;
CREATE POLICY dedup_mgr ON public.dedup_candidate 
    FOR ALL TO authenticated 
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','internal') );

-- 5. KEBIJAKAN CONSENT (DATA PRIVACY)
-- Hanya admin yang boleh mengelola persetujuan data anggota
DROP POLICY IF EXISTS consent_mgr ON public.anggota_consent;
CREATE POLICY consent_mgr ON public.anggota_consent 
    FOR ALL TO authenticated 
    USING ( (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin','internal') );