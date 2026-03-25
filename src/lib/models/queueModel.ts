import { supabase } from '@/lib/supabase';

export async function getPendingQuarantine() {
  const { data, error } = await supabase
    .from('quarantine_anggota')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllWijk() {
  const { data, error } = await supabase.from('wijk').select('*');
  if (error) throw error;
  return data || [];
}

export async function resolveDedupViaRPC(candidateId: string, decision: 'ACCEPT' | 'MERGE') {
  // ✅ MENGGUNAKAN ATOMIC TRANSACTION VIA RPC
  // Fungsi ini menjalankan INSERT, UPDATE, dan AUDIT LOG dalam satu unit kerja di database
  const { data, error } = await supabase.rpc('fn_portal_resolve_dedup', {
    p_id_candidate: candidateId,
    p_decision: decision
  });

  if (error) {
    console.error('Database Error (Atomic Resolution):', error.message);
    throw error;
  }

  return data;
}

// Fungsi helper untuk mendapatkan ID Candidate dari ID Quarantine
export async function getCandidateIdByQuarantine(quarantineId: string) {
  const { data, error } = await supabase
    .from('dedup_candidate')
    .select('id_candidate')
    .eq('id_quarantine_b', quarantineId)
    .single();
    
  if (error) return null;
  return data.id_candidate;
}

export async function logQueueResolution(actorId: string | undefined, action: string, entityId: string) {
  await supabase.from('audit_log').insert({
    actor_id: actorId,
    action: action === 'approve' ? 'APPROVE_QUARANTINE' : 'REJECT_QUARANTINE',
    entity: 'quarantine_anggota',
    entity_id: entityId,
    new_data: { status: action }
  });
}