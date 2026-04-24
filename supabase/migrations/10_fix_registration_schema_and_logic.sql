-- ==========================================================
-- 10_FIX_REGISTRATION_SCHEMA_AND_LOGIC.SQL
-- Perbaikan Kritis: Schema kolom id_auth dan Logic Deduplikasi
-- ==========================================================

-- Fix #1 & #2 — Tambahkan kolom id_auth yang hilang + Index
ALTER TABLE public.quarantine_anggota 
ADD COLUMN IF NOT EXISTS id_auth UUID;

CREATE INDEX IF NOT EXISTS idx_quarantine_id_auth 
ON public.quarantine_anggota(id_auth);

-- Fix #3 — Ganti fungsi registrasi (pindahkan INSERT dedup ke dalam EXCEPTION block)
CREATE OR REPLACE FUNCTION public.fn_portal_register_anggota(p_raw_data JSONB)
RETURNS JSONB AS $$
DECLARE
    v_quarantine_id UUID;
    v_target_id UUID;
    v_fs_score NUMERIC;
    v_match_status TEXT;
    v_id_auth UUID := (p_raw_data->>'id_auth')::UUID;
BEGIN
    -- [STEP 1] Lock race condition
    PERFORM pg_advisory_xact_lock(
        hashtext(p_raw_data->>'nama_lengkap'), 
        hashtext(p_raw_data->>'id_wijk')
    );

    -- [STEP 2] Idempotency Check
    SELECT id_quarantine INTO v_quarantine_id
    FROM public.quarantine_anggota
    WHERE id_auth = v_id_auth
    LIMIT 1;

    IF v_quarantine_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'status', 'already_submitted',
            'id_quarantine', v_quarantine_id
        );
    END IF;

    -- [STEP 3] Insert ke Karantina
    INSERT INTO public.quarantine_anggota (raw_data, status, id_auth)
    VALUES (p_raw_data, 'pending', v_id_auth)
    RETURNING id_quarantine INTO v_quarantine_id;

    -- [STEP 4] Dedup — SEMUA dalam satu EXCEPTION block
    BEGIN
        SELECT target_id, fs_score, match_status 
        INTO v_target_id, v_fs_score, v_match_status
        FROM public.fn_portal_dedup_precheck(
            p_raw_data->>'nama_lengkap',
            (p_raw_data->>'tanggal_lahir')::DATE,
            (p_raw_data->>'id_wijk')::UUID
        );

        -- Guard: hanya insert kalau v_target_id benar-benar ada
        -- Ini fix Bug #1 — mencegah NOT NULL violation
        IF v_match_status IN ('match', 'possible') 
           AND v_target_id IS NOT NULL 
           AND v_fs_score IS NOT NULL THEN

            INSERT INTO public.dedup_candidate (id_anggota_a, id_quarantine_b, score, decision)
            VALUES (v_target_id, v_quarantine_id, v_fs_score, 'possible');

            UPDATE public.quarantine_anggota
            SET error_details = format(
                'Terdeteksi mirip dengan ID %s (Skor: %s)', 
                v_target_id, v_fs_score
            )
            WHERE id_quarantine = v_quarantine_id;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        -- Catat error tapi jangan rollback
        UPDATE public.quarantine_anggota
        SET error_details = format(
            'Identity Engine Bypass: %s', SQLERRM
        )
        WHERE id_quarantine = v_quarantine_id;
    END;

    -- [STEP 5] Audit Log
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, new_data)
    VALUES (v_id_auth, 'VETTING_REGISTER', 'quarantine_anggota', v_quarantine_id, p_raw_data);

    RETURN jsonb_build_object(
        'status', 'success',
        'id_quarantine', v_quarantine_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
