'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  History, 
  Database, 
  Clock, 
  User, 
  Info,
  Activity,
  Loader2,
  ShieldAlert
} from 'lucide-react';

// Definisi Tipe Data (Interface) agar coding lebih aman & autocomplete jalan
interface AuditLog {
  id_audit: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_data: any; // jsonb
  new_data: any; // jsonb
  created_at: string;
  // Relasi Join (Virtual) dari Supabase
  anggota?: {
    nama_lengkap: string;
  } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        // [UPDATE PENTING] 
        // Syntax ini memberitahu Supabase: "Gunakan kolom actor_id untuk join ke tabel anggota"
        const { data, error } = await supabase
          .from('audit_log')
          .select(`
            *,
            anggota:actor_id (
              nama_lengkap
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
            console.error("Error fetching logs:", error.message);
        }

        if (data) {
          // Casting data ke tipe AuditLog agar aman
          setLogs(data as any);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  // --- LOGIKA RENDER DETAIL MANUSIAWI ---
  const renderDetails = (log: AuditLog) => {
    const action = log.action;
    
    // 1. Logika Absensi/Event
    if (action.includes('ATTENDANCE')) {
       return log.entity_id 
        ? `Event ID: ${log.entity_id.slice(0, 8)}...`
        : 'Update status absensi';
    }

    // 2. Logika Deduplikasi (RESOLVE)
    if (action === 'RESOLVE_DEDUP') {
      const decision = log.new_data?.decision || 'Unknown';
      return `Resolusi Duplikat: ${decision.toUpperCase()}`;
    }

    // 3. Logika Deduplikasi (REGISTER FLAGGED / KARANTINA)
    if (action === 'REGISTER_FLAGGED') {
      return `Deteksi Duplikat (Score: ${log.new_data?.score ?? 0})`;
    }
    
    // 4. Logika Register Sukses
    if (action === 'REGISTER_SUCCESS') {
      return `Pendaftaran Anggota Baru Berhasil`;
    }

    // 5. Logika Insert/Update Umum (Fallback ke JSON new_data)
    if (log.new_data) {
      // Coba cari field nama atau status untuk ditampilkan sebagai preview
      const preview = log.new_data.nama_lengkap || log.new_data.nama_kategori || log.new_data.status || 'Data Record';
      
      if (action === 'INSERT') return `Menambah data: "${preview}"`;
      if (action === 'UPDATE') return `Update data: "${preview}"`;
    }
    
    // Fallback Terakhir
    return `Interaksi pada entitas ${log.entity}`;
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
      <Loader2 className="animate-spin text-[#1e40af] mb-4" size={48} />
      <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.3em]">Sinkronisasi Log SSOT...</p>
    </div>
  );

  return (
    <div className="p-10 space-y-10 bg-[#f6f7f8] min-h-screen font-sans text-left">
      
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 text-left">
        <div className="flex items-center gap-2 text-[#1e40af] mb-1">
          <Activity size={20} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Security & Audit</span>
        </div>
        <h1 className="text-4xl font-black text-[#0f172a] uppercase tracking-tighter">System Audit Logs</h1>
        <p className="text-sm font-bold text-[#4e7397] uppercase tracking-widest opacity-60 italic">Integritas Data Keanggotaan Terverifikasi.</p>
      </div>

      {/* Metrics Cards (Statistik) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <LogStat 
          icon={<History className="text-blue-600" />} 
          label="Total Aktivitas" 
          value={logs.length} 
        />
        <LogStat 
          icon={<Database className="text-green-600" />} 
          label="Perubahan Master" 
          value={logs.filter(l => ['INSERT', 'DELETE', 'UPDATE', 'RESOLVE_DEDUP'].includes(l.action)).length} 
        />
        <LogStat 
          icon={<ShieldAlert className="text-amber-600" />} 
          label="Kontrol Event & Risk" 
          value={logs.filter(l => l.action.includes('ATTENDANCE') || l.entity === 'quarantine').length} 
        />
      </div>

      {/* Tabel Log Aktivitas */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Waktu & Sesi</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Aktor Administratif</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Aksi Sistem</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Detail & Integritas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic opacity-30">
                    Belum ada riwayat aktivitas terekam.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id_audit} className="hover:bg-slate-50/80 transition-all group">
                    {/* Kolom 1: Waktu */}
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

                    {/* Kolom 2: Aktor (Join Table) */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          {/* [UPDATE] Handle kalau aktor-nya NULL (System Auto) atau relasi tidak ketemu */}
                          <span className="font-black text-xs text-[#0f172a] uppercase tracking-tight">
                            {log.anggota?.nama_lengkap || 'System Automation'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                             {log.actor_id ? log.actor_id.slice(0,8) : 'AUTO-PROCESS'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Kolom 3: Action Tag (Warna-warni) */}
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                        log.action.includes('SUCCESS') ? 'bg-emerald-50 text-emerald-600' :
                        log.action.includes('FLAGGED') ? 'bg-amber-50 text-amber-600' :
                        log.action.includes('DELETE') ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Kolom 4: Detail Data */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Info size={14} className="text-slate-300" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                {log.entity}
                            </span>
                            <p className="text-xs font-bold text-[#4e7397] uppercase tracking-tighter">
                            {renderDetails(log)}
                            </p>
                        </div>
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

// Sub-komponen Stat
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