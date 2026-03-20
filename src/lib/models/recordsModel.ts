import { supabase } from '@/lib/supabase';

// 1. Mengambil data Golden Record (Verified SSOT)
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
      wijk:id_wijk (nama_wijk, kode_wijk)
    `)
    .eq('is_verified', true)
    .order('nama_lengkap', { ascending: true });

  if (error) throw error;
  return data || [];
}

// 2. Mencatat aktivitas ekspor ke Audit Log
export async function logExportAction(totalRecords: number) {
  const { error } = await supabase
    .from('audit_log')
    .insert({
      action: 'EXPORT_RECORDS',
      entity: 'anggota_golden_record',
      new_data: { total_exported: totalRecords, format: 'CSV' },
    });

  if (error) throw error;
}

export async function getMemberById(id: string) {
  const { data, error } = await supabase
    .from('anggota')
    .select('*, wijk:id_wijk (nama_wijk, kode_wijk)')
    .eq('id_anggota', id)
    .single();
  if (error) throw error;
  return data;
}

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
    .order('waktu_check_in', { ascending: false });
  if (error) throw error;
  return data || [];
}