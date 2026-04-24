-- ==========================================================
-- 09_FINAL_IDEMPOTENT_REGISTRATION.SQL
-- Implementasi Idempotensi dan Safe-Mode pada Registrasi
-- ==========================================================

CREATE OR REPLACE FUNCTION public.fn_portal_register_anggota(p_raw_data JSONB)
RETURNS JSONB AS $$
DECLARE
    v_quarantine_id UUID;
    v_target_id UUID;
    v_fs_score NUMERIC;
    v_match_status TEXT;
    v_id_auth UUID := (p_raw_data->>'id_auth')::UUID;
BEGIN
    -- [STEP 1] Lock untuk mencegah race condition submission ganda di detik yang sama
    PERFORM pg_advisory_xact_lock(hashtext(p_raw_data->>'nama_lengkap'), hashtext(p_raw_data->>'id_wijk'));

    -- [STEP 2] IDEMPOTENCY CHECK
    -- Jika id_auth sudah pernah masuk karantina, kembalikan data yang sudah ada
    SELECT id_quarantine INTO v_quarantine_id
    FROM public.quarantine_anggota
    WHERE id_auth = v_id_auth
    LIMIT 1;

    IF v_quarantine_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'status', 'already_submitted',
            'id_quarantine', v_quarantine_id,
            'message', 'Data pendaftaran sudah tercatat sebelumnya.'
        );
    END IF;

    -- [STEP 3] Simpan data ke Karantina (hanya kalau belum pernah masuk)
    INSERT INTO public.quarantine_anggota (raw_data, status, id_auth)
    VALUES (p_raw_data, 'pending', v_id_auth)
    RETURNING id_quarantine INTO v_quarantine_id;

    -- [STEP 4] Jalankan Mesin Cek Duplikat dengan Proteksi EXCEPTION
    BEGIN
        SELECT target_id, fs_score, match_status 
        INTO v_target_id, v_fs_score, v_match_status
        FROM public.fn_portal_dedup_precheck(
            p_raw_data->>'nama_lengkap',
            (p_raw_data->>'tanggal_lahir')::DATE,
            (p_raw_data->>'id_wijk')::UUID
        );

        IF v_match_status IN ('match', 'possible') AND v_target_id IS NOT NULL THEN
            INSERT INTO public.dedup_candidate (id_anggota_a, id_quarantine_b, score, decision)
            VALUES (v_target_id, v_quarantine_id, v_fs_score, 'possible');

            UPDATE public.quarantine_anggota
            SET error_details = format(
                'Sistem: Terdeteksi mirip dengan ID %s (Skor: %s)', 
                v_target_id, v_fs_score
            )
            WHERE id_quarantine = v_quarantine_id;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        UPDATE public.quarantine_anggota
        SET error_details = 'Identity Engine Bypass: Menunggu konfigurasi parameter master.'
        WHERE id_quarantine = v_quarantine_id;
    END;

    -- [STEP 5] Catat Audit Log
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, new_data)
    VALUES (v_id_auth, 'VETTING_REGISTER', 'quarantine_anggota', v_quarantine_id, p_raw_data);

    RETURN jsonb_build_object(
        'status', 'success',
        'id_quarantine', v_quarantine_id,
        'message', 'Data pendaftaran berhasil dicatat, menunggu verifikasi admin.'
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
