'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, Users, CheckCircle2, Plus, Search, 
  Filter, ChevronRight, Clock, Activity, Loader2
} from 'lucide-react';
import Link from 'next/link';
import AddEventModal from './AddEventModal';

// ── Anime.js V4 Imports ──
import { animate, createTimeline, spring, splitText, stagger, waapi } from 'animejs';

export default function EventsAttendancePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('kegiatan')
      .select(`*, kategori_kegiatan (nama_kategori)`)
      .order('tanggal_mulai', { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── FITUR: Advanced Entry Choreography ──
  useEffect(() => {
    if (loading) return;

    // Sembunyikan elemen secara programmatic sebelum animasi mulai
    const stats = Array.from(document.querySelectorAll('.anim-stat'));
    const rows = Array.from(document.querySelectorAll('.anim-row'));
    const controls = document.querySelector('.anim-controls');

    const timer = setTimeout(() => {
      const headerNode = headerRef.current;
      const titleNode = titleRef.current;
      
      if (!headerNode || !titleNode) return;

      // Anti-Crash SplitText (Hanya jika belum di-split)
      let splitChars: any[] = [];
      if (!titleNode.dataset.split) {
        const split = splitText(titleNode, { chars: true });
        if (split && split.chars) splitChars = split.chars;
        titleNode.dataset.split = "true";
      } else {
        splitChars = Array.from(titleNode.querySelectorAll('span'));
      }

      const tl = createTimeline({ 
        defaults: { ease: 'outExpo', duration: 1000 } 
      });

      // 1. Header & Title Entrance
      tl.add(headerNode, { opacity: [0, 1], y: [-30, 0] });
      
      if (splitChars.length > 0) {
        tl.add(splitChars, {
          opacity: [0, 1],
          y: [20, 0],
          rotateX: [90, 0],
          delay: stagger(30)
        }, '<-=600');
      }

      // 2. Stats Cards Entrance (Staggered)
      if (stats.length > 0) {
        tl.add(stats, { 
          opacity: [0, 1], 
          scale: [0.9, 1], 
          y: [20, 0], 
          delay: stagger(100) 
        }, '<-=500');
      }

      // 3. Search Bar Entrance
      if (controls) {
        tl.add(controls, { opacity: [0, 1], y: [10, 0] }, '<-=400');
      }

      // 4. Table Rows Entrance (Advanced Stagger)
      if (rows.length > 0) {
        tl.add(rows, { 
          opacity: [0, 1], 
          x: [-20, 0], 
          delay: stagger(40, { from: 'first' }) 
        }, '<-=600');
      }

    }, 100);

    return () => clearTimeout(timer);
  }, [loading, events]);

  // ── FITUR: Tactile Spring Feedback ──
  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, {
      scale: state === 'down' ? 0.96 : 1,
      duration: 400,
      ease: spring({ bounce: 0.4 })
    });
  };

  const filteredEvents = events.filter(event => 
    event.nama_kegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.kategori_kegiatan?.nama_kategori?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 min-h-screen text-left font-sans bg-transparent relative z-10">
      
      {/* Header Section */}
      <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between gap-6 opacity-0">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em] flex items-center gap-2">
            <Activity size={14} /> Operations Center
          </p>
          <div style={{ perspective: '1000px' }} className="overflow-hidden pb-2">
            <h1 ref={titleRef} className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter">
              Manajemen Jadwal
            </h1>
          </div>
          <p className="text-[#C5A059]/60 text-xs font-bold uppercase tracking-widest mt-1">
            Sentralisasi Data Kegiatan & Partisipasi Jemaat
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          onMouseDown={(e) => handleSpringBtn(e, 'down')}
          onMouseUp={(e) => handleSpringBtn(e, 'up')}
          className="flex items-center justify-center gap-2 bg-[#C5A059] text-[#051122] px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#d4b46a] transition-colors shadow-lg shadow-[#C5A059]/20"
        >
          <Plus size={16} /> Buat Jadwal Baru
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EventStat className="anim-stat opacity-0" icon={<Calendar size={24} className="text-[#C5A059]" />} label="Total Kegiatan" value={events.length} />
        <EventStat className="anim-stat opacity-0" icon={<Clock size={24} className="text-[#C5A059]" />} label="Akan Datang" value={events.filter(e => new Date(e.tanggal_mulai) > new Date()).length} />
        <EventStat className="anim-stat opacity-0" icon={<CheckCircle2 size={24} className="text-[#C5A059]" />} label="Selesai" value={events.filter(e => new Date(e.tanggal_mulai) <= new Date()).length} />
      </div>

      {/* Control Bar (Search & Filter) */}
      <div className="anim-controls opacity-0 flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0a192f]/40 backdrop-blur-xl p-4 rounded-[1.5rem] border border-[#C5A059]/20 shadow-xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input 
            type="text" 
            placeholder="CARI NAMA / KATEGORI..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs text-white uppercase tracking-widest font-bold focus:border-[#C5A059] outline-none transition-all placeholder:text-white/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-colors">
            <Filter size={14} /> Filter Data
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-[#0a192f]/40 backdrop-blur-xl border border-[#C5A059]/20 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 border-b border-[#C5A059]/10">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Tanggal & Waktu</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Nama Kegiatan</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Kategori</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em] text-right">Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C5A059]/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="animate-spin text-[#C5A059]" size={32} />
                      <p className="text-[10px] uppercase tracking-widest text-[#C5A059]/60 font-bold">Sinkronisasi Data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-[10px] uppercase tracking-widest text-white/30 font-bold italic">
                    {searchTerm ? "Kegiatan tidak ditemukan." : "Belum ada jadwal kegiatan."}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const eventDate = new Date(event.tanggal_mulai);
                  const isPast = eventDate < new Date();
                  return (
                    <tr key={event.id_kegiatan} className="anim-row opacity-0 hover:bg-[#C5A059]/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white uppercase tracking-widest">
                            {eventDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest">
                            {eventDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-base font-black text-white uppercase italic tracking-tight group-hover:text-[#C5A059] transition-colors">
                            {event.nama_kegiatan}
                          </span>
                          {isPast && <span className="w-fit mt-1 text-[8px] font-black bg-white/10 text-white/50 px-2 py-0.5 rounded uppercase tracking-widest">Selesai</span>}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] text-[9px] font-black uppercase tracking-widest">
                          {event.kategori_kegiatan?.nama_kategori || 'General'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link 
                          href={`/admin/events/${event.id_kegiatan}/attendance`}
                          onMouseDown={(e) => handleSpringBtn(e as any, 'down')}
                          onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
                          className="inline-flex items-center gap-2 text-[10px] font-black text-[#C5A059] uppercase tracking-widest bg-[#C5A059]/10 hover:bg-[#C5A059] hover:text-[#051122] px-4 py-2.5 rounded-xl transition-all"
                        >
                          Buka Absensi <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchEvents} 
      />
    </div>
  );
}

function EventStat({ icon, label, value, className }: any) {
  return (
    <div className={`${className} bg-[#0a192f]/40 backdrop-blur-xl p-8 rounded-[2rem] border border-[#C5A059]/20 shadow-xl flex items-center justify-between group hover:border-[#C5A059]/50 transition-all duration-300`}>
      <div className="text-left">
        <p className="text-[10px] font-black text-[#C5A059]/60 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-4xl font-black text-white tracking-tighter italic">{value}</p>
      </div>
      <div className="p-4 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
        {icon}
      </div>
    </div>
  );
}