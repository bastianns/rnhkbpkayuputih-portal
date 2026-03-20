'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { History, ShieldCheck, Search, RefreshCcw, LogIn, CheckSquare, ShieldAlert, Loader2 } from 'lucide-react';
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';

// MVC Imports
import { fetchSystemLogs } from '@/actions/logsController';
import { LogStat } from '@/components/ui/LogStat'; // Asumsi sub-komponen diekstrak
import { LogsTable } from '@/components/ui/LogsTable';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchSystemLogs();
      setLogs(result.logs);
      setStats(result.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // ── Animasi Background & Entry ──
  useEffect(() => {
    if (loading || !bgAmbientRef.current) return;
    waapi.animate(bgAmbientRef.current, {
      rotate: ['0deg', '360deg'], opacity: [0.02, 0.05, 0.02], scale: [1, 1.2, 1], duration: 45000, iterations: Infinity, easing: 'linear'
    });
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (!headerRef.current || !titleRef.current) return;
      if (!titleRef.current.dataset.split) {
        titleRef.current.innerText = "System Audit Trail"; 
        splitText(titleRef.current, { chars: true });
        titleRef.current.dataset.split = "true";
      }
      const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } });
      tl.add(headerRef.current, { opacity: [0, 1], y: [-20, 0] });
      tl.add(titleRef.current.querySelectorAll('span'), { opacity: [0, 1], rotateX: [-90, 0], ease: 'outElastic(1, 0.5)', delay: stagger(25) }, '<-=600');
      tl.add(document.querySelectorAll('.anim-log-stat'), { opacity: [0, 1], y: [20, 0], delay: stagger(80) }, '<-=500');
      tl.add(document.querySelectorAll('.anim-log-row'), { opacity: [0, 1], x: [-40, 0], ease: 'outElastic(1, 0.6)', delay: stagger(25) }, '<-=600');
    }, 150);
    return () => clearTimeout(timer);
  }, [loading, logs]);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.anggota?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-[#051122]">
      <Loader2 className="animate-spin text-[#C5A059]" size={40} />
      <p className="font-black uppercase tracking-widest text-[#C5A059]/60 text-[10px]">Menarik Rekam Jejak Audit...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 bg-[#051122] min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 flex justify-center items-start">
        <div ref={bgAmbientRef} className="w-[130vmax] h-[130vmax] -translate-y-1/2 rounded-full opacity-30" style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.05), transparent)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between gap-6" style={{ opacity: 0 }}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#C5A059] font-black text-[10px] uppercase tracking-[0.4em] mb-1"><ShieldCheck size={14} /> Governance & Audit</div>
            <h1 ref={titleRef} className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">System Audit Trail</h1>
            <p className="text-[#C5A059]/40 text-xs font-bold uppercase tracking-widest italic">Standar Akuntabilitas UU PDP No. 27 Tahun 2022</p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                placeholder="Cari aktor atau aksi..." 
                className="pl-12 pr-6 py-4 bg-[#0a192f]/60 backdrop-blur-xl border border-white/10 rounded-2xl text-xs font-bold text-white focus:border-[#C5A059]/50 w-72 outline-none"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={loadLogs} className="p-4 bg-[#0a192f]/60 text-[#C5A059] rounded-2xl border border-white/10 shadow-xl"><RefreshCcw size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <LogStat className="anim-log-stat" icon={<History />} label="Total Records" value={stats?.total} color="gold" />
          <LogStat className="anim-log-stat" icon={<LogIn />} label="Sesi Login" value={stats?.logins} color="emerald" />
          <LogStat className="anim-log-stat" icon={<CheckSquare />} label="Verified Action" value={stats?.verified} color="blue" />
          <LogStat className="anim-log-stat" icon={<ShieldAlert />} label="System Alerts" value={stats?.alerts} color="red" />
        </div>

        <LogsTable logs={filteredLogs} />
      </div>
    </div>
  );
}