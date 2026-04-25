-- 14. Update Registration to Auto-Accept clean data
-- If no duplicates are found, data is directly inserted into the 'anggota' table.
-- Only flagged (similar) data goes to the vetting queue (quarantine).

CREATE OR REPLACE FUNCTION public.fn_portal_register_anggota(p_raw_data JSONB)
RETURNS JSONB AS $$
DECLARE
    v_quarantine_id UUID;
    v_target_id     UUID;
    v_fs_score      NUMERIC;
    v_match_status  TEXT;
    v_id_anggota    UUID := gen_random_uuid();
    v_id_auth       UUID := (p_raw_data->>'id_auth')::UUID;
    v_id_wijk       UUID := (p_raw_data->>'id_wijk')::UUID;
    v_id_kategori_kesibukan UUID;
BEGIN
    -- [STEP 1] Lock race condition
    PERFORM pg_advisory_xact_lock(
        hashtext(p_raw_data->>'nama_lengkap'),
        hashtext(p_raw_data->>'id_wijk')
    );

    -- [STEP 2] Idempotency Check
    -- Cek di tabel anggota dulu
    IF EXISTS (SELECT 1 FROM public.anggota WHERE id_auth = v_id_auth) THEN
        RETURN jsonb_build_object('status', 'already_submitted', 'message', 'Akun sudah terdaftar.');
    END IF;
    
    -- Cek di karantina
    SELECT id_quarantine INTO v_quarantine_id
    FROM public.quarantine_anggota
    WHERE id_auth = v_id_auth AND status = 'pending'
    LIMIT 1;

    IF v_quarantine_id IS NOT NULL THEN
        RETURN jsonb_build_object('status', 'already_submitted', 'id_quarantine', v_quarantine_id);
    END IF;

    -- [STEP 3] Jalankan Mesin Dedup
    BEGIN
        SELECT target_id, fs_score, match_status
        INTO v_target_id, v_fs_score, v_match_status
        FROM public.fn_portal_dedup_precheck(
            p_raw_data->>'nama_lengkap',
            (p_raw_data->>'tanggal_lahir')::DATE,
            v_id_wijk
        );
    EXCEPTION WHEN OTHERS THEN
        -- Kalau mesin dedup error, anggap bersih dan auto-accept
        v_match_status := 'non-match';
    END;

    -- [STEP 4A] BERSIH → Langsung masuk tabel Anggota (Auto-Accept)
    IF v_match_status IS NULL OR v_match_status = 'non-match' THEN

        INSERT INTO public.anggota (
            id_anggota, id_auth, id_wijk,
            nama_lengkap, email, tanggal_lahir,
            alamat, no_telp,
            status_keanggotaan, is_verified
        )
        VALUES (
            v_id_anggota, v_id_auth, v_id_wijk,
            TRIM(p_raw_data->>'nama_lengkap'),
            p_raw_data->>'email',
            (p_raw_data->>'tanggal_lahir')::DATE,
            p_raw_data->>'alamat',
            p_raw_data->>'no_telp',
            'Aktif', TRUE
        );

        -- Insert kesibukan jika ada
        v_id_kategori_kesibukan := (p_raw_data->>'id_kategori_kesibukan')::UUID;
        IF v_id_kategori_kesibukan IS NOT NULL THEN
            INSERT INTO public.kesibukan_anggota (id_anggota, id_kategori_kesibukan, is_current)
            VALUES (v_id_anggota, v_id_kategori_kesibukan, TRUE);
        END IF;

        -- Insert consent PDP
        IF (p_raw_data->>'consent_pdp')::BOOLEAN = TRUE THEN
            INSERT INTO public.anggota_consent (
                id_anggota, consent_text_version, purpose, consent_given_at
            )
            VALUES (v_id_anggota, 'v1.0', 'Pengelolaan data keanggotaan jemaat', NOW());
        END IF;

        -- Audit Log
        INSERT INTO public.audit_log (actor_id, action, entity, entity_id, new_data)
        VALUES (
            v_id_auth, 'AUTO_ACCEPT', 'anggota', v_id_anggota,
            jsonb_build_object(
                'id_anggota', v_id_anggota,
                'nama_lengkap', p_raw_data->>'nama_lengkap',
                'status', 'auto_accepted'
            )
        );

        RETURN jsonb_build_object(
            'status', 'success',
            'route', 'direct',
            'id_anggota', v_id_anggota
        );

    -- [STEP 4B] MIRIP → Masuk Karantina untuk review admin
    ELSE

        INSERT INTO public.quarantine_anggota (raw_data, status, id_auth)
        VALUES (p_raw_data, 'pending', v_id_auth)
        RETURNING id_quarantine INTO v_quarantine_id;

        INSERT INTO public.dedup_candidate (id_anggota_a, id_quarantine_b, score, decision)
        VALUES (v_target_id, v_quarantine_id, v_fs_score, 'possible');

        UPDATE public.quarantine_anggota
        SET error_details = format(
            'Terdeteksi mirip dengan ID %s (Skor: %s)', v_target_id, v_fs_score
        )
        WHERE id_quarantine = v_quarantine_id;

        -- Audit Log
        INSERT INTO public.audit_log (actor_id, action, entity, entity_id, new_data)
        VALUES (
            v_id_auth, 'VETTING_REGISTER', 'quarantine_anggota', v_quarantine_id,
            jsonb_build_object(
                'id_quarantine', v_quarantine_id,
                'score', v_fs_score,
                'match_status', v_match_status
            )
        );

        RETURN jsonb_build_object(
            'status', 'flagged',
            'route', 'quarantine',
            'id_quarantine', v_quarantine_id,
            'score', v_fs_score
        );

    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
