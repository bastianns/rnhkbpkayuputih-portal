'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  History, 
  UserCheck, 
  ShieldAlert, 
  Database, 
  Clock, 
  User, 
  Info,
  Activity,
  Loader2
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      // 1. AMBIL LOG & JOIN DENGAN TABEL ANGGOTA
      // Mengambil actor_id yang berelasi dengan id_anggota untuk mendapatkan nama_lengkap
      const { data, error } = await supabase
        .from('audit_log')
        .select(`
          *,
          actor:actor_id (
            nama_lengkap
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setLogs(data);
      }
      setLoading(false);
    }

    fetchLogs();
  }, []);

  // 2. LOGIKA RENDER DETAIL MANUSIAWI
  const renderDetails = (log: any) => {
    if (log.action === 'OPEN_ATTENDANCE') return `Membuka gerbang absensi untuk kegiatan: ${log.entity_id.slice(0,8)}...`;
    if (log.action === 'CLOSE_ATTENDANCE') return `Menutup gerbang absensi untuk kegiatan: ${log.entity_id.slice(0,8)}...`;
    if (log.action === 'INSERT') return `Menambahkan data baru pada tabel ${log.entity.toUpperCase()}`;
    if (log.action === 'DELETE') return `Menghapus data dari tabel ${log.entity.toUpperCase()}`;
    if (log.action === 'RESOLVE_DEDUP') return `Melakukan resolusi duplikasi data jemaat`;
    
    return log.details || `Aktivitas pada entitas ${log.entity}`;
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
      <Loader2 className="animate-spin text-[#1e40af] mb-4" size={48} />
      <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.3em]">Sinkronisasi Log SSOT...</p>
    </div>
  );

  return (
    <div className="p-10 space-y-10 bg-[#f6f7f8] min-h-screen font-sans text-left">
      
      {/* Header Halaman Premium */}
      <div className="flex flex-col gap-2 text-left">
        <div className="flex items-center gap-2 text-[#1e40af] mb-1">
          <Activity size={20} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Security & Audit</span>
        </div>
        <h1 className="text-4xl font-black text-[#0f172a] uppercase tracking-tighter">System Audit Logs</h1>
        <p className="text-sm font-bold text-[#4e7397] uppercase tracking-widest opacity-60 italic">Integritas Data Keanggotaan Terverifikasi.</p>
      </div>

      {/* Ringkasan Aktivitas (Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <LogStat 
          icon={<History className="text-blue-600" />} 
          label="Total Aktivitas" 
          value={logs.length} 
        />
        <LogStat 
          icon={<Database className="text-green-600" />} 
          label="Perubahan Master" 
          value={logs.filter(l => ['INSERT', 'DELETE'].includes(l.action)).length} 
        />
        <LogStat 
          icon={<ShieldAlert className="text-amber-600" />} 
          label="Kontrol Event" 
          value={logs.filter(l => l.action.includes('ATTENDANCE')).length} 
        />
      </div>

      {/* Tabel Log Aktivitas Premium */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Waktu & Sesi</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Aktor Administratif</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Aksi Sistem</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Detail Perubahan Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic opacity-30">
                    Belum ada riwayat aktivitas terekam dalam basis data.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id_audit} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Clock size={14} className="text-slate-300" />
                        <span className="text-xs font-bold text-slate-500">
                          {new Date(log.created_at).toLocaleString('id-ID', { 
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={14} />
                        </div>
                        <span className="font-black text-xs text-[#0f172a] uppercase tracking-tight">
                          {log.actor?.nama_lengkap || 'System Auto'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                        log.action.includes('OPEN') ? 'bg-emerald-50 text-emerald-600' :
                        log.action.includes('DELETE') ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Info size={14} className="text-slate-300" />
                        <p className="text-xs font-bold text-[#4e7397] uppercase tracking-tighter">
                          {renderDetails(log)}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Sub-komponen Stat Card Premium
function LogStat({ icon, label, value }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-[#1e40af]/20 transition-all">
      <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[10px] font-black text-[#4e7397] uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-3xl font-black text-[#0f172a] tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
}