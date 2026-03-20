"use server";

import { getAuditLogs, getAllLogsForStats } from '@/lib/models/logsModel';

export async function fetchSystemLogs() {
  try {
    const [rawLogs, statData] = await Promise.all([
      getAuditLogs(100),
      getAllLogsForStats()
    ]);

    // Transformasi data: Interpretasi JSON ke Kalimat Manusia 
    const formattedLogs = rawLogs.map(log => ({
      ...log,
      human_details: parseLogDetails(log)
    }));

    // Kalkulasi statistik dinamis [cite: 47]
    const stats = {
      total: statData.length,
      logins: statData.filter(l => l.action.includes('LOGIN')).length,
      verified: statData.filter(l => l.action.includes('APPROVE')).length,
      alerts: statData.filter(l => l.action.includes('REJECT')).length,
    };

    return { logs: formattedLogs, stats };
  } catch (error) {
    console.error("Gagal memproses jejak audit:", error);
    throw new Error("Sistem log gagal dijangkau");
  }
}

// Fungsi interpretasi payload JSON 
function parseLogDetails(log: any) {
  const { action, new_data, entity } = log;
  switch (action) {
    case 'ADMIN_LOGIN': return `Administrator masuk ke sistem (Role: ${new_data?.role || 'ADMIN'})`;
    case 'MEMBER_LOGIN': return `Anggota "${new_data?.name || 'Jemaat'}" berhasil masuk portal`;
    case 'MEMBER_CHECKIN': return `Melakukan check-in kehadiran pada kegiatan`;
    case 'APPROVE_QUARANTINE': return `Menyetujui & Sinkronisasi data ke SSOT`;
    case 'REJECT_QUARANTINE': return `Menolak pengajuan data identitas`;
    case 'INSERT':
    case 'UPDATE': return `${action === 'INSERT' ? 'Penambahan' : 'Pembaruan'} pada entitas ${entity}`;
    case 'EXPORT_RECORDS': return `Mengekspor ${new_data?.total_exported} data ke format ${new_data?.format}`;
    default: return `Aktivitas pada sistem ${entity}`;
  }
}