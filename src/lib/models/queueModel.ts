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

export async function approveQuarantineMember(item: any) {
  // 1. Pindahkan data ke tabel utama anggota
  const { error: insertError } = await supabase.from('anggota').insert([{
    id_auth: item.raw_data.id_auth,
    nama_lengkap: item.raw_data.nama_lengkap,
    email: item.raw_data.email,
    no_telp: item.raw_data.no_telp,
    tanggal_lahir: item.raw_data.tanggal_lahir,
    alamat: item.raw_data.alamat,
    id_wijk: item.raw_data.id_wijk,
    is_verified: true
  }]);
  if (insertError) throw insertError;

  // 2. Update status di karantina
  const { error: updateError } = await supabase
    .from('quarantine_anggota')
    .update({ status: 'approved' })
    .eq('id_quarantine', item.id_quarantine);
  if (updateError) throw updateError;
}

export async function rejectQuarantineMember(id: string) {
  const { error } = await supabase
    .from('quarantine_anggota')
    .update({ status: 'rejected' })
    .eq('id_quarantine', id);
  if (error) throw error;
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