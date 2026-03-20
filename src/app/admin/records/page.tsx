'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Database, Search, ShieldCheck, Users, Activity, Loader2, Download } from 'lucide-react';
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';

// Import Controller & Component
import { fetchMasterRecords, generateExportPackage } from '@/actions/recordsController';
import { StatCard } from '@/components/ui/StatCard';
import { RecordsTable } from '@/components/ui/RecordsTable';

export default function MasterRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMasterRecords();
      setRecords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
    if (headerRef.current) headerRef.current.style.opacity = '0';
    
    // Anime.js tetap akan mendeteksi class ini meski berada di dalam komponen terpisah
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
      if (splitChars.length > 0) tl.add(splitChars, { opacity: [0, 1], y: [20, 0], rotateX: [90, 0], delay: stagger(30) }, '<-=600');
      if (stats.length > 0) tl.add(stats, { opacity: [0, 1], y: [20, 0], delay: stagger(100) }, '<-=500');
      if (rows.length > 0) tl.add(rows, { opacity: [0, 1], y: [40, 0], ease: 'outElastic(1, 0.6)', delay: stagger(40, { start: 100 }) }, '<-=400');
    }, 150);

    return () => clearTimeout(timer);
  }, [loading, records]);

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.45 }) });
  };

  const filteredRecords = records.filter(record => 
    record.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.wijk?.nama_wijk?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportData = async () => {
    setExporting(true);
    try {
      const result = await generateExportPackage(filteredRecords);
      if (result.success && result.csvData) {
        const blob = new Blob([result.csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `Paket_Serah_Terima_SSOT_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert("Gagal mengekspor data.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 min-h-screen bg-[#051122] font-sans text-left relative overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-center items-center">
        <div ref={bgAmbientRef} className="w-[150vmax] h-[150vmax] rounded-full" 
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.04), transparent)' }} />
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
          
          <button 
            onClick={handleExportData}
            disabled={exporting || filteredRecords.length === 0}
            onMouseDown={(e) => handleSpringBtn(e as any, 'down')}
            onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
            className="flex items-center gap-3 px-8 py-4 bg-[#C5A059] hover:bg-[#d4b46a] text-[#051122] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-[#C5A059]/20 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? "Memproses Paket..." : "Export Golden Records"}
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard className="anim-stat" icon={<Users size={28}/>} title="Total Jemaat (SSOT)" value={records.length} sub="Verified Master Records" />
          <StatCard className="anim-stat" icon={<ShieldCheck size={28}/>} title="Status Integritas" value="100%" sub="Verified Accuracy" />
          <StatCard className="anim-stat" icon={<Activity size={28}/>} title="Sinkronisasi" value="Aktif" sub="Online & Syncing" />
        </div>

        {/* Control Bar (Search) */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0a192f]/60 backdrop-blur-2xl p-4 rounded-[1.5rem] border border-[#C5A059]/20 shadow-2xl">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#C5A059] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="CARI NAMA ATAU WIJK UNTUK DIEKSPOR..." 
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-xs text-white uppercase tracking-widest font-bold focus:border-[#C5A059]/50 focus:bg-white/10 outline-none transition-all placeholder:text-white/20 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* ── Komponen Tabel yang Telah Diekstrak ── */}
        <RecordsTable 
          loading={loading} 
          records={filteredRecords} 
          searchTerm={searchTerm} 
        />

      </div>
    </div>
  );
}