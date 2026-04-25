-- 11. Add Admin Accept Function for Non-Deduplicated Quarantine Items
-- This function handles promoting a "clean" quarantine record to the 'anggota' table.

CREATE OR REPLACE FUNCTION public.fn_admin_accept_quarantine(p_quarantine_id UUID)
RETURNS VOID AS $$
DECLARE
    v_raw_data JSONB;
    v_new_id_anggota UUID;
BEGIN
    -- 1. Ambil raw_data dari quarantine_anggota
    SELECT raw_data INTO v_raw_data
    FROM public.quarantine_anggota
    WHERE id_quarantine = p_quarantine_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data karantina tidak ditemukan';
    END IF;

    -- 2. Insert ke tabel anggota (SSOT)
    INSERT INTO public.anggota (
        id_auth,
        nama_lengkap,
        email,
        no_telp,
        tanggal_lahir,
        id_wijk,
        id_kategori_kesibukan,
        is_verified
    )
    VALUES (
        (v_raw_data->>'id_auth')::UUID,
        v_raw_data->>'nama_lengkap',
        v_raw_data->>'email',
        v_raw_data->>'no_telp',
        (v_raw_data->>'tanggal_lahir')::DATE,
        (v_raw_data->>'id_wijk')::UUID,
        (v_raw_data->>'id_kategori_kesibukan')::UUID,
        TRUE -- Langsung diverifikasi karena diterima admin
    )
    RETURNING id_anggota INTO v_new_id_anggota;

    -- 3. Update status karantina jadi approved
    UPDATE public.quarantine_anggota
    SET status = 'approved',
        resolved_at = NOW()
    WHERE id_quarantine = p_quarantine_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
