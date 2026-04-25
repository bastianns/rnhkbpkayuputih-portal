-- 13. Add Admin Merge Function for Deduplication
-- This function handles merging a quarantine record with an existing member record.

CREATE OR REPLACE FUNCTION public.fn_admin_merge_quarantine(
    p_candidate_id UUID  -- ID dari tabel dedup_candidate
)
RETURNS JSONB AS $$
DECLARE
    v_id_anggota_a  UUID;   -- Anggota lama (yang sudah ada di SSOT)
    v_id_quarantine UUID;   -- Data baru (yang di karantina)
    v_id_auth       UUID;   -- Auth ID dari pendaftar baru
    v_raw_data      JSONB;
    v_nama_lama     TEXT;
    v_nama_baru     TEXT;
BEGIN
    -- [STEP 1] Ambil semua data yang dibutuhkan dari dedup_candidate
    -- Sekaligus lock row untuk cegah race condition
    SELECT 
        dc.id_anggota_a,
        dc.id_quarantine_b,
        qa.id_auth,
        qa.raw_data,
        a.nama_lengkap
    INTO 
        v_id_anggota_a,
        v_id_quarantine,
        v_id_auth,
        v_raw_data,
        v_nama_lama
    FROM public.dedup_candidate dc
    JOIN public.quarantine_anggota qa ON qa.id_quarantine = dc.id_quarantine_b
    JOIN public.anggota a ON a.id_anggota = dc.id_anggota_a
    WHERE dc.id_candidate = p_candidate_id
      AND dc.decision = 'possible'
      AND qa.status = 'pending'
    FOR UPDATE OF dc, qa;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Kandidat tidak ditemukan atau sudah diproses (ID: %)', p_candidate_id;
    END IF;

    v_nama_baru := v_raw_data->>'nama_lengkap';

    -- [STEP 2] Hubungkan id_auth ke anggota yang sudah ada
    -- Ini adalah inti dari MERGE: user baru login dengan akun anggota lama
    UPDATE public.anggota
    SET 
        id_auth    = v_id_auth,
        updated_at = NOW()
    WHERE id_anggota = v_id_anggota_a;

    -- [STEP 3] Update status karantina jadi 'merged'
    UPDATE public.quarantine_anggota
    SET status = 'merged'
    WHERE id_quarantine = v_id_quarantine;

    -- [STEP 4] Tutup semua dedup_candidate yang terkait quarantine ini
    UPDATE public.dedup_candidate
    SET 
        decision   = 'confirmed_duplicate',
        decided_at = NOW()
    WHERE id_quarantine_b = v_id_quarantine
      AND decision = 'possible';

    -- [STEP 5] Audit Log
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, new_data)
    VALUES (
        v_id_auth,
        'ADMIN_MERGE',
        'anggota',
        v_id_anggota_a,
        jsonb_build_object(
            'id_anggota',    v_id_anggota_a,
            'id_quarantine', v_id_quarantine,
            'nama_lama',     v_nama_lama,
            'nama_baru',     v_nama_baru,
            'id_auth',       v_id_auth,
            'status',        'merged'
        )
    );

    RETURN jsonb_build_object(
        'status',        'success',
        'id_anggota',    v_id_anggota_a,
        'nama_lengkap',  v_nama_lama,
        'id_quarantine', v_id_quarantine
    );

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'fn_admin_merge_quarantine gagal: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
