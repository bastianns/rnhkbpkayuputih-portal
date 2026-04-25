'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchComprehensiveLeaderboard } from '@/actions/leaderboardController';
import { BrainCircuit, Activity, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

// Import Komponen UI Spesifik
import { PodiumSection } from '@/components/ui/PodiumSection';
import { RankingTable } from '@/components/ui/RankingTable';

// ── Anime.js V4 Imports ──
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';

export default function GlobalWijkLeaderboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const wijkList = await fetchComprehensiveLeaderboard();
        setData(wijkList || []);
      } catch (err) {
        console.error("Gagal menyusun leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ── Ambient Background ──
  useEffect(() => {
    if (loading || !bgAmbientRef.current) return;
    const ambientAnim = waapi.animate(bgAmbientRef.current, {
      rotate: ['0deg', '360deg'],
      opacity: [0.02, 0.05, 0.02],
      scale: [1, 1.15, 1],
      duration: 35000,
      iterations: Infinity,
      easing: 'linear'
    });
    return () => { ambientAnim?.cancel(); };
  }, [loading]);

  // ── Animations ──
  useEffect(() => {
    if (loading || data.length === 0) return;
    if (headerRef.current) headerRef.current.style.opacity = '0';
    const podiumNodes = Array.from(document.querySelectorAll('.anim-podium'));
    const rowNodes = Array.from(document.querySelectorAll('.anim-row'));

    const timer = setTimeout(() => {
      const headerNode = headerRef.current;
      const titleNode = titleRef.current;
      if (!headerNode || !titleNode) return;

      if (!titleNode.dataset.split) {
        splitText(titleNode, { chars: true });
        titleNode.dataset.split = "true";
      }

      const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } });
      tl.add(headerNode, { opacity: [0, 1], y: [-20, 0] });
      tl.add(titleNode.querySelectorAll('span'), { opacity: [0, 1], translateZ: [-50, 0], rotateX: [90, 0], delay: stagger(25) }, '<-=600');
      if (podiumNodes.length > 0) tl.add(podiumNodes, { opacity: [0, 1], scale: [0.8, 1], translateY: [80, 0], ease: 'outElastic(1, 0.5)', duration: 1400, delay: stagger(150, { start: 200 }) }, '<-=400');
      if (rowNodes.length > 0) tl.add(rowNodes, { opacity: [0, 1], x: [-30, 0], delay: stagger(60) }, '<-=800');
    }, 200);
    return () => clearTimeout(timer);
  }, [loading, data]);

  // ── PENGGUNAAN DATA LOKAL UNTUK EXPORT (Fix Efisiensi) ──
  const handleExportExcel = async () => {
    if (!data || data.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    
    setExporting(true);
    try {
      // Format data untuk Excel agar rapi (Client-side formatting)
      const formattedData = data.map((item: any, index: number) => ({
        "Peringkat": index + 1,
        "Nama Wilayah (Wijk)": item.nama_wijk || '-',
        "Total Poin Wilayah": item.total_poin_wilayah,
        "Indeks Keaktifan": item.indeks_keaktifan,
        "Jumlah Anggota": item.jumlah_anggota,
        "Status Wilayah": item.indeks_keaktifan >= 0.7 ? "Sangat Aktif" : (item.indeks_keaktifan >= 0.4 ? "Aktif" : "Perlu Perhatian")
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Wijk Leaderboard");
      
      // Auto-size columns dengan Guard (Fix Bug Crash)
      const maxWidth = formattedData.reduce((w, r) => Math.max(w, String(r["Nama Wilayah (Wijk)"] || "").length), 15);
      worksheet["!cols"] = [{ wch: 10 }, { wch: maxWidth + 5 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];

      XLSX.writeFile(workbook, `RNHKBP_Leaderboard_Wijk_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengunduh Excel.");
    } finally {
      setExporting(false);
    }
  };

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.45 }) });
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-[#051122]">
      <Loader2 className="animate-spin text-[#C5A059]" size={40} />
      <p className="font-black uppercase tracking-widest text-[#C5A059]/60 text-[10px] animate-pulse">Menghitung Power Score Wilayah...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-10 bg-[#051122] min-h-screen text-left relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-center items-center">
        <div ref={bgAmbientRef} className="w-[150vmax] h-[150vmax] rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.04), transparent)' }} />
      </div>

      <div className="relative z-10 space-y-10 max-w-7xl mx-auto">
        <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2 text-[#C5A059] font-black text-[10px] uppercase tracking-[0.3em] mb-2"><BrainCircuit size={14}/> Intelligence Dashboard</div>
            <div style={{ perspective: '800px' }} className="overflow-hidden pb-2">
              <h1 ref={titleRef} className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Wijk <span className="text-[#C5A059]">Performance</span> Index</h1>
            </div>
            <p className="text-[#C5A059]/60 font-bold text-xs uppercase tracking-widest flex items-center gap-2 opacity-70 mt-2"><Activity size={14}/> Berdasarkan Real-Time Calibration RNHKBP SSOT</p>
          </div>
          <button 
            disabled={exporting || data.length === 0}
            onClick={handleExportExcel}
            onMouseDown={(e) => handleSpringBtn(e, 'down')} onMouseUp={(e) => handleSpringBtn(e, 'up')}
            className="group flex items-center gap-3 px-8 py-4 bg-[#0a192f] border border-[#C5A059]/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#C5A059] hover:bg-[#C5A059] hover:text-[#051122] shadow-xl transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} className="group-hover:translate-y-0.5 transition-transform" />}
            {exporting ? "Memproses Data..." : "Export Executive Excel"}
          </button>
        </div>

        <PodiumSection topThreeData={data.slice(0, 3)} />
        <RankingTable allData={data} />
      </div>
    </div>
  );
}
