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

    // 1. Fetch Candidates dengan explicit join
    const { data: rawCandidates, error: candidateError } = await supabase
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

    // 2. NORMALISASI: Supabase join sering mengembalikan array [ { anggota: [...] } ]
    // Kita paksa menjadi objek tunggal agar frontend tidak bingung.
    const normalizedCandidates = (rawCandidates || []).map(c => ({
      ...c,
      anggota: Array.isArray(c.anggota) ? (c.anggota[0] ?? null) : (c.anggota ?? null)
    }));

    // DEBUG: Lihat struktur data di terminal server
    console.log("FETCH_QUEUE_DEBUG - Items Count:", items.length);
    console.log("FETCH_QUEUE_DEBUG - Raw Candidate Sample:", JSON.stringify(rawCandidates?.[0], null, 2));
    console.log("FETCH_QUEUE_DEBUG - Normalized Sample:", JSON.stringify(normalizedCandidates?.[0], null, 2));

    // 3. Hubungkan kandidat ke masing-masing item karantina
    const itemsWithCandidates = items.map(item => ({
      ...item,
      candidates: normalizedCandidates.filter(c => c.id_quarantine_b === item.id_quarantine) || []
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
