'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Database, Search, Filter, ShieldCheck, 
  MapPin, Phone, Mail, ChevronRight, 
  Users, Activity, Loader2
} from 'lucide-react';

// ── Anime.js V4 Imports ──
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';

export default function MasterRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Refs untuk Animasi Sinematik ──
  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('anggota')
        .select(`*, wijk:id_wijk (nama_wijk)`)
        .eq('is_verified', true)
        .order('nama_lengkap', { ascending: true });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error("Gagal memuat Master Records:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ── FITUR 1: WAAPI Ambient Background ──
  useEffect(() => {
    if (loading || !bgAmbientRef.current) return;
    const ambientAnim = waapi.animate(bgAmbientRef.current, {
      rotate: ['0deg', '360deg'],
      opacity: [0.03, 0.08, 0.03],
      scale: [1, 1.2, 1],
      duration: 40000,
      iterations: Infinity,
      easing: 'linear'
    });

    return () => { ambientAnim?.cancel(); };
  }, [loading]);

  // ── FITUR 2: Elastic Domino Effect & SplitText ──
  useEffect(() => {
    if (loading) return;

    // Sembunyikan elemen sebelum animasi
    if (headerRef.current) headerRef.current.style.opacity = '0';
    const stats = Array.from(document.querySelectorAll('.anim-stat'));
    stats.forEach(el => ((el as HTMLElement).style.opacity = '0'));
    const rows = Array.from(document.querySelectorAll('.anim-row'));
    rows.forEach(el => ((el as HTMLElement).style.opacity = '0'));

    const timer = setTimeout(() => {
      const headerNode = headerRef.current;
      const titleNode = titleRef.current;

      if (!headerNode || !titleNode) return;

      let splitChars: any[] = [];
      if (!titleNode.dataset.split) {
        titleNode.innerText = "Master Data Records";
        const split = splitText(titleNode, { chars: true });
        if (split && split.chars) splitChars = split.chars;
        titleNode.dataset.split = "true";
      } else {
        splitChars = Array.from(titleNode.querySelectorAll('span'));
      }

      const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } });

      tl.add(headerNode, { opacity: [0, 1], y: [-20, 0] });

      if (splitChars.length > 0) {
        tl.add(splitChars, {
          opacity: [0, 1], 
          y: [20, 0], 
          rotateX: [90, 0], 
          delay: stagger(30)
        }, '<-=600');
      }

      if (stats.length > 0) {
        tl.add(stats, { 
          opacity: [0, 1], 
          y: [20, 0], 
          delay: stagger(100) 
        }, '<-=500');
      }

      // DOMINO EFFECT UNTUK BARIS TABEL
      if (rows.length > 0) {
        tl.add(rows, { 
          opacity: [0, 1], 
          y: [40, 0], // Meluncur dari bawah
          ease: 'outElastic(1, 0.6)', // Efek membal yang elegan
          delay: stagger(40, { start: 100 }) // Efek berurutan (cascading)
        }, '<-=400');
      }

    }, 150);

    return () => clearTimeout(timer);
  }, [loading, records]);

  // ── FITUR 3: Tactile Spring Feedback ──
  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, {
      scale: state === 'down' ? 0.95 : 1,
      duration: 400,
      ease: spring({ bounce: 0.45 })
    });
  };

  const filteredRecords = records.filter(record => 
    record.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.wijk?.nama_wijk?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 min-h-screen bg-[#051122] font-sans text-left relative overflow-hidden">
      
      {/* WAAPI Background Effect */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-center items-center">
        <div 
          ref={bgAmbientRef} 
          className="w-[150vmax] h-[150vmax] rounded-full" 
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.04), transparent)' }} 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6" style={{ opacity: 0 }}>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em] flex items-center gap-2">
              <Database size={14} /> Single Source of Truth
            </p>
            <div style={{ perspective: '800px' }} className="overflow-hidden pb-2">
              <h1 ref={titleRef} className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                Master Data Records
              </h1>
            </div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
              Direktori Identitas Jemaat Terverifikasi
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard className="anim-stat" icon={<Users size={28}/>} label="Total Jemaat (SSOT)" value={records.length} />
          <StatCard className="anim-stat" icon={<ShieldCheck size={28}/>} label="Status Integritas" value="100% Verified" valueColor="text-[#C5A059]" />
          <StatCard className="anim-stat" icon={<Activity size={28}/>} label="Sistem Sinkronisasi" value="Online & Aktif" valueColor="text-emerald-400" />
        </div>

        {/* Control Bar (Search & Filter) */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0a192f]/60 backdrop-blur-2xl p-4 rounded-[1.5rem] border border-[#C5A059]/20 shadow-2xl">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#C5A059] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="CARI NAMA ATAU WIJK..." 
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-xs text-white uppercase tracking-widest font-bold focus:border-[#C5A059]/50 focus:bg-white/10 outline-none transition-all placeholder:text-white/20 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onMouseDown={(e) => handleSpringBtn(e as any, 'down')}
              onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-[#051122] hover:bg-[#C5A059] text-[#C5A059] hover:text-[#051122] border border-[#C5A059]/30 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-[#C5A059]/10"
            >
              <Filter size={14} /> Filter Wilayah
            </button>
          </div>
        </div>

        {/* Tabel Data SSOT */}
        <div className="bg-[#0a192f]/40 backdrop-blur-xl border border-[#C5A059]/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-[#C5A059]/10">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Identitas Jemaat</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Kontak Terdaftar</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Status Record</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="animate-spin text-[#C5A059]" size={36} />
                        <p className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059]/60 font-bold animate-pulse">Menarik Data Master...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center text-[10px] uppercase tracking-widest text-white/30 font-bold italic">
                      {searchTerm ? "Data tidak ditemukan." : "Belum ada data di dalam SSOT."}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id_anggota} className="anim-row hover:bg-[#C5A059]/10 transition-all duration-300 group cursor-default">
                      
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm md:text-base font-black text-white uppercase tracking-wider group-hover:text-[#C5A059] transition-colors">
                            {record.nama_lengkap}
                          </span>
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                            <MapPin size={12} className="text-[#C5A059]/80" /> {record.wijk?.nama_wijk || 'Belum Terklasifikasi'}
                          </span>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-bold text-white/60 flex items-center gap-2">
                            <Mail size={12} className="text-[#C5A059]/50" /> {record.email}
                          </span>
                          <span className="text-[10px] font-bold text-white/60 flex items-center gap-2">
                            <Phone size={12} className="text-[#C5A059]/50" /> {record.no_telp || '-'}
                          </span>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] text-[9px] font-black uppercase tracking-widest shadow-inner">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      </td>

                      <td className="px-8 py-6 text-right">
                        <Link 
                          href={`/admin/records/${record.id_anggota}`}
                          onMouseDown={(e) => handleSpringBtn(e as any, 'down')}
                          onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
                          className="inline-flex items-center gap-2 text-[10px] font-black text-[#C5A059] uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-[#C5A059] hover:text-[#051122] hover:border-[#C5A059] px-5 py-3 rounded-xl transition-all shadow-sm group-hover:shadow-[0_0_15px_rgba(197,160,89,0.3)]"
                        >
                          Golden Record <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Sub-komponen ──
function StatCard({ icon, label, value, valueColor = 'text-white', className = '' }: any) {
  return (
    <div className={`${className} bg-[#0a192f]/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[#C5A059]/20 shadow-2xl flex items-center justify-between group hover:border-[#C5A059]/50 transition-all duration-500`}>
      <div className="text-left space-y-1">
        <p className="text-[9px] font-black text-[#C5A059]/60 uppercase tracking-[0.3em] mb-1">{label}</p>
        <p className={`text-3xl font-black tracking-tighter italic ${valueColor}`}>{value}</p>
      </div>
      <div className="p-4 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-2xl group-hover:scale-110 group-hover:rotate-6 text-[#C5A059] transition-transform duration-500 shadow-inner">
        {icon}
      </div>
    </div>
  );
}