import { supabase } from '@/lib/supabase';

/**
 * 1. Mengambil data Golden Record (Verified SSOT)
 * Digunakan untuk menyajikan buku induk digital terpusat[cite: 36, 38].
 * Melakukan kueri gabungan antara tabel 'anggota' dan 'wijk'[cite: 42].
 */
export async function getVerifiedMembers() {
  const { data, error } = await supabase
    .from('anggota')
    .select(`
      id_anggota,
      nama_lengkap,
      tanggal_lahir,
      email,
      no_telp,
      status_keanggotaan,
      is_verified,
      created_at,
      updated_at,
      wijk:id_wijk (nama_wijk, kode_wijk)
    `)
    .eq('is_verified', true) // Hanya mengambil jemaat yang telah tervalidasi SSOT 
    .order('nama_lengkap', { ascending: true }); // Diurutkan berdasarkan nama 

  if (error) throw error;
  return data || [];
}

/**
 * 2. Mencatat aktivitas ekspor ke Audit Log
 * Bagian dari fase akuntabilitas untuk mencatat jejak digital[cite: 36, 22].
 */
export async function logExportAction(totalRecords: number) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('audit_log')
    .insert({
      actor_id: user?.id,
      action: 'EXPORT_RECORDS',
      entity: 'anggota_golden_record',
      new_data: { 
        total_exported: totalRecords, 
        format: 'CSV',
        timestamp: new Date().toISOString()
      },
    });

  if (error) throw error;
}

/**
 * 3. Mengambil data identitas anggota berdasarkan ID
 * Digunakan dalam Fase Inisialisasi Profil untuk menarik data identitas statis[cite: 19, 20].
 */
export async function getMemberById(id: string) {
  const { data, error } = await supabase
    .from('anggota')
    .select('*, wijk:id_wijk (nama_wijk, kode_wijk)')
    .eq('id_anggota', id)
    .single(); // Memastikan hanya menarik satu rekor spesifik 

  if (error) throw error;
  return data;
}

/**
 * 4. Rekonstruksi Member Journey (Riwayat Partisipasi)
 * Menyusun seluruh kegiatan yang pernah diikuti secara kronologis[cite: 21].
 */
export async function getMemberJourney(id: string) {
  const { data, error } = await supabase
    .from('riwayat_partisipasi')
    .select(`
      id_partisipasi,
      waktu_check_in,
      status_kehadiran,
      kegiatan:id_kegiatan (nama_kegiatan, tanggal_mulai),
      peran:id_peran (nama_peran)
    `)
    .eq('id_anggota', id)
    .order('waktu_check_in', { ascending: false }); // Sort by waktu_check_in DESC [cite: 21]

  if (error) throw error;
  return data || [];
}