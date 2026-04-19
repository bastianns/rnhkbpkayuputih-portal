import { supabase } from '@/lib/supabase';

export async function getMemberDashboardData(email: string) {
  // 1. Coba dapatkan Profil Anggota Tetap (SSOT)
  let { data: member, error: memberErr } = await supabase
    .from('anggota')
    .select('*, wijk(nama_wijk)')
    .eq('email', email)
    .single();

  // 2. Jika tidak ada di anggota tetap, cek di Karantina
  if (memberErr || !member) {
    const { data: qMember } = await supabase
      .from('quarantine_anggota')
      .select('*')
      .filter('raw_data->>email', 'eq', email)
      .maybeSingle();

    if (qMember) {
      // Mapping data karantina agar struktur minimalnya sama dengan objek member
      member = {
        id_anggota: null, // Belum ada ID tetap
        nama_lengkap: qMember.raw_data.nama_lengkap,
        email: qMember.raw_data.email,
        is_verified: false,
        created_at: qMember.created_at,
        wijk: { nama_wijk: 'Dalam Antrean Vetting' }
      };
    } else {
      throw new Error("Identitas tidak ditemukan di sistem.");
    }
  }

  // 3. Dapatkan Riwayat Partisipasi (Hanya jika sudah jadi anggota tetap)
  const activities = member.id_anggota ? (await supabase
    .from('riwayat_partisipasi')
    .select(`*, katalog_peran (bobot_kontribusi)`)
    .eq('id_anggota', member.id_anggota)).data : [];

  // 3. Dapatkan Live Event
  const { data: liveEvent } = await supabase
    .from('kegiatan')
    .select('*, kategori_kegiatan(nama_kategori)')
    .eq('is_open', true)
    .order('tanggal_mulai', { ascending: false })
    .limit(1)
    .single();

  // 4. Dapatkan Katalog Peran
  const { data: perans } = await supabase.from('katalog_peran').select('*');

  return { 
    member, 
    activities: activities || [], 
    liveEvent: liveEvent || null, 
    perans: perans || [] 
  };
}

export async function processCheckinTransaction(memberId: string, eventId: string, roleId: string, actorId: string) {
  // Verifikasi ganda (Double-booking prevention)
  const { data: existing } = await supabase
    .from('riwayat_partisipasi')
    .select('id_partisipasi')
    .eq('id_anggota', memberId)
    .eq('id_kegiatan', eventId)
    .single();
  if (existing) throw new Error('Sudah absen di kegiatan ini.');

  // Insert Riwayat Partisipasi
  const { error: insertErr } = await supabase.from('riwayat_partisipasi').insert({
    id_anggota: memberId,
    id_kegiatan: eventId,
    id_peran: roleId,
    status_kehadiran: 'Hadir',
    waktu_check_in: new Date().toISOString()
  });
  if (insertErr) throw insertErr;

  // Insert Audit Log (Kepatuhan UU PDP)
  await supabase.from('audit_log').insert({
    actor_id: actorId,
    action: 'MEMBER_CHECKIN',
    entity: 'riwayat_partisipasi',
    entity_id: memberId,
    new_data: { event_id: eventId, role_id: roleId }
  });
}

export async function getMemberHistoryByEmail(email: string) {
  // 1. Dapatkan Profil Anggota (untuk ID-nya)
  const { data: member, error: memberErr } = await supabase
    .from('anggota')
    .select('*')
    .eq('email', email)
    .single();

  if (memberErr || !member) throw new Error('Profil SSOT tidak ditemukan.');

  // 2. Dapatkan Riwayat Partisipasi Lengkap
  const { data: historyData, error: historyErr } = await supabase
    .from('riwayat_partisipasi')
    .select('*, kegiatan (nama_kegiatan, tanggal_mulai), katalog_peran (nama_peran, bobot_kontribusi)')
    .eq('id_anggota', member.id_anggota)
    .order('waktu_check_in', { ascending: false });

  if (historyErr) throw historyErr;

  return { member, history: historyData || [] };
}