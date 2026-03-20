'use client';

import { useState, useEffect } from 'react';
import { getEngineSettings, saveEngineSettings } from '@/actions/settingsController';
import { animate, createTimeline, spring, stagger } from 'animejs';
import { Calculator, Save, RefreshCw, Activity } from 'lucide-react';
import { BlockMath } from 'react-katex';

export function EngineTab() {
  const [parameters, setParameters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getEngineSettings().then(data => { setParameters(data || []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (loading) return;
    const cards = Array.from(document.querySelectorAll('.anim-setting-card'));
    cards.forEach(el => ((el as HTMLElement).style.opacity = '0'));
    const timer = setTimeout(() => {
      createTimeline().add(cards, { opacity: [0, 1], y: [30, 0], scale: [0.95, 1], ease: 'outElastic(1, .8)', delay: stagger(80) });
    }, 100);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleUpdateLocal = (fieldName: string, key: string, value: number) => {
    setParameters(prev => prev.map(p => p.field_name === fieldName ? { ...p, [key]: value } : p));
  };

  const handleSaveEngine = async () => {
    setSaving(true);
    const res = await saveEngineSettings(parameters);
    if (!res.success) alert(res.error);
    else alert("Parameter mesin diperbarui!");
    setSaving(false);
  };

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.45 }) });
  };

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="anim-setting-card bg-[#C5A059] rounded-[3rem] p-10 lg:p-14 text-[#051122] shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden text-left border border-white/20">
        <div className="absolute right-[-40px] top-[-40px] opacity-10 pointer-events-none rotate-12">
          <Calculator size={350} />
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-5xl font-black uppercase leading-none tracking-tighter italic">Fellegi-Sunter<br/>Engine</h2>
            <p className="text-[#051122]/70 text-[10px] font-black leading-relaxed uppercase tracking-[0.2em] max-w-sm">
              Kalibrasi matematis tingkat kepercayaan integrasi data jemaat lintas periode kepengurusan.
            </p>
            <button 
              onClick={handleSaveEngine} disabled={saving} 
              onMouseDown={(e) => handleSpringBtn(e, 'down')} onMouseUp={(e) => handleSpringBtn(e, 'up')}
              className="flex items-center gap-3 px-8 py-4 bg-[#051122] text-[#C5A059] rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all hover:bg-[#051122]/90 active:scale-95 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />} Commit Engine Changes
            </button>
          </div>
          <div className="bg-[#051122]/10 backdrop-blur-md rounded-[2.5rem] p-10 border border-[#051122]/10 hidden md:block group hover:bg-[#051122]/15 transition-colors">
            <p className="text-[10px] font-black uppercase text-[#051122]/60 tracking-[0.3em] mb-6">Weight Formula Index ($w_a$)</p>
            <div className="text-3xl text-[#051122] drop-shadow-sm group-hover:scale-110 transition-transform duration-500">
              <BlockMath math={"w_a = \\ln\\left(\\frac{m}{u}\\right)"} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {parameters.map((param) => (
          <div key={param.field_name} className="anim-setting-card bg-[#0a192f]/40 backdrop-blur-xl border border-[#C5A059]/20 rounded-[2.5rem] p-8 shadow-xl hover:border-[#C5A059]/50 transition-all duration-500">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="lg:w-1/4 w-full">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{param.field_name.replace('_', ' ')}</h3>
                <p className="text-[10px] text-[#C5A059]/60 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                  <Activity size={12} /> Identity Match Field
                </p>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-12 w-full lg:border-l border-white/5 lg:pl-12">
                <SliderBlock label="Probability Match (m)" value={param.match_probability_m} color="gold" onChange={(v: number) => handleUpdateLocal(param.field_name, 'match_probability_m', v)} />
                <SliderBlock label="Probability Unmatch (u)" value={param.unmatch_probability_u} color="silver" onChange={(v: number) => handleUpdateLocal(param.field_name, 'unmatch_probability_u', v)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SliderBlock({ label, value, color, onChange }: any) {
  const isGold = color === 'gold';
  return (
    <div className="space-y-5 group">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{label}</label>
        <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border tabular-nums shadow-inner transition-all ${isGold ? 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20' : 'bg-white/5 text-white/60 border-white/10'}`}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      <input 
        type="range" min="0.01" max="0.99" step="0.01" value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))} 
        className={`w-full h-2.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#C5A059] hover:bg-white/10 transition-all shadow-inner`} 
      />
    </div>
  );
}