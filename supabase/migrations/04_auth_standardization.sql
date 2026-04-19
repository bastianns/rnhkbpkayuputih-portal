-- ==========================================================
-- 04_AUTH_STANDARDIZATION.SQL
-- Menyelaraskan skema database dengan alur Email & Password
-- ==========================================================

-- 1. Tambahkan kolom id_auth ke tabel anggota jika belum ada
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='anggota' AND column_name='id_auth') THEN
        ALTER TABLE public.anggota ADD COLUMN id_auth UUID UNIQUE;
    END IF;
END $$;

-- 2. Tambahkan kolom email ke tabel anggota untuk kemudahan akses (denormalisasi terkontrol)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='anggota' AND column_name='email') THEN
        ALTER TABLE public.anggota ADD COLUMN email VARCHAR(255) UNIQUE;
    END IF;
END $$;

-- 3. Update fungsi fn_portal_resolve_dedup untuk menangani id_auth dan email
CREATE OR REPLACE FUNCTION public.fn_portal_resolve_dedup(
    p_id_candidate UUID,
    p_decision TEXT -- 'ACCEPT' atau 'MERGE'
) RETURNS JSONB AS $$
DECLARE
    v_id_quarantine UUID;
    v_id_anggota_a UUID;
    v_raw_data JSONB;
    v_final_id UUID;
    v_id_auth UUID;
    v_email TEXT;
BEGIN
    -- 1. Ambil data kandidat dan data mentah karantina
    SELECT id_quarantine_b, id_anggota_a 
    INTO v_id_quarantine, v_id_anggota_a
    FROM public.dedup_candidate 
    WHERE id_candidate = p_id_candidate;

    SELECT raw_data INTO v_raw_data 
    FROM public.quarantine_anggota 
    WHERE id_quarantine = v_id_quarantine;

    -- Ekstraksi id_auth dan email dari raw_data (dikirim oleh RegistrationForm)
    v_id_auth := (v_raw_data->>'id_auth')::UUID;
    v_email := v_raw_data->>'email';

    -- 2. Jalankan Logika Berdasarkan Keputusan
    IF p_decision = 'ACCEPT' THEN
        -- Kasus: Orang Berbeda. Masukkan sebagai anggota baru + id_auth.
        INSERT INTO public.anggota (nama_lengkap, tanggal_lahir, id_wijk, no_telp, alamat, id_auth, email, is_verified)
        VALUES (
            v_raw_data->>'nama_lengkap', 
            (v_raw_data->>'tanggal_lahir')::DATE, 
            (v_raw_data->>'id_wijk')::UUID, 
            v_raw_data->>'no_telp', 
            v_raw_data->>'alamat',
            v_id_auth,
            v_email,
            TRUE -- Karena sudah di-approve admin
        ) RETURNING id_anggota INTO v_final_id;

        UPDATE public.quarantine_anggota SET status = 'resolved' WHERE id_quarantine = v_id_quarantine;

    ELSIF p_decision = 'MERGE' THEN
        -- Kasus: Orang Sama. Update data lama + hubungkan id_auth jika belum ada.
        UPDATE public.anggota 
        SET no_telp = COALESCE(no_telp, v_raw_data->>'no_telp'),
            alamat = COALESCE(alamat, v_raw_data->>'alamat'),
            id_auth = COALESCE(id_auth, v_id_auth),
            email = COALESCE(email, v_email),
            is_verified = TRUE,
            updated_at = NOW()
        WHERE id_anggota = v_id_anggota_a;
        
        v_final_id := v_id_anggota_a;
        UPDATE public.quarantine_anggota SET status = 'merged' WHERE id_quarantine = v_id_quarantine;
    END IF;

    -- 3. Update status kandidat
    UPDATE public.dedup_candidate 
    SET decision = p_decision, 
        decided_at = NOW(), 
        decided_by = auth.uid() 
    WHERE id_candidate = p_id_candidate;

    -- 4. Audit Log
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, new_data)
    VALUES (auth.uid(), 'RESOLVE_DEDUP_V2', 'dedup_candidate', p_id_candidate, 
            jsonb_build_object('decision', p_decision, 'final_member_id', v_final_id, 'id_auth', v_id_auth));

    RETURN jsonb_build_object('status', 'success', 'final_id', v_final_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
