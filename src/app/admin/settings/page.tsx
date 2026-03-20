'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Map, Tags, UserPlus, BrainCircuit, Activity, Sliders } from 'lucide-react';
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';
import 'katex/dist/katex.min.css';

// Import Komponen UI Spesifik
import { EngineTab } from '@/components/ui/EngineTab';
import { MasterDataTab } from '@/components/ui/MasterDataTab';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('engine');

  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // ── FITUR 1: WAAPI Ambient Background ──
  useEffect(() => {
    if (!bgAmbientRef.current) return;
    const ambientAnim = waapi.animate(bgAmbientRef.current, {
      rotate: ['0deg', '360deg'],
      opacity: [0.02, 0.05, 0.02],
      scale: [1, 1.15, 1],
      duration: 35000,
      iterations: Infinity,
      easing: 'linear'
    });
    return () => { ambientAnim?.cancel(); };
  }, []);

  // ── FITUR 2: Header Entry & SplitText ──
  useEffect(() => {
    const timer = setTimeout(() => {
      const headerNode = headerRef.current;
      const titleNode = titleRef.current;
      if (!headerNode || !titleNode) return;

      let splitChars: any[] = [];
      if (!titleNode.dataset.split) {
        titleNode.innerText = "System Settings"; 
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
          opacity: [0, 1], y: [20, 0], translateZ: [-50, 0], rotateX: [90, 0], delay: stagger(30)
        }, '<-=600');
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-8 space-y-10 bg-[#051122] min-h-screen font-sans text-left relative overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-start items-center">
        <div ref={bgAmbientRef} className="w-[150vmax] h-[150vmax] -translate-x-1/2 rounded-full opacity-20" 
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.05), transparent)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div ref={headerRef} className="space-y-2" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2 text-[#C5A059] font-black text-[10px] uppercase tracking-[0.3em]">
            <ShieldCheck size={14} className="animate-pulse" /> Security & Logic
          </div>
          <div style={{ perspective: '1000px' }} className="overflow-hidden pb-1 text-left">
            <h1 ref={titleRef} className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
              System Settings
            </h1>
          </div>
          <p className="text-[#C5A059]/60 text-xs font-bold uppercase tracking-widest italic mt-1">
            Pusat Kalibrasi Identitas & Kamus Data RNHKBP SSOT
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-2 bg-[#0a192f]/60 backdrop-blur-xl border border-[#C5A059]/20 shadow-2xl rounded-full w-fit">
          <TabButton active={activeTab === 'engine'} onClick={() => setActiveTab('engine')} icon={<Sliders size={14}/>} label="Calibration" />
          <TabButton active={activeTab === 'wijk'} onClick={() => setActiveTab('wijk')} icon={<Map size={14}/>} label="Wijk" />
          <TabButton active={activeTab === 'kegiatan'} onClick={() => setActiveTab('kegiatan')} icon={<Tags size={14}/>} label="Kegiatan" />
          <TabButton active={activeTab === 'peran'} onClick={() => setActiveTab('peran')} icon={<UserPlus size={14}/>} label="Peran" />
          <TabButton active={activeTab === 'keahlian'} onClick={() => setActiveTab('keahlian')} icon={<BrainCircuit size={14}/>} label="Keahlian" />
          <TabButton active={activeTab === 'kesibukan'} onClick={() => setActiveTab('kesibukan')} icon={<Activity size={14}/>} label="Kesibukan" />
        </div>

        {/* ── Komponen UI Terpisah Di-Render Di Sini ── */}
        <div key={activeTab} className="relative">
          {activeTab === 'engine' ? (
            <EngineTab />
          ) : (
            <MasterDataTab activeTab={activeTab} />
          )}
        </div>

      </div>
    </div>
  );
}

// ── Micro Component untuk Tombol Tab ──
function TabButton({ active, onClick, icon, label }: any) {
  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.4 }) });
  };
  return (
    <button 
      onClick={onClick} onMouseDown={(e) => handleSpringBtn(e, 'down')} onMouseUp={(e) => handleSpringBtn(e, 'up')}
      className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-black text-[9px] uppercase tracking-[0.2em] transition-all ${
        active ? 'bg-[#C5A059] text-[#051122] shadow-[0_10px_20px_rgba(197,160,89,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon} {label}
    </button>
  );
}