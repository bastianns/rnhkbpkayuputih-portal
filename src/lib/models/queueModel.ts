import { createClient } from '@/lib/supabaseServer';

export async function getPendingQuarantine() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quarantine_anggota')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllWijk() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('wijk').select('*');
  if (error) throw error;
  return data || [];
}

export async function resolveDedupViaRPC(candidateId: string, action: string) {
  const supabase = await createClient();
  // ✅ MENGGUNAKAN ATOMIC TRANSACTION VIA RPC KHUSUS MERGE
  const { data, error } = await supabase.rpc('fn_admin_merge_quarantine', {
    p_candidate_id: candidateId
  });

  if (error) {
    console.error('Database Error (Atomic Resolution):', error.message);
    throw error;
  }

  return data;
}

// Fungsi helper untuk mendapatkan ID Candidate dari ID Quarantine
export async function getCandidateIdByQuarantine(quarantineId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('dedup_candidate')
    .select('id_candidate')
    .eq('id_quarantine_b', quarantineId)
    .maybeSingle();
    
  if (error || !data) return null;
  return data.id_candidate;
}
