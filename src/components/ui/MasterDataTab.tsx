'use client';

import { useState, useEffect } from 'react';
import { getMasterDictionary, addMasterDictionary, removeMasterDictionary } from '@/actions/settingsController';
import { animate, createTimeline, spring, stagger } from 'animejs';
import { Plus, Trash2 } from 'lucide-react';

export function MasterDataTab({ activeTab }: { activeTab: string }) {
  const [masterData, setMasterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState(10);

  const loadData = async () => {
    setLoading(true);
    const data = await getMasterDictionary(activeTab);
    setMasterData(data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [activeTab]);

  useEffect(() => {
    if (loading) return;
    const cards = Array.from(document.querySelectorAll('.anim-setting-card'));
    const rows = Array.from(document.querySelectorAll('.anim-setting-row'));
    
    cards.forEach(el => ((el as HTMLElement).style.opacity = '0'));
    rows.forEach(el => ((el as HTMLElement).style.opacity = '0'));

    const timer = setTimeout(() => {
      const tl = createTimeline({ defaults: { duration: 1000 } });
      if (cards.length > 0) tl.add(cards, { opacity: [0, 1], y: [30, 0], scale: [0.95, 1], ease: 'outElastic(1, .8)', delay: stagger(80) });
      if (rows.length > 0) tl.add(rows, { opacity: [0, 1], x: [-20, 0], ease: 'outExpo', delay: stagger(30) }, cards.length > 0 ? '<-=600' : 0);
    }, 100);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleAdd = async () => {
    const res = await addMasterDictionary(activeTab, newName, newWeight);
    if (res.success) { setNewName(''); setNewWeight(10); loadData(); } 
    else alert(res.error);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus data ini?')) {
      const res = await removeMasterDictionary(activeTab, id);
      if (res.success) loadData(); else alert(res.error);
    }
  };

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.45 }) });
  };

  if (loading) return null;

  return (
    <div className="grid grid-cols-12 gap-8 text-left">
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
              onClick={handleAdd} disabled={!newName}
              onMouseDown={(e) => handleSpringBtn(e, 'down')} onMouseUp={(e) => handleSpringBtn(e, 'up')}
              className="w-full py-5 bg-[#C5A059] text-[#051122] rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-lg hover:bg-[#d4b46a] transition-all disabled:opacity-50 active:scale-95"
            >
              Save to Master Dictionary
            </button>
          </div>
        </div>
      </div>

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
                        onClick={() => handleDelete(id)} 
                        className="p-4 text-red-400/30 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all group/btn"
                        onMouseDown={(e) => handleSpringBtn(e as any, 'down')} onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
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
  );
}