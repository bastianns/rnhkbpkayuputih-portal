-- 12. Add Admin Reject Function for Quarantine Items
-- This function handles rejecting a quarantine record and logging the action.

CREATE OR REPLACE FUNCTION public.fn_admin_reject_quarantine(p_quarantine_id UUID)
RETURNS VOID AS $$
DECLARE
    v_id_auth UUID;
BEGIN
    -- 1. Ambil id_auth sebelum update
    SELECT id_auth INTO v_id_auth
    FROM public.quarantine_anggota
    WHERE id_quarantine = p_quarantine_id;

    -- 2. Update status karantina jadi rejected
    UPDATE public.quarantine_anggota
    SET status = 'rejected',
        resolved_at = NOW()
    WHERE id_quarantine = p_quarantine_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data tidak ditemukan atau sudah diproses (ID: %)', p_quarantine_id;
    END IF;

    -- 3. Insert ke Audit Log
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, new_data)
    VALUES (
        v_id_auth, 
        'ADMIN_REJECT', 
        'quarantine_anggota', 
        p_quarantine_id,
        jsonb_build_object('status', 'rejected')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
