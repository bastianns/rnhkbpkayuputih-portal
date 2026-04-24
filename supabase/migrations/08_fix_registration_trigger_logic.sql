-- ==========================================================
-- 08_FIX_REGISTRATION_TRIGGER_LOGIC.SQL
-- Memperbaiki error "Database error saving new user"
-- Memastikan pendaftaran tetap jalan meskipun engine dedup belum siap
-- ==========================================================

CREATE OR REPLACE FUNCTION public.fn_portal_register_anggota(p_raw_data JSONB)
RETURNS UUID AS $$
DECLARE
    v_quarantine_id UUID;
    v_target_id UUID;
    v_fs_score NUMERIC;
    v_match_status TEXT;
    v_id_auth UUID := (p_raw_data->>'id_auth')::UUID;
BEGIN
    -- 1. Lock untuk mencegah data ganda di saat bersamaan
    PERFORM pg_advisory_xact_lock(hashtext(p_raw_data->>'nama_lengkap'), hashtext(p_raw_data->>'id_wijk'));

    -- 2. Masukkan data ke karantina (UTAMA)
    INSERT INTO public.quarantine_anggota (raw_data, status, id_auth)
    VALUES (p_raw_data, 'pending', v_id_auth)
    RETURNING id_quarantine INTO v_quarantine_id;

    -- 3. Bungkus mesin dedup dalam EXCEPTION BLOCK agar jika gagal (misal tabel master kosong), 
    -- registrasi akun tetap berhasil masuk karantina.
    BEGIN
        SELECT target_id, fs_score, match_status INTO v_target_id, v_fs_score, v_match_status
        FROM public.fn_portal_dedup_precheck(
            p_raw_data->>'nama_lengkap',
            (p_raw_data->>'tanggal_lahir')::DATE,
            (p_raw_data->>'id_wijk')::UUID
        );

        IF v_match_status IN ('match', 'possible') THEN
            INSERT INTO public.dedup_candidate (id_anggota_a, id_quarantine_b, score, decision)
            VALUES (v_target_id, v_quarantine_id, v_fs_score, 'possible');
            
            UPDATE public.quarantine_anggota 
            SET error_details = format('Identity Precheck: %s (Skor: %s)', v_match_status, v_fs_score)
            WHERE id_quarantine = v_quarantine_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Jika mesin dedup error, catat di log tapi jangan batalkan registrasi
        UPDATE public.quarantine_anggota 
        SET error_details = 'Identity Engine bypass: Master parameters not ready.'
        WHERE id_quarantine = v_quarantine_id;
    END;

    -- 4. Audit Log
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, new_data)
    VALUES (v_id_auth, 'VETTING_REGISTER', 'quarantine_anggota', v_quarantine_id, p_raw_data);

    RETURN v_quarantine_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
