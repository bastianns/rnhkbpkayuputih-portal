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