'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Plus, Search } from 'lucide-react';
import { animate, createTimeline, spring, splitText, stagger, waapi } from 'animejs';

// Import Controller & Komponen
import { fetchAllEvents } from '@/actions/eventController';
import { EventsTable } from '@/components/ui/EventsTable';
import AddEventModal from './AddEventModal'; 

export default function EventsAttendancePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllEvents();
    setEvents(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── FITUR 2: Elastic Domino Effect ──
  useEffect(() => {
    if (loading) return;
    if (headerRef.current) headerRef.current.style.opacity = '0';
    const rows = Array.from(document.querySelectorAll('.anim-row'));
    rows.forEach(el => ((el as HTMLElement).style.opacity = '0'));

    const timer = setTimeout(() => {
      const headerNode = headerRef.current;
      const titleNode = titleRef.current;
      if (!headerNode || !titleNode) return;

      let splitChars: any[] = [];
      if (!titleNode.dataset.split) {
        titleNode.innerText = "Event & Attendance";
        const split = splitText(titleNode, { chars: true });
        if (split && split.chars) splitChars = split.chars;
        titleNode.dataset.split = "true";
      } else {
        splitChars = Array.from(titleNode.querySelectorAll('span'));
      }

      const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } });
      tl.add(headerNode, { opacity: [0, 1], y: [-20, 0] });
      if (splitChars.length > 0) tl.add(splitChars, { opacity: [0, 1], y: [20, 0], rotateX: [90, 0], delay: stagger(30) }, '<-=600');
      if (rows.length > 0) tl.add(rows, { opacity: [0, 1], y: [40, 0], ease: 'outElastic(1, 0.6)', delay: stagger(40) }, '<-=400');
    }, 150);

    return () => clearTimeout(timer);
  }, [loading, events]);

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.45 }) });
  };

  const filteredEvents = events.filter(ev => 
    ev.nama_kegiatan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 min-h-screen bg-[#051122] font-sans text-left relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6" style={{ opacity: 0 }}>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em] flex items-center gap-2">
              <Calendar size={14} /> Schedule & Tracking
            </p>
            <div style={{ perspective: '800px' }} className="overflow-hidden pb-2">
              <h1 ref={titleRef} className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                Event & Attendance
              </h1>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            onMouseDown={(e) => handleSpringBtn(e as any, 'down')} onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
            className="flex items-center gap-3 px-8 py-4 bg-[#C5A059] hover:bg-[#d4b46a] text-[#051122] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-[#C5A059]/20"
          >
            <Plus size={16} /> Tambah Kegiatan
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0a192f]/60 backdrop-blur-2xl p-4 rounded-[1.5rem] border border-[#C5A059]/20 shadow-2xl">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#C5A059] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="CARI KEGIATAN..." 
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-xs text-white uppercase tracking-widest font-bold focus:border-[#C5A059]/50 outline-none transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* ── Tabel UI yang Telah Diekstrak ── */}
        <EventsTable loading={loading} events={filteredEvents} searchTerm={searchTerm} />

      </div>

      <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchEvents} />
    </div>
  );
}