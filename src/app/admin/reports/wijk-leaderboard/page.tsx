'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, Activity, Medal, Crown, 
  AlertTriangle, BrainCircuit, Download, 
  ChevronUp, Loader2
} from 'lucide-react';

// ── Anime.js V4 Imports ──
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';

export default function GlobalWijkLeaderboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Refs untuk Animasi Premium ──
  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    fetchComprehensiveLeaderboard();
  }, []);

  const fetchComprehensiveLeaderboard = async () => {
    setLoading(true);
    try {
      const { data: wijkList, error } = await supabase
        .from('view_global_wijk_leaderboard')
        .select('*')
        .order('total_poin_wilayah', { ascending: false });
      
      if (error) throw error;
      setData(wijkList || []);
    } catch (err) {
      console.error("Gagal menyusun leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── FITUR 1: WAAPI Ambient Background (Opera Gold) ──
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

    return () => {
      ambientAnim?.cancel();
    };
  }, [loading]);

  // ── FITUR 2: Elastic Bounce Podium & SplitText ──
  useEffect(() => {
    if (loading || data.length === 0) return;

    if (headerRef.current) headerRef.current.style.opacity = '0';
    const podiumNodes = Array.from(document.querySelectorAll('.anim-podium'));
    podiumNodes.forEach(el => ((el as HTMLElement).style.opacity = '0'));
    const rowNodes = Array.from(document.querySelectorAll('.anim-row'));
    rowNodes.forEach(el => ((el as HTMLElement).style.opacity = '0'));

    const timer = setTimeout(() => {
      const headerNode = headerRef.current;
      const titleNode = titleRef.current;

      if (!headerNode || !titleNode) return;

      let splitChars: any[] = [];
      if (!titleNode.dataset.split) {
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
          translateZ: [-50, 0],
          rotateX: [90, 0],
          delay: stagger(25)
        }, '<-=600');
      }

      // FITUR: Cinematic Bounce pada Podium
      if (podiumNodes.length > 0) {
        tl.add(podiumNodes, {
          opacity: [0, 1],
          scale: [0.8, 1],
          translateY: [80, 0], // Meluncur dari bawah
          ease: 'outElastic(1, 0.5)', // Efek pantulan pegas yang dramatis
          duration: 1400,
          delay: stagger(150, { start: 200 })
        }, '<-=400');
      }

      if (rowNodes.length > 0) {
        tl.add(rowNodes, {
          opacity: [0, 1],
          x: [-30, 0],
          delay: stagger(60)
        }, '<-=800');
      }

    }, 200);

    return () => clearTimeout(timer);
  }, [loading, data]);

  // ── FITUR 3: Tactile Spring ──
  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, {
      scale: state === 'down' ? 0.95 : 1,
      duration: 400,
      ease: spring({ bounce: 0.45 })
    });
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-[#051122]">
      <Loader2 className="animate-spin text-[#C5A059]" size={40} />
      <p className="font-black uppercase tracking-widest text-[#C5A059]/60 text-[10px] animate-pulse">
        Menghitung Power Score Wilayah...
      </p>
    </div>
  );

  return (
    <div className="p-8 space-y-10 bg-[#051122] min-h-screen text-left relative overflow-hidden font-sans">
      
      {/* WAAPI Background Khusus Admin */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-center items-center">
        <div 
          ref={bgAmbientRef} 
          className="w-[150vmax] h-[150vmax] rounded-full" 
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.04), transparent)' }} 
        />
      </div>

      <div className="relative z-10 space-y-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2 text-[#C5A059] font-black text-[10px] uppercase tracking-[0.3em] mb-2">
              <BrainCircuit size={14}/> Intelligence Dashboard
            </div>
            <div style={{ perspective: '800px' }} className="overflow-hidden pb-2">
              <h1 ref={titleRef} className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                Wijk <span className="text-[#C5A059]">Performance</span> Index
              </h1>
            </div>
            <p className="text-[#C5A059]/60 font-bold text-xs uppercase tracking-widest flex items-center gap-2 opacity-70 mt-2">
              <Activity size={14}/> Berdasarkan Real-Time Calibration RNHKBP SSOT
            </p>
          </div>
          <button 
            onMouseDown={(e) => handleSpringBtn(e, 'down')}
            onMouseUp={(e) => handleSpringBtn(e, 'up')}
            className="group flex items-center gap-3 px-8 py-4 bg-[#0a192f] border border-[#C5A059]/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#C5A059] hover:bg-[#C5A059] hover:text-[#051122] shadow-xl transition-all"
          >
            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> Export Executive PDF
          </button>
        </div>

        {/* Top 3 Podium Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-8">
          {data.slice(0, 3).map((wijk, idx) => {
            const isWinner = idx === 0;
            return (
              <div 
                key={wijk.id_wijk} 
                className={`anim-podium relative p-10 rounded-[3.5rem] border flex flex-col items-center text-center transition-colors duration-500 hover:scale-105 ${
                  isWinner 
                    ? 'bg-gradient-to-b from-[#C5A059] to-[#a38040] text-[#051122] border-[#C5A059] shadow-[0_0_40px_rgba(197,160,89,0.3)] z-10' 
                    : 'bg-[#0a192f]/60 backdrop-blur-xl border-[#C5A059]/20 shadow-2xl text-white'
                }`}
              >
                {isWinner && (
                  <div className="absolute -top-5 bg-[#051122] text-[#C5A059] border border-[#C5A059]/30 px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.3em] shadow-lg flex items-center gap-2">
                    <Activity size={12} className="animate-pulse" /> Supreme
                  </div>
                )}
                
                <div className="mb-6">
                  {idx === 0 && <Crown className="text-[#051122]" size={64} />}
                  {idx === 1 && <Medal className="text-slate-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" size={56} />}
                  {idx === 2 && <Medal className="text-amber-700 drop-shadow-[0_0_10px_rgba(180,83,9,0.2)]" size={56} />}
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 leading-tight">
                  {wijk.nama_wijk}
                </h3>
                
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-8 ${
                  isWinner ? 'bg-[#051122]/10 text-[#051122]' : 'bg-[#C5A059]/10 text-[#C5A059]'
                }`}>
                  Ranking #{idx + 1}
                </span>

                <div className={`grid grid-cols-2 gap-8 w-full pt-8 border-t ${isWinner ? 'border-[#051122]/10' : 'border-white/10'}`}>
                  <div className="space-y-1">
                    <p className={`text-[9px] font-black uppercase opacity-60 tracking-[0.2em] ${isWinner ? 'text-[#051122]' : 'text-[#C5A059]'}`}>Power Score</p>
                    <p className="text-3xl font-black tabular-nums">{wijk.total_poin_wilayah.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className={`text-[9px] font-black uppercase opacity-60 tracking-[0.2em] ${isWinner ? 'text-[#051122]' : 'text-[#C5A059]'}`}>Efficiency</p>
                    <p className={`text-3xl font-black tabular-nums ${isWinner ? 'text-[#051122]' : 'text-emerald-400'}`}>
                      {wijk.indeks_keaktifan}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Ranking Table */}
        <div className="bg-[#0a192f]/40 backdrop-blur-xl border border-[#C5A059]/20 rounded-[3rem] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em] border-b border-[#C5A059]/10">
                <tr>
                  <th className="px-10 py-8">Pos</th>
                  <th className="px-10 py-8">Identity / Wilayah</th>
                  <th className="px-10 py-8 text-center">Resources</th>
                  <th className="px-10 py-8 text-center">Participation</th>
                  <th className="px-10 py-8">Total Score</th>
                  <th className="px-10 py-8">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5A059]/5">
                {data.map((wijk, index) => (
                  <tr key={wijk.id_wijk} className="anim-row hover:bg-[#C5A059]/5 transition-colors group cursor-default">
                    <td className="px-10 py-7">
                      <span className={`size-12 rounded-[1rem] flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${
                        index < 3 ? 'bg-[#C5A059] text-[#051122] shadow-[0_0_15px_rgba(197,160,89,0.2)]' : 'bg-white/5 text-white/40 border border-white/5'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-left">
                      <div className="flex flex-col">
                        <span className="font-black text-white uppercase text-lg italic tracking-tight group-hover:text-[#C5A059] transition-colors">{wijk.nama_wijk}</span>
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Wijk Code: {wijk.kode_wijk || 'W-ID'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <div className="flex flex-col items-center bg-white/5 rounded-2xl py-3 px-4 group-hover:bg-[#C5A059]/10 border border-transparent transition-colors">
                        <span className="text-lg font-black text-white">{wijk.total_anggota}</span>
                        <span className="text-[9px] font-black uppercase text-[#C5A059]/60 tracking-tighter">JIWA</span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-center">
                       <div className="flex flex-col items-center bg-white/5 rounded-2xl py-3 px-4 group-hover:bg-[#C5A059]/10 border border-transparent transition-colors">
                        <span className="text-lg font-black text-white">{wijk.total_partisipasi}</span>
                        <span className="text-[9px] font-black uppercase text-[#C5A059]/60 tracking-tighter">EVENTS</span>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-2">
                        <div className="px-6 py-3 bg-[#051122] border border-[#C5A059]/30 text-[#C5A059] rounded-2xl text-base font-black shadow-inner italic group-hover:bg-[#C5A059] group-hover:text-[#051122] transition-colors">
                          {wijk.total_poin_wilayah.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl w-fit font-black text-[10px] uppercase tracking-widest ${
                        wijk.indeks_keaktifan < 0.5 ? 'bg-red-950/30 text-red-400 border border-red-900/30' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                      }`}>
                        {wijk.indeks_keaktifan < 0.5 ? <AlertTriangle size={14} className="animate-pulse"/> : <ChevronUp size={14}/>}
                        {wijk.indeks_keaktifan < 0.5 ? 'Low Engagement' : 'Optimal'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}