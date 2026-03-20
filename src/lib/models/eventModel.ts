import { supabase } from '@/lib/supabase';

// ── GET DATA ──
export async function getEventsList() {
  const { data, error } = await supabase.from('kegiatan').select(`*, kategori_kegiatan (nama_kategori)`).order('tanggal_mulai', { ascending: false });
  if (error) throw error; return data;
}

export async function getCategoriesList() {
  const { data, error } = await supabase.from('kategori_kegiatan').select('*').order('nama_kategori');
  if (error) throw error; return data;
}

export async function getEventAndAttendance(eventId: string) {
  const { data: ev, error: evErr } = await supabase.from('kegiatan').select('*, kategori_kegiatan(nama_kategori)').eq('id_kegiatan', eventId).single();
  if (evErr) throw evErr;

  const { data: logs, error: logErr } = await supabase.from('riwayat_partisipasi').select('*, anggota(nama_lengkap)').eq('id_kegiatan', eventId).order('waktu_check_in', { ascending: false });
  if (logErr) throw logErr;

  return { event: ev, logs: logs || [] };
}

// ── MUTATIONS ──
export async function insertCategory(nama: string) {
  const { data, error } = await supabase.from('kategori_kegiatan').insert([{ nama_kategori: nama, bobot_dasar: 10 }]).select().single();
  if (error) throw error; return data;
}

export async function insertEventData(payload: any) {
  const { data, error } = await supabase.from('kegiatan').insert([payload]).select().single();
  if (error) throw error; return data;
}

export async function updateEventStatus(eventId: string, newStatus: boolean) {
  const { error } = await supabase.from('kegiatan').update({ is_open: newStatus }).eq('id_kegiatan', eventId);
  if (error) throw error;
}

export async function logAuditData(actorId: string | null, action: string, entity: string, entityId: string, newData: any) {
  await supabase.from('audit_log').insert({ actor_id: actorId, action, entity, entity_id: entityId, new_data: newData });
}