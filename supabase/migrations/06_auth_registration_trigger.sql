-- ==========================================================
-- 06_AUTH_REGISTRATION_TRIGGER.SQL: ATOMICITY
-- ==========================================================

-- 1. Fungsi Handler Trigger untuk User Baru
CREATE OR REPLACE FUNCTION public.fn_on_new_user_registered()
RETURNS TRIGGER AS $$
DECLARE
    v_meta JSONB := NEW.raw_user_meta_data;
BEGIN
    -- Validasi Keamanan: Pastikan data profil ada di metadata
    IF v_meta IS NULL OR v_meta = '{}'::jsonb THEN
        RAISE EXCEPTION 'Registrasi gagal: Data profil tidak ditemukan di metadata.';
    END IF;

    -- Validasi Hukum: Consent PDP wajib diberikan (true)
    IF NOT (v_meta->>'consent_pdp')::BOOLEAN THEN
        RAISE EXCEPTION 'Registrasi ditolak: Anda harus menyetujui kebijakan privasi data.';
    END IF;

    -- Validasi Data Kritis (Defense in Depth)
    IF (v_meta->>'nama_lengkap') IS NULL OR length(trim(v_meta->>'nama_lengkap')) < 3 THEN
        RAISE EXCEPTION 'Registrasi gagal: nama_lengkap tidak valid atau terlalu pendek.';
    END IF;

    IF (v_meta->>'id_wijk') IS NULL OR (v_meta->>'id_wijk')::TEXT !~ '^[0-9a-f-]{36}$' THEN
        RAISE EXCEPTION 'Registrasi gagal: id_wijk bukan UUID yang valid.';
    END IF;

    IF (v_meta->>'tanggal_lahir') IS NULL OR (v_meta->>'tanggal_lahir')::TEXT !~ '^\d{4}-\d{2}-\d{2}$' THEN
        RAISE EXCEPTION 'Registrasi gagal: tanggal_lahir harus berformat YYYY-MM-DD.';
    END IF;

    -- Panggil orchestrator registrasi & vetting
    -- Jika fungsi ini RAISE EXCEPTION, pendaftaran auth.users akan ROLLBACK
    PERFORM public.fn_portal_register_anggota(
        jsonb_build_object(
            'id_auth',               NEW.id,
            'nama_lengkap',          v_meta->>'nama_lengkap',
            'tanggal_lahir',         v_meta->>'tanggal_lahir',
            'id_wijk',               v_meta->>'id_wijk',
            'no_telp',               v_meta->>'no_telp',
            'alamat',                v_meta->>'alamat',
            'id_kategori_kesibukan', v_meta->>'id_kategori_kesibukan',
            'keahlian',              v_meta->'keahlian', -- array
            'consent_pdp',           v_meta->>'consent_pdp'
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Pasang Trigger ke tabel internal Supabase Auth
DROP TRIGGER IF EXISTS tr_on_new_user_registered ON auth.users;
CREATE TRIGGER tr_on_new_user_registered
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.fn_on_new_user_registered();
