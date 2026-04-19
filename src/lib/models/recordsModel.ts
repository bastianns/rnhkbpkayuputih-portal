import { createClient } from '@/lib/supabaseServer';

/**
 * 1. Mengambil data Golden Record (Verified SSOT)
 */
export async function getVerifiedMembers() {
  const supabase = await createClient();
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
    .eq('is_verified', true) 
    .order('nama_lengkap', { ascending: true }); 

  if (error) throw error;
  return data || [];
}

/**
 * 2. Mencatat aktivitas ekspor ke Audit Log
 */
export async function logExportAction(totalRecords: number) {
  const supabase = await createClient();
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
 */
export async function getMemberById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('anggota')
    .select('*, wijk:id_wijk (nama_wijk, kode_wijk)')
    .eq('id_anggota', id)
    .maybeSingle(); 

  if (error) throw error;
  return data;
}

/**
 * 4. Rekonstruksi Member Journey (Riwayat Partisipasi)
 */
export async function getMemberJourney(id: string) {
  const supabase = await createClient();
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
    .order('waktu_check_in', { ascending: false });

  if (error) throw error;
  return data || [];
}
