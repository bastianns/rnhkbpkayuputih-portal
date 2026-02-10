-- ==========================================================
-- 02_FUNCTIONS.SQL: LOGIC & DEDUPLICATION ENGINE
-- ==========================================================

-- 1. FUNGSI AUDIT OTOMATIS
-- Mencatat setiap perubahan data (INSERT, UPDATE, DELETE) ke tabel audit_log
CREATE OR REPLACE FUNCTION public.fn_log_audit_pk() RETURNS TRIGGER AS $$
DECLARE
    v_pk_col text := TG_ARGV[0];
    v_entity_id uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_entity_id := (to_jsonb(OLD) ->> v_pk_col)::uuid;
    ELSE
        v_entity_id := (to_jsonb(NEW) ->> v_pk_col)::uuid;
    END IF;

    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, v_entity_id, to_jsonb(OLD), to_jsonb(NEW));

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. MESIN PENGHITUNG KEMIRIPAN (DEDUPLICATION PRECHECK)
-- Menggunakan algoritma Fellegi-Sunter dan Trigram Similarity
CREATE OR REPLACE FUNCTION public.fn_portal_dedup_precheck(
    p_nama TEXT, p_tgl_lahir DATE, p_id_wijk UUID
) RETURNS TABLE (target_id UUID, fs_score NUMERIC, match_status TEXT) AS $$
DECLARE
    wa_nama NUMERIC; wd_nama NUMERIC; wa_tgl NUMERIC; wd_tgl NUMERIC; wa_wijk NUMERIC; wd_wijk NUMERIC;
    v_year_birth INT := EXTRACT(YEAR FROM p_tgl_lahir);
BEGIN
    -- Ambil parameter bobot logaritma dari tabel dedup_parameter
    SELECT weight_agreement, weight_disagreement INTO wa_nama, wd_nama FROM public.dedup_parameter WHERE field_name='nama_lengkap';
    SELECT weight_agreement, weight_disagreement INTO wa_tgl, wd_tgl FROM public.dedup_parameter WHERE field_name='tanggal_lahir';
    SELECT weight_agreement, weight_disagreement INTO wa_wijk, wd_wijk FROM public.dedup_parameter WHERE field_name='id_wijk';

    RETURN QUERY
    WITH candidates AS (
        -- Pencarian kandidat berdasarkan nama mirip atau tahun lahir yang sama
        SELECT a.id_anggota, similarity(a.nama_lengkap, p_nama) AS sim_nama, a.tanggal_lahir, a.id_wijk
        FROM public.anggota a
        WHERE a.id_wijk = p_id_wijk 
           OR EXTRACT(YEAR FROM a.tanggal_lahir) = v_year_birth 
           OR similarity(a.nama_lengkap, p_nama) > 0.4
    ),
    scored AS (
        -- Perhitungan skor akumulatif
        SELECT id_anggota,
            ((CASE WHEN sim_nama >= 0.85 THEN wa_nama ELSE wd_nama END) +
             (CASE WHEN tanggal_lahir = p_tgl_lahir THEN wa_tgl ELSE wd_tgl END) +
             (CASE WHEN id_wijk = p_id_wijk THEN wa_wijk ELSE wd_wijk END))::numeric AS score
        FROM candidates
    )
    SELECT id_anggota, score,
        CASE 
             WHEN score >= (wa_nama + wa_tgl) THEN 'match'    -- Identitas sangat mirip
             WHEN score >= (wa_nama + wd_tgl) THEN 'possible' -- Perlu peninjauan
             ELSE 'non-match' 
        END
    FROM scored ORDER BY score DESC LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. FUNGSI PENDAFTARAN UTAMA (ORCHESTRATOR)
-- Menentukan apakah pendaftar langsung masuk Anggota atau masuk Karantina
CREATE OR REPLACE FUNCTION public.fn_portal_register_anggota(
    p_nama_lengkap TEXT, p_tanggal_lahir DATE, p_id_wijk UUID,
    p_no_telp TEXT DEFAULT NULL, p_alamat TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_target_id UUID; v_fs_score NUMERIC; v_match_status TEXT; v_new_id UUID; v_response JSONB;
BEGIN
    -- Jalankan precheck deduplikasi
    SELECT target_id, fs_score, match_status INTO v_target_id, v_fs_score, v_match_status
    FROM public.fn_portal_dedup_precheck(p_nama_lengkap, p_tanggal_lahir, p_id_wijk);

    IF v_match_status IS NULL THEN v_match_status := 'non-match'; END IF;

    -- Percabangan keputusan (Branching)
    IF v_match_status = 'non-match' THEN
        -- Simpan langsung ke tabel Anggota
        INSERT INTO public.anggota (nama_lengkap, tanggal_lahir, id_wijk, no_telp, alamat)
        VALUES (p_nama_lengkap, p_tanggal_lahir, p_id_wijk, p_no_telp, p_alamat)
        RETURNING id_anggota INTO v_new_id;

        v_response := jsonb_build_object('status', 'success', 'action', 'inserted', 'id', v_new_id, 'message', 'Pendaftaran berhasil.');
    ELSE
        -- Simpan ke tabel Karantina untuk direview
        INSERT INTO public.quarantine_anggota (raw_data, error_details, status)
        VALUES (jsonb_build_object('nama_lengkap', p_nama_lengkap, 'tanggal_lahir', p_tanggal_lahir, 'id_wijk', p_id_wijk, 'no_telp', p_no_telp, 'alamat', p_alamat),
                format('Terdeteksi %s dengan skor %s', v_match_status, v_fs_score), 'pending')
        RETURNING id_quarantine INTO v_new_id;

        -- Catat kandidat duplikat untuk Admin
        INSERT INTO public.dedup_candidate (id_anggota_a, id_quarantine_b, score, decision)
        VALUES (v_target_id, v_new_id, v_fs_score, 'possible');

        v_response := jsonb_build_object('status', 'flagged', 'action', 'quarantined', 'id', v_new_id, 'match_level', v_match_status, 'message', 'Data ditahan untuk peninjauan.');
    END IF;

    -- Catat upaya pendaftaran di Audit Log
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, new_data)
    VALUES (auth.uid(), 'REGISTER_ATTEMPT', 'portal_registration', v_new_id, v_response);

    RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. AKTIVASI TRIGGER
-- Memasang fungsi audit ke tabel-tabel utama
DROP TRIGGER IF EXISTS tr_audit_anggota ON public.anggota;
CREATE TRIGGER tr_audit_anggota AFTER INSERT OR UPDATE OR DELETE ON public.anggota 
FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit_pk('id_anggota');

DROP TRIGGER IF EXISTS tr_audit_partisipasi ON public.riwayat_partisipasi;
CREATE TRIGGER tr_audit_partisipasi AFTER INSERT OR UPDATE OR DELETE ON public.riwayat_partisipasi 
FOR EACH ROW EXECUTE FUNCTION public.fn_log_audit_pk('id_partisipasi');

-- 5. FUNGSI RESOLUSI DEDUPLIKASI
-- Memproses keputusan admin untuk data di karantina
CREATE OR REPLACE FUNCTION public.fn_portal_resolve_dedup(
    p_id_candidate UUID,
    p_decision TEXT -- 'ACCEPT' atau 'MERGE'
) RETURNS JSONB AS $$
DECLARE
    v_id_quarantine UUID;
    v_id_anggota_a UUID;
    v_raw_data JSONB;
    v_final_id UUID;
BEGIN
    -- 1. Ambil data kandidat dan data mentah karantina
    SELECT id_quarantine_b, id_anggota_a 
    INTO v_id_quarantine, v_id_anggota_a
    FROM public.dedup_candidate 
    WHERE id_candidate = p_id_candidate;

    SELECT raw_data INTO v_raw_data 
    FROM public.quarantine_anggota 
    WHERE id_quarantine = v_id_quarantine;

    -- 2. Jalankan Logika Berdasarkan Keputusan
    IF p_decision = 'ACCEPT' THEN
        -- Kasus: Orang Berbeda. Masukkan sebagai anggota baru.
        INSERT INTO public.anggota (nama_lengkap, tanggal_lahir, id_wijk, no_telp, alamat)
        VALUES (
            v_raw_data->>'nama_lengkap', 
            (v_raw_data->>'tanggal_lahir')::DATE, 
            (v_raw_data->>'id_wijk')::UUID, 
            v_raw_data->>'no_telp', 
            v_raw_data->>'alamat'
        ) RETURNING id_anggota INTO v_final_id;

        UPDATE public.quarantine_anggota SET status = 'resolved' WHERE id_quarantine = v_id_quarantine;

    ELSIF p_decision = 'MERGE' THEN
        -- Kasus: Orang Sama. Update data lama jika ada info baru.
        UPDATE public.anggota 
        SET no_telp = COALESCE(no_telp, v_raw_data->>'no_telp'),
            alamat = COALESCE(alamat, v_raw_data->>'alamat'),
            updated_at = NOW()
        WHERE id_anggota = v_id_anggota_a;
        
        v_final_id := v_id_anggota_a;
        UPDATE public.quarantine_anggota SET status = 'merged' WHERE id_quarantine = v_id_quarantine;
    END IF;

    -- 3. Update status kandidat agar hilang dari antrean
    UPDATE public.dedup_candidate 
    SET decision = p_decision, 
        decided_at = NOW(), 
        decided_by = auth.uid() 
    WHERE id_candidate = p_id_candidate;

    -- 4. Catat ke Audit Log
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, new_data)
    VALUES (auth.uid(), 'RESOLVE_DEDUP', 'dedup_candidate', p_id_candidate, 
            jsonb_build_object('decision', p_decision, 'final_member_id', v_final_id));

    RETURN jsonb_build_object('status', 'success', 'final_id', v_final_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;