"use server";

import { createClient } from '@/lib/supabaseServer';
import { 
  getPendingQuarantine, getAllWijk, 
  resolveDedupViaRPC, getCandidateIdByQuarantine
} from '@/lib/models/queueModel';

/**
 * Mengambil antrean data dari karantina beserta kandidat duplikasi 
 * yang dideteksi oleh mesin Fellegi-Sunter.
 */
export async function fetchVettingQueue() {
  try {
    const supabase = await createClient();
    const [items, wijkList] = await Promise.all([
      getPendingQuarantine(),
      getAllWijk()
    ]);

    if (items.length === 0) return { items: [], wijkList };

    // Fix Root Cause: Gunakan explicit constraint name untuk join Supabase
    const { data: candidates, error: candidateError } = await supabase
      .from('dedup_candidate')
      .select(`
        id_candidate,
        id_anggota_a,
        id_quarantine_b,
        score,
        decision,
        anggota!dedup_candidate_id_anggota_a_fkey (
          id_anggota,
          nama_lengkap,
          tanggal_lahir,
          no_telp,
          alamat,
          email,
          wijk (
            nama_wijk
          )
        )
      `)
      .in('id_quarantine_b', items.map(i => i.id_quarantine))
      .eq('decision', 'possible');

    if (candidateError) {
      console.error("Candidate Fetch Error:", candidateError.message);
    }

    // Hubungkan kandidat ke masing-masing item karantina
    const itemsWithCandidates = items.map(item => ({
      ...item,
      candidates: candidates?.filter(c => c.id_quarantine_b === item.id_quarantine) || []
    }));

    return { items: itemsWithCandidates, wijkList };
  } catch (error) {
    console.error("Gagal memuat antrean:", error);
    return { items: [], wijkList: [] };
  }
}

/**
 * Resolusi data karantina berdasarkan keputusan Admin.
 */
export async function resolveQuarantineAction(id: string, action: 'ACCEPT' | 'MERGE' | 'REJECT', candidateId?: string) {
  try {
    const supabase = await createClient();
    
    if (action === 'MERGE') {
      const resolvedCandidateId = candidateId ?? await getCandidateIdByQuarantine(id);
      if (!resolvedCandidateId) throw new Error("Data pembanding tidak ditemukan.");
      await resolveDedupViaRPC(resolvedCandidateId, action);

    } else if (action === 'ACCEPT') {
      const { error } = await supabase.rpc('fn_admin_accept_quarantine', { p_quarantine_id: id });
      if (error) throw error;

    } else if (action === 'REJECT') {
      const { error } = await supabase.rpc('fn_admin_reject_quarantine', { p_quarantine_id: id });
      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Queue Resolution Error:", error.message);
    return { success: false, error: error.message };
  }
}
