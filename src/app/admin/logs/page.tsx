'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  History, 
  Database, 
  Clock, 
  User, 
  Activity,
  Loader2,
  ShieldAlert,
  Search,
  RefreshCcw,
  Eye,
  LogIn,
  CheckSquare
} from 'lucide-react';

interface AuditLog {
  id_audit: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_data: any; 
  new_data: any; 
  created_at: string;
  anggota?: {
    nama_lengkap: string;
  } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

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
        .limit(100);

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

  /**
   * Interpretasi Aksi untuk mendukung akuntabilitas SSOT
   */
  const renderDetails = (log: AuditLog) => {
    const { action, new_data, entity } = log;
    
    switch (action) {
      case 'ADMIN_LOGIN':
        return `Administrator masuk ke sistem (Role: ${new_data?.role || 'ADMIN'})`;
      case 'MEMBER_LOGIN':
        return `Anggota "${new_data?.name || 'Jemaat'}" berhasil masuk portal`;
      case 'MEMBER_CHECKIN':
        return `Melakukan check-in kehadiran pada kegiatan`;
      case 'RESOLVE_DEDUP':
        return `${new_data?.decision === 'MERGE' ? 'Penggabungan' : 'Verifikasi'} identitas: ${new_data?.subject_name}`;
      case 'REGISTER_FLAGGED':
        return `Sistem mendeteksi potensi duplikat (Skor: ${new_data?.score})`;
      case 'INSERT':
      case 'UPDATE':
        return `${action === 'INSERT' ? 'Penambahan' : 'Pembaruan'} pada entitas ${entity}`;
      default:
        return `Aktivitas pada sistem ${entity}`;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.anggota?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f7f8]">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sinkronisasi Audit Trail...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 bg-[#f6f7f8] min-h-screen font-sans text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Activity size={18} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Governance & Audit</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">System Logs</h1>
          <p className="text-xs font-medium text-slate-500 italic uppercase">Log akuntabilitas sesuai standar UU PDP No. 27 Tahun 2022.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari aktor atau aksi..." 
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchLogs}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCcw size={18} className="text-slate-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <LogStat icon={<History className="text-blue-600" />} label="Total Records" value={logs.length} />
        <LogStat icon={<LogIn className="text-green-600" />} label="Sesi Login" value={logs.filter(l => l.action.includes('LOGIN')).length} />
        <LogStat icon={<CheckSquare className="text-purple-600" />} label="Check-In" value={logs.filter(l => l.action === 'MEMBER_CHECKIN').length} />
        <LogStat icon={<ShieldAlert className="text-amber-600" />} label="Deduplikasi" value={logs.filter(l => l.action === 'RESOLVE_DEDUP').length} />
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Waktu</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Aktor</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Aksi</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Deskripsi Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-bold">
              {filteredLogs.map((log) => (
                <tr key={log.id_audit} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-5 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock size={12} />
                      {new Date(log.created_at).toLocaleString('id-ID', { 
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-300" />
                      <span className="text-slate-900 uppercase">{log.anggota?.nama_lengkap || 'System/Admin'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase tracking-tighter">
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-slate-600 italic">
                    {renderDetails(log)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="py-20 text-center opacity-30 uppercase font-black tracking-widest text-[10px]">
              Belum ada aktivitas terekam
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogStat({ icon, label, value }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}