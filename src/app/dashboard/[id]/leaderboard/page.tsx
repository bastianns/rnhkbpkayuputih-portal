'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchComprehensiveLeaderboard } from '@/actions/leaderboardController';
import { BrainCircuit, Activity, ChevronLeft, Loader2 } from 'lucide-react';

// Import Komponen UI Spesifik
import { PodiumSection } from '@/components/ui/PodiumSection';
import { RankingTable } from '@/components/ui/RankingTable';

// ── Anime.js V4 Imports ──
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';

export default function MemberWijkLeaderboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
          opacity: [0, 1], translateZ: [-50, 0], rotateX: [90, 0], delay: stagger(25)
        }, '<-=600');
      }

      if (podiumNodes.length > 0) {
        tl.add(podiumNodes, {
          opacity: [0, 1], scale: [0.8, 1], translateY: [80, 0], 
          ease: 'outElastic(1, 0.5)', duration: 1400, delay: stagger(150, { start: 200 })
        }, '<-=400');
      }

      if (rowNodes.length > 0) {
        tl.add(rowNodes, {
          opacity: [0, 1], x: [-30, 0], delay: stagger(60)
        }, '<-=800');
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [loading, data]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-[#0a1628]">
      <Loader2 className="animate-spin text-[#d4af37]" size={40} />
      <p className="font-black uppercase tracking-widest text-[#d4af37]/60 text-[10px] animate-pulse">
        Menghitung Power Score Wilayah...
      </p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-10 bg-[#0a1628] min-h-screen text-left relative overflow-hidden font-sans text-white">
      
      {/* Background Decorative */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-center items-center">
        <div ref={bgAmbientRef} className="w-[150vmax] h-[150vmax] rounded-full" 
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(212, 175, 55, 0.04), transparent)' }} />
      </div>

      <div className="relative z-10 space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div ref={headerRef} className="flex flex-col gap-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#d4af37]/60 hover:text-[#d4af37] transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <ChevronLeft size={16} /> Kembali ke Dashboard
          </button>
          
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2 text-[#d4af37] font-black text-[10px] uppercase tracking-[0.3em] mb-2">
              <BrainCircuit size={14}/> Community Intelligence
            </div>
            <div style={{ perspective: '800px' }} className="overflow-hidden pb-2">
              <h1 ref={titleRef} className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                Wijk <span className="text-[#d4af37]">Standing</span> Index
              </h1>
            </div>
            <p className="text-[#d4af37]/60 font-bold text-xs uppercase tracking-widest flex items-center gap-2 opacity-70 mt-2">
              <Activity size={14}/> Peringkat Keaktifan Wilayah RNHKBP Kayu Putih
            </p>
          </div>
        </div>

        {/* Podium Section */}
        <PodiumSection topThreeData={data.slice(0, 3)} />
        
        {/* Ranking Table */}
        <div className="pt-4">
          <RankingTable allData={data} />
        </div>

      </div>
      
      <footer className="relative z-10 mt-12 text-center opacity-30 pb-8">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#d4af37]">© 2026 RNHKBP KAYU PUTIH</p>
      </footer>
    </div>
  );
}
