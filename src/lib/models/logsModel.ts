import { createClient } from '@/lib/supabaseServer';

/**
 * 1. Mengambil 100 rekor log terbaru
 * Melakukan pemetaan manual untuk aktor karena FK sengaja dilepas agar 
 * bisa mencatat log Admin (email @rnhkbp.com) yang tidak ada di tabel anggota.
 */
export async function getAuditLogs(limitCount: number = 100) {
  const supabase = await createClient();
  
  // A. Ambil data log mentah saja (tanpa join yang menyebabkan error PGRST200)
  const { data: rawLogs, error: logError } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (logError) {
    console.error("Error fetching raw audit logs:", logError.message);
    throw logError;
  }

  if (!rawLogs || rawLogs.length === 0) return [];

  // B. Ambil daftar unik actor_id untuk mencari nama mereka
  const actorIds = [...new Set(rawLogs.map(log => log.actor_id).filter(Boolean))];

  // C. Cari nama lengkap dari tabel anggota untuk ID yang tersedia
  const { data: members } = await supabase
    .from('anggota')
    .select('id_auth, nama_lengkap')
    .in('id_auth', actorIds);

  // D. Mapping kembali nama ke objek log agar View tidak perlu berubah
  const memberMap = new Map(members?.map(m => [m.id_auth, m.nama_lengkap]) || []);

  return rawLogs.map(log => ({
    ...log,
    anggota: log.actor_id && memberMap.has(log.actor_id) 
      ? { nama_lengkap: memberMap.get(log.actor_id) } 
      : { nama_lengkap: 'System/Administrator' }
  }));
}

// 2. Mengambil data mentah untuk kalkulasi statistik
export async function getAllLogsForStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('audit_log').select('action');
  if (error) throw error;
  return data || [];
}
