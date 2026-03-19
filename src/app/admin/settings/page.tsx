'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { 
  Save, 
  RefreshCw, 
  Sliders, 
  Calculator,
  ShieldCheck,
  Map,
  Tags,
  UserPlus,
  Plus,
  Trash2,
  BrainCircuit,
  Activity,
  ChevronRight
} from 'lucide-react';

// ── Anime.js V4 Imports ──
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'engine' | 'wijk' | 'kegiatan' | 'peran' | 'keahlian' | 'kesibukan'>('engine');
  const [parameters, setParameters] = useState<any[]>([]);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState(10);

  // ── Refs untuk Animasi Premium ──
  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // --- LOGIKA FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'engine') {
      const { data } = await supabase.from('dedup_parameter').select('*').order('field_name', { ascending: true });
      if (data) setParameters(data);
    } else {
      const tableMap = { 
        wijk: 'wijk', 
        kegiatan: 'kategori_kegiatan', 
        peran: 'katalog_peran',
        keahlian: 'ref_keahlian',
        kesibukan: 'ref_kategori_kesibukan'
      };

      const orderColumnMap = {
        wijk: 'nama_wijk',
        kegiatan: 'nama_kategori',
        peran: 'nama_peran',
        keahlian: 'nama_keahlian',
        kesibukan: 'nama_kategori'
      };
      
      // @ts-ignore
      const targetTable = tableMap[activeTab];
      // @ts-ignore
      const targetOrder = orderColumnMap[activeTab] || 'created_at';

      const { data, error } = await supabase
        .from(targetTable)
        .select('*')
        .order(targetOrder, { ascending: true }); 

      if (error) console.error(`Gagal fetch ${activeTab}:`, error);
      if (data) setMasterData(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // ── FITUR 1: WAAPI Ambient Background (Opera Gold) ──
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
          opacity: [0, 1],
          y: [20, 0],
          translateZ: [-50, 0],
          rotateX: [90, 0],
          delay: stagger(30)
        }, '<-=600');
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // ── FITUR 3: Elastic Tab Content Transition ──
  useEffect(() => {
    if (loading) return;

    const cards = Array.from(document.querySelectorAll('.anim-setting-card'));
    const rows = Array.from(document.querySelectorAll('.anim-setting-row'));
    
    // Reset state sebelum animasi
    cards.forEach(el => ((el as HTMLElement).style.opacity = '0'));
    rows.forEach(el => ((el as HTMLElement).style.opacity = '0'));

    const timer = setTimeout(() => {
      const tl = createTimeline({ defaults: { duration: 1000 } });
      
      if (cards.length > 0) {
        tl.add(cards, { 
          opacity: [0, 1], 
          y: [30, 0], 
          scale: [0.95, 1],
          ease: 'outElastic(1, .8)', // Pantulan halus pada kartu
          delay: stagger(80) 
        });
      }
      
      if (rows.length > 0) {
        tl.add(rows, { 
          opacity: [0, 1], 
          x: [-20, 0], 
          ease: 'outExpo',
          delay: stagger(30) 
        }, cards.length > 0 ? '<-=600' : 0);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [activeTab, loading]);

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.45 }) });
  };

  // --- LOGIKA ENGINE ---
  const handleUpdateLocal = (fieldName: string, key: string, value: number) => {
    setParameters(prev => prev.map(p => p.field_name === fieldName ? { ...p, [key]: value } : p));
  };

  const handleSaveEngine = async () => {
    setSaving(true);
    try {
        for (const param of parameters) {
            if (param.match_probability_m <= param.unmatch_probability_u) {
              alert(`Kesalahan ${param.field_name}: m must be > u.`);
              setSaving(false);
              return;
            }
            await supabase.from('dedup_parameter').update({
              match_probability_m: param.match_probability_m,
              unmatch_probability_u: param.unmatch_probability_u
            }).eq('field_name', param.field_name);
          }
          alert("Parameter mesin diperbarui!");
          fetchData();
    } finally {
        setSaving(false);
    }
  };

  const handleAddMaster = async () => {
    if (!newName) return;
    let payload: any = {};
    let table = '';
    switch(activeTab) {
      case 'wijk': table = 'wijk'; payload = { nama_wijk: newName }; break;
      case 'kegiatan': table = 'kategori_kegiatan'; payload = { nama_kategori: newName, bobot_dasar: newWeight }; break;
      case 'peran': table = 'katalog_peran'; payload = { nama_peran: newName, bobot_kontribusi: newWeight }; break;
      case 'keahlian': table = 'ref_keahlian'; payload = { nama_keahlian: newName, bobot_keahlian: newWeight }; break;
      case 'kesibukan': table = 'ref_kategori_kesibukan'; payload = { nama_kategori: newName, bobot_kesibukan: newWeight }; break;
    }
    const { error } = await supabase.from(table).insert(payload);
    if (!error) {
      setNewName(''); setNewWeight(10); fetchData();
    } else {
      alert("Gagal menambah data referensi.");
    }
  };

  const handleDeleteMaster = async (id: string) => {
    const tableMap = { wijk: 'wijk', kegiatan: 'kategori_kegiatan', peran: 'katalog_peran', keahlian: 'ref_keahlian', kesibukan: 'ref_kategori_kesibukan' };
    const idMap = { wijk: 'id_wijk', kegiatan: 'id_kategori_kegiatan', peran: 'id_peran', keahlian: 'id_keahlian', kesibukan: 'id_kategori_kesibukan' };
    if (confirm('Hapus data ini?')) {
      // @ts-ignore
      const { error } = await supabase.from(tableMap[activeTab]).delete().eq(idMap[activeTab], id);
      if (!error) fetchData();
      else alert("Data gagal dihapus (mungkin sedang digunakan).");
    }
  };

  return (
    <div className="p-8 space-y-10 bg-[#051122] min-h-screen font-sans text-left relative overflow-hidden">
      
      {/* WAAPI Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-start items-center">
        <div 
          ref={bgAmbientRef} 
          className="w-[150vmax] h-[150vmax] -translate-x-1/2 rounded-full opacity-20" 
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.05), transparent)' }} 
        />
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

        {/* Content Wrapper */}
        <div key={activeTab} className="relative">
          {activeTab === 'engine' ? (
            <div className="space-y-8">
              {/* Engine Card */}
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
                      onClick={handleSaveEngine} 
                      disabled={saving} 
                      onMouseDown={(e) => handleSpringBtn(e, 'down')}
                      onMouseUp={(e) => handleSpringBtn(e, 'up')}
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

              {/* Engine Parameters */}
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
          ) : (
            <div className="grid grid-cols-12 gap-8 text-left">
              {/* Form Tambah */}
              <div className="col-span-12 lg:col-span-4">
                <div className="anim-setting-card bg-[#0a192f]/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-[#C5A059]/20 shadow-2xl sticky top-8 group hover:border-[#C5A059]/40 transition-colors">
                  <h3 className="font-black text-[10px] uppercase tracking-[0.3em] mb-10 text-[#C5A059] flex items-center gap-3">
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" /> New {activeTab} Master Entry
                  </h3>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Label Identity Name</label>
                      <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Entry name..." className="w-full p-4 bg-white/5 border border-white/10 focus:border-[#C5A059] rounded-2xl text-sm font-bold text-white outline-none transition-all shadow-inner" />
                    </div>
                    {['peran', 'kegiatan', 'kesibukan', 'keahlian'].includes(activeTab) && (
                      <div className="space-y-3">
                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Strategic Calibration (Points)</label>
                        <input type="number" value={newWeight} onChange={(e) => setNewWeight(parseInt(e.target.value))} className="w-full p-4 bg-white/5 border border-white/10 focus:border-[#C5A059] rounded-2xl text-sm font-bold text-white outline-none transition-all shadow-inner" />
                      </div>
                    )}
                    <button 
                      onClick={handleAddMaster} 
                      disabled={!newName}
                      onMouseDown={(e) => handleSpringBtn(e, 'down')}
                      onMouseUp={(e) => handleSpringBtn(e, 'up')}
                      className="w-full py-5 bg-[#C5A059] text-[#051122] rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-lg hover:bg-[#d4b46a] transition-all disabled:opacity-50 active:scale-95"
                    >
                      Save to Master Dictionary
                    </button>
                  </div>
                </div>
              </div>

              {/* List Table */}
              <div className="col-span-12 lg:col-span-8">
                <div className="anim-setting-card bg-[#0a192f]/40 backdrop-blur-xl rounded-[2.5rem] border border-[#C5A059]/20 shadow-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-[#C5A059]/10">
                      <tr>
                        <th className="px-10 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em]">Master Identity</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase text-[#C5A059]/60 tracking-[0.2em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {masterData.map((item) => {
                        const id = item.id_wijk || item.id_kategori_kegiatan || item.id_peran || item.id_keahlian || item.id_kategori_kesibukan;
                        const nama = item.nama_wijk || item.nama_kategori || item.nama_peran || item.nama_keahlian;
                        const weight = item.bobot_kontribusi || item.bobot_dasar || item.bobot_kesibukan || item.bobot_keahlian;
                        return (
                          <tr key={id} className="anim-setting-row hover:bg-[#C5A059]/5 transition-colors group cursor-default">
                            <td className="px-10 py-7">
                              <p className="text-base font-black text-white uppercase italic tracking-wider group-hover:text-[#C5A059] transition-colors">{nama}</p>
                              <div className="flex items-center gap-4 mt-3">
                                {weight && (
                                    <span className="text-[8px] font-black text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-3 py-1 rounded uppercase tracking-tighter">
                                    Base Weight: {weight} pts
                                    </span>
                                )}
                                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">UID: {id.split('-')[0]}...</span>
                              </div>
                            </td>
                            <td className="px-10 py-7 text-right">
                              <button 
                                onClick={() => handleDeleteMaster(id)} 
                                className="p-4 text-red-400/30 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all group/btn"
                                onMouseDown={(e) => handleSpringBtn(e as any, 'down')}
                                onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
                              >
                                <Trash2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.4 }) });
  };
  return (
    <button 
      onClick={onClick} 
      onMouseDown={(e) => handleSpringBtn(e, 'down')}
      onMouseUp={(e) => handleSpringBtn(e, 'up')}
      className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full font-black text-[9px] uppercase tracking-[0.2em] transition-all ${
        active ? 'bg-[#C5A059] text-[#051122] shadow-[0_10px_20px_rgba(197,160,89,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon} {label}
    </button>
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
        type="range" min="0.01" max="0.99" step="0.01" 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))} 
        className={`w-full h-2.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#C5A059] hover:bg-white/10 transition-all shadow-inner`} 
      />
    </div>
  );
}