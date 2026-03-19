'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  LogIn,
  CheckSquare,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

// ── Anime.js V4 Imports ──
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';

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

  // ── Refs untuk Animasi Premium ──
  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

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

  // ── FITUR 1: WAAPI Ambient Background (Opera Gold) ──
  useEffect(() => {
    if (loading || !bgAmbientRef.current) return;
    const ambientAnim = waapi.animate(bgAmbientRef.current, {
      rotate: ['0deg', '360deg'],
      opacity: [0.02, 0.05, 0.02],
      scale: [1, 1.2, 1],
      duration: 45000,
      iterations: Infinity,
      easing: 'linear'
    });
    return () => { ambientAnim?.cancel(); };
  }, [loading]);

  // ── FITUR 2: Elastic Cinematic Choreography ──
  useEffect(() => {
    if (loading) return;

    if (headerRef.current) headerRef.current.style.opacity = '0';
    const statNodes = Array.from(document.querySelectorAll('.anim-log-stat'));
    statNodes.forEach(el => ((el as HTMLElement).style.opacity = '0'));
    const rowNodes = Array.from(document.querySelectorAll('.anim-log-row'));
    rowNodes.forEach(el => ((el as HTMLElement).style.opacity = '0'));

    const timer = setTimeout(() => {
      const headerNode = headerRef.current;
      const titleNode = titleRef.current;
      if (!headerNode || !titleNode) return;

      let splitChars: any[] = [];
      if (!titleNode.dataset.split) {
        titleNode.innerText = "System Audit Trail"; 
        const split = splitText(titleNode, { chars: true });
        if (split && split.chars) splitChars = split.chars;
        titleNode.dataset.split = "true";
      } else {
        splitChars = Array.from(titleNode.querySelectorAll('span'));
      }

      const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } });
      
      tl.add(headerNode, { opacity: [0, 1], y: [-20, 0] });
      
      // True 3D Split Text
      if (splitChars.length > 0) {
        tl.add(splitChars, {
          opacity: [0, 1], 
          translateZ: [-50, 0], // Efek kedalaman
          rotateX: [-90, 0], 
          ease: 'outElastic(1, 0.5)',
          delay: stagger(25)
        }, '<-=600');
      }

      if (statNodes.length > 0) {
        tl.add(statNodes, { opacity: [0, 1], y: [20, 0], delay: stagger(80) }, '<-=500');
      }

      // Elastic High-Performance Cascade untuk Rows
      if (rowNodes.length > 0) {
        tl.add(rowNodes, { 
          opacity: [0, 1], 
          x: [-40, 0], 
          ease: 'outElastic(1, 0.6)', 
          delay: stagger(25, { start: 100 }) // Delay dipercepat agar tidak terlalu lama jika log ada 100
        }, '<-=600');
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [loading, logs]);

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.45 }) });
  };

  const renderDetails = (log: AuditLog) => {
    const { action, new_data, entity } = log;
    switch (action) {
      case 'ADMIN_LOGIN': return `Administrator masuk ke sistem (Role: ${new_data?.role || 'ADMIN'})`;
      case 'MEMBER_LOGIN': return `Anggota "${new_data?.name || 'Jemaat'}" berhasil masuk portal`;
      case 'MEMBER_CHECKIN': return `Melakukan check-in kehadiran pada kegiatan`;
      case 'APPROVE_QUARANTINE': return `Menyetujui & Sinkronisasi data ke SSOT`;
      case 'REJECT_QUARANTINE': return `Menolak pengajuan data identitas`;
      case 'INSERT':
      case 'UPDATE': return `${action === 'INSERT' ? 'Penambahan' : 'Pembaruan'} pada entitas ${entity}`;
      default: return `Aktivitas pada sistem ${entity}`;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.anggota?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-[#051122]">
      <Loader2 className="animate-spin text-[#C5A059]" size={40} />
      <p className="font-black uppercase tracking-widest text-[#C5A059]/60 text-[10px] animate-pulse">Menarik Rekam Jejak Audit...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 bg-[#051122] min-h-screen font-sans text-left relative overflow-hidden">
      
      {/* WAAPI Background Effect */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-center items-start">
        <div 
          ref={bgAmbientRef} 
          className="w-[130vmax] h-[130vmax] -translate-y-1/2 rounded-full opacity-30" 
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.05), transparent)' }} 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between gap-6" style={{ opacity: 0 }}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#C5A059] font-black text-[10px] uppercase tracking-[0.4em] mb-1">
              <ShieldCheck size={14} className="animate-pulse" /> Governance & Audit
            </div>
            <div style={{ perspective: '800px' }} className="overflow-hidden pb-2 text-left">
              <h1 ref={titleRef} className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                System Audit Trail
              </h1>
            </div>
            <p className="text-[#C5A059]/40 text-xs font-bold uppercase tracking-widest italic">
              Log akuntabilitas sesuai standar UU PDP No. 27 Tahun 2022
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#C5A059] transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Cari aktor atau aksi..." 
                className="pl-12 pr-6 py-4 bg-[#0a192f]/60 backdrop-blur-xl border border-white/10 rounded-2xl text-xs font-bold text-white focus:border-[#C5A059]/50 focus:bg-white/10 outline-none w-72 transition-all shadow-2xl placeholder:text-white/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={fetchLogs}
              onMouseDown={(e) => handleSpringBtn(e, 'down')}
              onMouseUp={(e) => handleSpringBtn(e, 'up')}
              className="p-4 bg-[#0a192f]/60 backdrop-blur-xl border border-white/10 text-[#C5A059] rounded-2xl hover:bg-[#C5A059]/10 transition-all shadow-xl"
            >
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <LogStat className="anim-log-stat" icon={<History />} label="Total Records" value={logs.length} color="gold" />
          <LogStat className="anim-log-stat" icon={<LogIn />} label="Sesi Login" value={logs.filter(l => l.action.includes('LOGIN')).length} color="emerald" />
          <LogStat className="anim-log-stat" icon={<CheckSquare />} label="Verified Action" value={logs.filter(l => l.action.includes('APPROVE')).length} color="blue" />
          <LogStat className="anim-log-stat" icon={<ShieldAlert />} label="System Alerts" value={logs.filter(l => l.action.includes('REJECT')).length} color="red" />
        </div>

        {/* Audit Table */}
        <div className="bg-[#0a192f]/40 backdrop-blur-xl border border-[#C5A059]/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-[#C5A059]/10">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Timestamp</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Operator Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Action Type</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Activity Intelligence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-32 text-center opacity-30 uppercase font-black tracking-[0.3em] text-[10px] italic text-white">
                      No matching audit records found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id_audit} className="anim-log-row hover:bg-[#C5A059]/10 transition-all duration-300 group cursor-default">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-tight group-hover:text-[#C5A059]/60 transition-colors">
                          <Clock size={12} className="text-[#C5A059]/60 group-hover:text-[#C5A059]" />
                          {new Date(log.created_at).toLocaleString('id-ID', { 
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })} WIB
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-[#051122] transition-all duration-300">
                            <User size={14} />
                          </div>
                          <span className="text-white font-black text-[11px] uppercase tracking-wider group-hover:text-[#C5A059] transition-colors">
                            {log.anggota?.nama_lengkap || 'Root System'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex px-3 py-1.5 bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] rounded-lg text-[9px] font-black uppercase tracking-widest shadow-inner group-hover:bg-[#C5A059]/20 transition-colors">
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-white/50 text-[11px] font-bold italic tracking-wide group-hover:text-white/90 transition-colors">
                        {renderDetails(log)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(197, 160, 89, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(197, 160, 89, 0.3); }
      `}} />
    </div>
  );
}

// ── Sub-komponen ──
function LogStat({ icon, label, value, color, className = '' }: any) {
  const colorMap: any = {
    gold: 'text-[#C5A059] bg-[#C5A059]/10 border-[#C5A059]/20 shadow-[0_0_15px_rgba(197,160,89,0.2)]',
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    red: 'text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
  };

  return (
    <div className={`${className} bg-[#0a192f]/60 backdrop-blur-xl p-8 rounded-[2rem] border border-[#C5A059]/20 shadow-2xl flex items-center gap-5 group hover:border-[#C5A059]/50 transition-all duration-500`}>
      <div className={`p-4 rounded-2xl border ${colorMap[color]} group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-[#C5A059]/60 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
}