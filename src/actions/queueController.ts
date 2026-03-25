"use server";

import { supabase } from '@/lib/supabase';
import { 
  getPendingQuarantine, getAllWijk, 
  approveQuarantineMember, rejectQuarantineMember, logQueueResolution 
} from '@/lib/models/queueModel';

export async function fetchVettingQueue() {
  try {
    const [items, wijkList] = await Promise.all([
      getPendingQuarantine(),
      getAllWijk()
    ]);
    return { items, wijkList };
  } catch (error) {
    console.error("Gagal memuat antrean:", error);
    return { items: [], wijkList: [] };
  }
}

export async function resolveQuarantineAction(id: string, action: 'ACCEPT' | 'MERGE' | 'REJECT', itemData?: any) {
  try {
    // 1. Identifikasi Candidate ID jika tindakan memerlukan resolusi deduplikasi
    if (action === 'ACCEPT' || action === 'MERGE') {
      const candidateId = await getCandidateIdByQuarantine(id);
      
      if (!candidateId && action === 'MERGE') {
        throw new Error("Data pembanding tidak ditemukan untuk operasi MERGE.");
      }

      // Jalankan Atomic Transaction via RPC
      // Jika candidateId tidak ada (non-match murni), RPC akan menangani via logic fallback
      await resolveDedupViaRPC(candidateId as string, action);
    } 
    
    // 2. Jika REJECT, kita tetap gunakan update status sederhana (atau bisa dipindah ke RPC nanti)
    else if (action === 'REJECT') {
      const { error } = await supabase
        .from('quarantine_anggota')
        .update({ status: 'rejected' })
        .eq('id_quarantine', id);
      if (error) throw error;
    }

    // 3. Catat aktivitas di Audit Log (Controller-side Audit)
    const { data: { user } } = await supabase.auth.getUser();
    await logQueueResolution(user?.id, action.toLowerCase(), id);

    return { success: true };
  } catch (error: any) {
    console.error("Queue Resolution Error:", error.message);
    return { success: false, error: error.message };
  }
}