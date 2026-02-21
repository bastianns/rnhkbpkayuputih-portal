'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  History, 
  Database, 
  Clock, 
  User, 
  Info,
  Activity,
  Loader2,
  ShieldAlert,
  Search,
  ArrowRight,
  Eye
} from 'lucide-react';

// Definisi Tipe Data agar sinkron dengan skema database PostgreSQL
interface AuditLog {
  id_audit: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_data: any; 
  new_data: any; 
  created_at: string;
  // Relasi Join dari tabel anggota
  anggota?: {
    nama_lengkap: string;
  } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  /**
   * Mengambil data audit log dengan join ke tabel anggota.
   * Dibatasi 50 rekam terbaru untuk performa awal (SSOT).
   */
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('audit_log')
        .select(`
          *,
          anggota:actor_id (
            nama_lengkap
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filterAction !== 'ALL') {
        query = query.eq('action', filterAction);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data as any || []);
    } catch (err: any) {
      console.error("Audit Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [filterAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // --- LOGIKA INTERPRETASI DATA (MANUSIAWI) ---
  const renderDetails = (log: AuditLog) => {
    const { action, new_data, old_data, entity } = log;
    
    // 1. Integrasi Jalur Integritas Data (Deduplikasi)
    if (action === 'RESOLVE_DEDUP') {
      const decision = new_data?.decision || 'PROSES';
      const name = new_data?.subject_name || 'Jemaat';
      return (
        <span className="flex items-center gap-1">
          {decision === 'MERGE' ? 'Penggabungan Data' : 'Verifikasi Baru'} : <strong>{name}</strong>
        </span>
      );
    }

    // 2. Jalur User Experience & Hukum (UU PDP/Register)
    if (action === 'REGISTER_FLAGGED') {
      return `Deteksi Duplikat Sistem (Skor: ${new_data?.score || 0})`;
    }

    if (action === 'INSERT' || action === 'UPDATE') {
      const target = new_data?.nama_lengkap || new_data?.nama_kategori || entity;
      return `${action === 'INSERT' ? 'Penambahan' : 'Pembaruan'} pada "${target}"`;
    }
    
    return `Interaksi pada sistem ${entity}`;
  };

  // Filter log berdasarkan pencarian (nama aktor atau aksi)
  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.anggota?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f7f8]">
      <Loader2 className="animate-spin text-[#1e40af] mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sinkronisasi Log Akuntabilitas...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 bg-[#f6f7f8] min-h-screen font-sans text-left">
      
      {/* Header & UU PDP Compliance Tag */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#1e40af] mb-1">
            <Activity size={18} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Audit Trail & Governance</span>
          </div>
          <h1 className="text-3xl font-black text-[#0f172a] uppercase tracking-tight">System Audit Logs</h1>
          <p className="text-sm font-medium text-slate-500 italic">Menjamin transparansi setiap perubahan data sesuai standar UU PDP.</p>
        </div>
        
        {/* Kontrol Pencarian */}
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari Aktor/Aksi..." 
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm outline-none"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="ALL">Semua Aksi</option>
            <option value="RESOLVE_DEDUP">Resolusi Duplikat</option>
            <option value="INSERT">Data Baru</option>
            <option value="UPDATE">Pembaruan</option>
          </select>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <LogStat icon={<History className="text-blue-600" />} label="Total Records" value={logs.length} />
        <LogStat icon={<Database className="text-green-600" />} label="Integritas SSOT" value={logs.filter(l => l.action === 'RESOLVE_DEDUP').length} />
        <LogStat icon={<ShieldAlert className="text-amber-600" />} label="Peringatan Risiko" value={logs.filter(l => l.action.includes('FLAGGED')).length} />
      </div>

      {/* Main Table View */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Waktu Transaksi</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Aktor Pelaksana</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Aksi Sistem</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id_audit} className="hover:bg-blue-50/20 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={12} />
                      <span className="text-[11px] font-bold">
                        {new Date(log.created_at).toLocaleString('id-ID', { 
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                        <User size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-xs text-[#0f172a] uppercase tracking-tight">
                          {log.anggota?.nama_lengkap || 'System/Auto'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                           {log.actor_id ? log.actor_id.slice(0,8) : 'SISTEM-INTERNAL'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${
                      log.action === 'RESOLVE_DEDUP' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      log.action.includes('REGISTER') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-8 py-5">
                    <div className="flex items-center justify-between group/detail">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{log.entity}</span>
                        <p className="text-xs font-bold text-[#4e7397] uppercase tracking-tighter">
                          {renderDetails(log)}
                        </p>
                      </div>
                      {/* Tombol Inspeksi JSON (Opsional untuk Admin Teknis) */}
                      <button className="opacity-0 group-hover/detail:opacity-100 p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-blue-600">
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="py-20 text-center text-slate-300">
              <History size={48} className="mx-auto mb-2 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada aktivitas ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogStat({ icon, label, value }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-blue-200 transition-all">
      <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
      <div className="text-left">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-2xl font-black text-[#0f172a] leading-none">{value}</p>
      </div>
    </div>
  );
}