import { supabase } from '@/lib/supabase';

// 1. Mengambil 100 rekor log terbaru dengan join anggota [cite: 45, 46]
export async function getAuditLogs(limitCount: number = 100) {
  const { data, error } = await supabase
    .from('audit_log')
    .select(`
      *,
      anggota:actor_id (nama_lengkap)
    `)
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) throw error;
  return data || [];
}

// 2. Mengambil data mentah untuk kalkulasi statistik [cite: 47]
export async function getAllLogsForStats() {
  const { data, error } = await supabase.from('audit_log').select('action');
  if (error) throw error;
  return data || [];
}