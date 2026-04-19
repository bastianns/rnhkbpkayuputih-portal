// PENTING: Menggunakan createClient dari supabaseServer (bukan browser client)
// agar cookie sesi server-side terbaca dengan benar di Server Actions & model layer.
import { createClient } from '@/lib/supabaseServer';

export async function getMemberDashboardData(email: string, authId: string) {
  const supabase = await createClient();

  // 1. Coba dapatkan Profil Anggota Tetap (SSOT) berdasarkan id_auth (paling akurat)
  let { data: member } = await supabase
    .from('anggota')
    .select('*, wijk(nama_wijk)')
    .eq('id_auth', authId)
    .maybeSingle();

  // 2. Fallback: cari di anggota tetap berdasarkan email
  if (!member) {
    const { data: memberByEmail } = await supabase
      .from('anggota')
      .select('*, wijk(nama_wijk)')
      .eq('email', email)
      .maybeSingle();
    member = memberByEmail;
  }

  // 3. Fallback: cari di Karantina menggunakan operator ->> (PostgreSQL JSONB text extraction)
  if (!member) {
    // 3a. Cari berdasarkan id_auth yang disuntikkan trigger ke raw_data
    const { data: qByAuthId } = await supabase
      .from('quarantine_anggota')
      .select('*')
      .filter('raw_data->>id_auth', 'eq', authId)
      .maybeSingle();

    if (qByAuthId) {
      member = {
        id_anggota: null,
        nama_lengkap: qByAuthId.raw_data.nama_lengkap,
        email: qByAuthId.raw_data.email ?? email,
        is_verified: false,
        created_at: qByAuthId.created_at,
        wijk: { nama_wijk: 'Dalam Antrean Vetting' }
      };
    } else {
      // 3b. Fallback terakhir: cari berdasarkan email di raw_data
      const { data: qByEmail } = await supabase
        .from('quarantine_anggota')
        .select('*')
        .filter('raw_data->>email', 'eq', email)
        .maybeSingle();

      if (qByEmail) {
        member = {
          id_anggota: null,
          nama_lengkap: qByEmail.raw_data.nama_lengkap,
          email: qByEmail.raw_data.email ?? email,
          is_verified: false,
          created_at: qByEmail.created_at,
          wijk: { nama_wijk: 'Dalam Antrean Vetting' }
        };
      } else {
        // PROFIL PLACEHOLDER — fallback jika tidak ditemukan di mana pun.
        member = {
          id_anggota: null,
          nama_lengkap: 'Jemaat RNHKBP',
          email: email,
          is_verified: false,
          created_at: new Date().toISOString(),
          wijk: { nama_wijk: 'Profil Belum Terhubung' }
        };
      }
    }
  }

  // 4. Riwayat Partisipasi (hanya untuk anggota tetap yang sudah punya id_anggota)
  const activities = member.id_anggota
    ? (await supabase
        .from('riwayat_partisipasi')
        .select('*, katalog_peran (bobot_kontribusi)')
        .eq('id_anggota', member.id_anggota)).data
    : [];

  // 5. Live Event — pakai .maybeSingle() agar tidak throw error jika tidak ada event aktif
  const { data: liveEvent } = await supabase
    .from('kegiatan')
    .select('*, kategori_kegiatan(nama_kategori)')
    .eq('is_open', true)
    .order('tanggal_mulai', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 6. Katalog Peran
  const { data: perans } = await supabase.from('katalog_peran').select('*');

  return {
    member,
    activities: activities || [],
    liveEvent: liveEvent || null,
    perans: perans || []
  };
}

export async function processCheckinTransaction(memberId: string, eventId: string, roleId: string, actorId: string) {
  const supabase = await createClient();

  // Verifikasi ganda (Double-booking prevention)
  const { data: existing } = await supabase
    .from('riwayat_partisipasi')
    .select('id_partisipasi')
    .eq('id_anggota', memberId)
    .eq('id_kegiatan', eventId)
    .maybeSingle();
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
  const supabase = await createClient();

  const { data: member, error: memberErr } = await supabase
    .from('anggota')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (memberErr || !member) throw new Error('Profil SSOT tidak ditemukan.');

  const { data: historyData, error: historyErr } = await supabase
    .from('riwayat_partisipasi')
    .select('*, kegiatan (nama_kegiatan, tanggal_mulai), katalog_peran (nama_peran, bobot_kontribusi)')
    .eq('id_anggota', member.id_anggota)
    .order('waktu_check_in', { ascending: false });

  if (historyErr) throw historyErr;

  return { member, history: historyData || [] };
}
