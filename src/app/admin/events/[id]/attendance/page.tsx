'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Khusus untuk channel Realtime
import { ArrowLeft, Power, Unlock, Lock, Loader2, ShieldCheck, Activity } from 'lucide-react';
import { animate, spring, waapi, stagger } from 'animejs';

// Import Controller & UI
import { fetchMonitorData, toggleGateStatus } from '@/actions/eventController';
import { LiveFeed } from '@/components/ui/LiveFeed';

export default function AdminAttendanceMonitor() {
  const { id } = useParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const statusIconRef = useRef<HTMLDivElement>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const { event: ev, logs } = await fetchMonitorData(id as string);
      if (ev) {
        setEvent(ev);
        setIsOpen(ev.is_open);
      }
      setAttendees(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // REAL-TIME: Pantau absen masuk
    const attendanceChannel = supabase
      .channel('attendance_live')
      .on('postgres_changes', { 
        event: '*', schema: 'public', table: 'riwayat_partisipasi', filter: `id_kegiatan=eq.${id}`
      }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(attendanceChannel); };
  }, [id]);

  // ── FITUR 1: WAAPI Background ──
  useEffect(() => {
    if (loading || !bgAmbientRef.current) return;
    const ambientAnim = waapi.animate(bgAmbientRef.current, {
      rotate: ['0deg', '360deg'], opacity: [0.02, 0.05, 0.02], scale: [1, 1.2, 1], duration: 40000, iterations: Infinity, easing: 'linear'
    });
    return () => { ambientAnim?.cancel(); };
  }, [loading]);

  // ── FITUR 2: 3D Vault Mechanism ──
  useEffect(() => {
    if (statusIconRef.current && !loading) {
      animate(statusIconRef.current, {
        scale: [0.8, 1], rotateY: isOpen ? [-90, 0] : [90, 0], opacity: [0, 1], duration: 1000, ease: spring({ bounce: 0.6 })
      });
    }
  }, [isOpen, loading]);

  // ── FITUR 3: Live Feed Elastic Entrance ──
  useEffect(() => {
    if (attendees.length > 0 && feedContainerRef.current) {
      const newItems = feedContainerRef.current.querySelectorAll('.feed-item:not(.animated)');
      if (newItems.length > 0) {
        animate(newItems, { x: [50, 0], opacity: [0, 1], duration: 800, ease: 'outElastic(1, 0.6)', delay: stagger(100) });
        newItems.forEach(item => item.classList.add('animated'));
      }
    }
  }, [attendees]);

  const handleToggleAttendance = async () => {
    setToggling(true);
    const result = await toggleGateStatus(id as string, isOpen);
    if (result.success) setIsOpen(result.newStatus!);
    setToggling(false);
  };

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.45 }) });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#051122] flex flex-col items-center justify-center p-10">
      <Loader2 className="animate-spin text-[#C5A059] mb-4" size={48} />
      <p className="text-[10px] font-black text-[#C5A059]/60 uppercase tracking-[0.3em] animate-pulse">Initializing Security Protocol...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#051122] flex flex-col lg:flex-row font-sans overflow-hidden relative">
      
      {/* WAAPI Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-center items-center opacity-40">
        <div ref={bgAmbientRef} className="w-[150vmax] h-[150vmax] rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.05), transparent)' }} />
      </div>

      {/* ── KIRI: CONTROL PANEL ── */}
      <div className={`relative z-10 flex-1 p-8 md:p-16 flex flex-col items-center justify-center transition-colors duration-1000 ${isOpen ? 'bg-transparent' : 'bg-[#051122]/60 backdrop-blur-md'}`}>
        
        <div className="absolute top-10 left-10">
          <button 
            onClick={() => router.back()} onMouseDown={(e) => handleSpringBtn(e, 'down')} onMouseUp={(e) => handleSpringBtn(e, 'up')}
            className="flex items-center gap-2 text-[#C5A059]/60 hover:text-[#C5A059] font-black text-[10px] uppercase tracking-widest transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </button>
        </div>

        <div className="text-center space-y-4 mb-16">
          <div className="flex flex-col items-center gap-2 mb-2">
            <ShieldCheck size={40} className="text-[#C5A059] drop-shadow-[0_0_15px_rgba(197,160,89,0.3)]" />
            <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-[0.5em]">Command Center</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">{event?.nama_kegiatan}</h1>
          <p className="text-xs font-bold text-[#C5A059]/50 uppercase tracking-[0.3em] italic">
            {event?.kategori_kegiatan?.nama_kategori} • RNHKBP Kayu Putih
          </p>
        </div>

        {/* STATUS BANNER & TOGGLE */}
        <div className="bg-[#0a192f]/40 backdrop-blur-xl p-12 rounded-[4rem] border border-[#C5A059]/20 shadow-2xl flex flex-col items-center gap-10 w-full max-w-md relative overflow-hidden group hover:border-[#C5A059]/40 transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Activity size={80} className="text-[#C5A059]" /></div>

          <div style={{ perspective: '500px' }} className="size-36 flex items-center justify-center relative">
            <div ref={statusIconRef} className={`w-full h-full rounded-full flex items-center justify-center transition-colors shadow-2xl relative ${isOpen ? 'bg-[#C5A059]/10 text-[#C5A059] border-2 border-[#C5A059]/30 shadow-[#C5A059]/10' : 'bg-red-950/20 text-red-500 border-2 border-red-500/20'}`}>
              {isOpen ? <Unlock size={64} className="animate-pulse" /> : <Lock size={64} />}
              {isOpen && <div className="absolute inset-0 rounded-full bg-[#C5A059] animate-ping opacity-10" />}
            </div>
          </div>
          
          <div className="text-center z-10">
            <h2 className={`text-2xl font-black uppercase tracking-[0.2em] italic ${isOpen ? 'text-[#C5A059]' : 'text-red-500'}`}>
              Absensi {isOpen ? 'Terbuka' : 'Tertutup'}
            </h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-3 leading-relaxed px-6">
              {isOpen ? "Sistem siap menerima data kehadiran jemaat." : "Akses enkripsi tombol absensi dinonaktifkan."}
            </p>
          </div>

          <button 
            onClick={handleToggleAttendance} disabled={toggling} onMouseDown={(e) => handleSpringBtn(e, 'down')} onMouseUp={(e) => handleSpringBtn(e, 'up')}
            className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-2xl relative z-10 ${isOpen ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white' : 'bg-[#C5A059] text-[#051122] hover:bg-[#d4b46a] shadow-[#C5A059]/20'}`}
          >
            {toggling ? <Loader2 className="animate-spin" /> : <Power size={18} />}
            {isOpen ? 'Shutdown Access' : 'Initiate Access'}
          </button>
        </div>
      </div>

      {/* ── KANAN: LIVE FEED (Telah Diekstrak) ── */}
      <LiveFeed attendees={attendees} feedContainerRef={feedContainerRef} />
      
      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(197, 160, 89, 0.1); border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(197, 160, 89, 0.3); }`}} />
    </div>
  );
}