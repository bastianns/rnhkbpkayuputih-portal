'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Clock, 
  ArrowLeft, 
  Power, 
  Unlock, 
  Lock, 
  Loader2, 
  ShieldCheck,
  Activity,
  ChevronRight
} from 'lucide-react';

// ── Anime.js V4 Imports ──
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';

export default function AdminAttendanceMonitor() {
  const { id } = useParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // ── Refs untuk Animasi Sinematik ──
  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const statusIconRef = useRef<HTMLDivElement>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  // 1. Ambil Data Awal & List Hadir
  const fetchStatusAndAttendees = async () => {
    const { data: ev } = await supabase
      .from('kegiatan')
      .select('*, kategori_kegiatan(nama_kategori)')
      .eq('id_kegiatan', id)
      .single();
    
    if (ev) {
      setEvent(ev);
      setIsOpen(ev.is_open);
    }

    const { data: logs } = await supabase
      .from('riwayat_partisipasi')
      .select('*, anggota(nama_lengkap)')
      .eq('id_kegiatan', id)
      .order('waktu_check_in', { ascending: false });
    
    if (logs) setAttendees(logs);
    setLoading(false);
  };

  useEffect(() => {
    fetchStatusAndAttendees();

    // REAL-TIME: Pantau absen masuk
    const attendanceChannel = supabase
      .channel('attendance_live')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'riwayat_partisipasi',
        filter: `id_kegiatan=eq.${id}`
      }, () => fetchStatusAndAttendees())
      .subscribe();

    return () => { supabase.removeChannel(attendanceChannel); };
  }, [id]);

  // ── FITUR 1: WAAPI Background (Opera Gold) ──
  useEffect(() => {
    if (loading || !bgAmbientRef.current) return;
    const ambientAnim = waapi.animate(bgAmbientRef.current, {
      rotate: ['0deg', '360deg'],
      opacity: [0.02, 0.05, 0.02],
      scale: [1, 1.2, 1],
      duration: 40000,
      iterations: Infinity,
      easing: 'linear'
    });
    return () => { ambientAnim?.cancel(); };
  }, [loading]);

  // ── FITUR 2: 3D Vault Mechanism (Sinematik Lock/Unlock) ──
  useEffect(() => {
    if (statusIconRef.current && !loading) {
      animate(statusIconRef.current, {
        scale: [0.8, 1],
        rotateY: isOpen ? [-90, 0] : [90, 0], // Efek putaran 3D
        opacity: [0, 1],
        duration: 1000,
        ease: spring({ bounce: 0.6 })
      });
    }
  }, [isOpen, loading]);

  // ── FITUR 3: Live Feed Elastic Entrance ──
  useEffect(() => {
    if (attendees.length > 0 && feedContainerRef.current) {
      // Cari elemen baru yang belum dianimasikan
      const newItems = feedContainerRef.current.querySelectorAll('.feed-item:not(.animated)');
      
      if (newItems.length > 0) {
        animate(newItems, {
          x: [50, 0],
          opacity: [0, 1],
          duration: 800,
          ease: 'outElastic(1, 0.6)', // Efek membal natural saat kartu masuk
          delay: stagger(100)
        });
        
        // Tandai sebagai sudah dianimasikan
        newItems.forEach(item => item.classList.add('animated'));
      }
    }
  }, [attendees]);

  // 2. Fungsi Toggle Buka/Tutup Absensi
  const handleToggleAttendance = async () => {
    setToggling(true);
    const { error } = await supabase
      .from('kegiatan')
      .update({ is_open: !isOpen })
      .eq('id_kegiatan', id);

    if (!error) {
      setIsOpen(!isOpen);
    }
    setToggling(false);
  };

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, {
      scale: state === 'down' ? 0.95 : 1,
      duration: 400,
      ease: spring({ bounce: 0.45 })
    });
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
        <div 
          ref={bgAmbientRef} 
          className="w-[150vmax] h-[150vmax] rounded-full" 
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.05), transparent)' }} 
        />
      </div>

      {/* ── KIRI: CONTROL PANEL (THE OPERA STAGE) ── */}
      <div className={`relative z-10 flex-1 p-8 md:p-16 flex flex-col items-center justify-center transition-colors duration-1000 ${isOpen ? 'bg-transparent' : 'bg-[#051122]/60 backdrop-blur-md'}`}>
        
        <div className="absolute top-10 left-10">
          <button 
            onClick={() => router.back()} 
            onMouseDown={(e) => handleSpringBtn(e, 'down')}
            onMouseUp={(e) => handleSpringBtn(e, 'up')}
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
          
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Activity size={80} className="text-[#C5A059]" />
          </div>

          {/* 3D Vault Icon */}
          <div 
            style={{ perspective: '500px' }} // Penting untuk efek 3D
            className="size-36 flex items-center justify-center relative"
          >
            <div 
              ref={statusIconRef}
              className={`w-full h-full rounded-full flex items-center justify-center transition-colors shadow-2xl relative ${
                isOpen 
                ? 'bg-[#C5A059]/10 text-[#C5A059] border-2 border-[#C5A059]/30 shadow-[#C5A059]/10' 
                : 'bg-red-950/20 text-red-500 border-2 border-red-500/20'
              }`}
            >
              {isOpen ? <Unlock size={64} className="animate-pulse" /> : <Lock size={64} />}
              {isOpen && <div className="absolute inset-0 rounded-full bg-[#C5A059] animate-ping opacity-10" />}
            </div>
          </div>
          
          <div className="text-center z-10">
            <h2 className={`text-2xl font-black uppercase tracking-[0.2em] italic ${isOpen ? 'text-[#C5A059]' : 'text-red-500'}`}>
              Absensi {isOpen ? 'Terbuka' : 'Tertutup'}
            </h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-3 leading-relaxed px-6">
              {isOpen 
                ? "Sistem siap menerima data kehadiran jemaat melalui gerbang portal." 
                : "Akses enkripsi tombol absensi pada sisi jemaat dinonaktifkan."}
            </p>
          </div>

          <button 
            onClick={handleToggleAttendance}
            disabled={toggling}
            onMouseDown={(e) => handleSpringBtn(e, 'down')}
            onMouseUp={(e) => handleSpringBtn(e, 'up')}
            className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-2xl relative z-10 ${
              isOpen 
                ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white' 
                : 'bg-[#C5A059] text-[#051122] hover:bg-[#d4b46a] shadow-[#C5A059]/20'
            }`}
          >
            {toggling ? <Loader2 className="animate-spin" /> : <Power size={18} />}
            {isOpen ? 'Shutdown Access' : 'Initiate Access'}
          </button>
        </div>
      </div>

      {/* ── KANAN: LIVE FEED (THE AUDIT TRAIL) ── */}
      <div className="relative z-10 w-full lg:w-[500px] p-8 md:p-12 bg-[#0a192f]/60 backdrop-blur-2xl border-l border-[#C5A059]/10 overflow-y-auto custom-scrollbar flex flex-col">
        
        <div className="flex justify-between items-end mb-16 shrink-0">
          <div className="text-left">
            <h2 className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em] mb-3">Live Intelligence</h2>
            <div className="flex items-baseline gap-3">
              <p className="text-8xl font-black text-white tracking-tighter leading-none">{attendees.length}</p>
              <span className="text-xs font-black text-[#C5A059] uppercase tracking-widest italic">Hadir</span>
            </div>
          </div>
          <Users size={56} className="text-white/5" />
        </div>

        {/* Ref ditambahkan ke container feed */}
        <div ref={feedContainerRef} className="space-y-4 flex-1">
          {attendees.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-[#C5A059]/10 rounded-[3rem] bg-white/5 flex flex-col items-center gap-4">
              <Activity size={32} className="text-[#C5A059]/20 animate-pulse" />
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">Waiting for initial check-in...</p>
            </div>
          ) : (
            attendees.map((log) => (
              <div 
                key={log.id_partisipasi} 
                // Class feed-item ditambahkan, opacity 0 diatur inline agar ditangani Anime.js
                className="feed-item flex items-center gap-5 p-6 bg-white/5 rounded-[2.5rem] border border-white/5 hover:border-[#C5A059]/30 hover:bg-[#C5A059]/5 transition-colors group"
                style={{ opacity: 0 }}
              >
                <div className="size-14 bg-[#C5A059] text-[#051122] rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-6 transition-transform">
                  <Users size={24} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-black text-white uppercase text-sm truncate leading-none mb-2 italic tracking-wide group-hover:text-[#C5A059] transition-colors">
                    {log.anggota?.nama_lengkap}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-tighter">
                    <Clock size={12} className="text-[#C5A059]/40" /> 
                    {new Date(log.waktu_check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                   <ChevronRight size={14} className="text-white/10 group-hover:text-[#C5A059] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 shrink-0">
           <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em] text-center italic">
             RNHKBP SSOT Real-Time Calibration
           </p>
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