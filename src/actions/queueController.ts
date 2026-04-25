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

    // Ambil data pembanding (candidates) yang masih berstatus 'possible'
    const { data: candidates } = await supabase
      .from('dedup_candidate')
      .select('*, anggota_a:id_anggota_a(*, wijk(nama_wijk))')
      .in('id_quarantine_b', items.map(i => i.id_quarantine))
      .eq('decision', 'possible');

    // Hubungkan kandidat ke masing-masing item karantina (Support multiple candidates)
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
 * @param id ID Karantina (Quarantine ID)
 * @param action Tindakan (ACCEPT, MERGE, REJECT)
 * @param candidateId ID Kandidat (khusus untuk MERGE)
 */
export async function resolveQuarantineAction(id: string, action: 'ACCEPT' | 'MERGE' | 'REJECT', candidateId?: string) {
  try {
    const supabase = await createClient();
    
    if (action === 'MERGE') {
      // Masalah #1: Gunakan candidateId yang dikirim dari UI agar akurat
      const resolvedCandidateId = candidateId ?? await getCandidateIdByQuarantine(id);
      
      if (!resolvedCandidateId) {
        throw new Error("Data pembanding tidak ditemukan untuk operasi MERGE.");
      }

      // Jalankan Atomic Transaction via RPC Database
      await resolveDedupViaRPC(resolvedCandidateId, action);

    } else if (action === 'ACCEPT') {
      // Data bersih, promosikan langsung ke tabel anggota tetap via RPC Database
      const { error } = await supabase.rpc('fn_admin_accept_quarantine', { 
        p_quarantine_id: id 
      });
      if (error) throw error;

    } else if (action === 'REJECT') {
      // Masalah #2: Gunakan RPC Database agar audit log konsisten dan atomik
      const { error } = await supabase.rpc('fn_admin_reject_quarantine', {
        p_quarantine_id: id
      });
      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Queue Resolution Error:", error.message);
    return { success: false, error: error.message };
  }
}
