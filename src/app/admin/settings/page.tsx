'use client';

import { useState, useEffect } from 'react';
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
  PlayCircle,
  BrainCircuit,
  Activity
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'engine' | 'wijk' | 'kegiatan' | 'peran' | 'keahlian' | 'kesibukan'>('engine');
  const [parameters, setParameters] = useState<any[]>([]);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState(10);

  // --- LOGIKA FETCH DATA (FIXED FOR DYNAMIC ORDERING) ---
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

      // FIX: Mapping kolom pengurutan agar tidak terjadi error 400
      const orderColumnMap = {
        wijk: 'nama_wijk',
        kegiatan: 'nama_kategori',
        peran: 'nama_peran',
        keahlian: 'nama_keahlian', // Keahlian tidak punya created_at
        kesibukan: 'nama_kategori'
      };
      
      // @ts-ignore
      const targetTable = tableMap[activeTab];
      // @ts-ignore
      const targetOrder = orderColumnMap[activeTab] || 'created_at';

      const { data, error } = await supabase
        .from(targetTable)
        .select('*')
        .order(targetOrder, { ascending: true }); // A-Z lebih rapi untuk settings

      if (error) {
        console.error(`Gagal fetch ${activeTab}:`, error);
      }
      if (data) setMasterData(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // --- LOGIKA AUDIT LOG ---
  const logActivity = async (action: string, entity: string, entityId: string | null, newData: any = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_log').insert({
        actor_id: user?.id || null,
        action: action,
        entity: entity,
        entity_id: entityId,
        new_data: newData,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error("Audit log error:", err);
    }
  };

  // --- LOGIKA ENGINE (FELLEGI-SUNTER) ---
  const handleUpdateLocal = (fieldName: string, key: string, value: number) => {
    setParameters(prev => prev.map(p => p.field_name === fieldName ? { ...p, [key]: value } : p));
  };

  const handleSaveEngine = async () => {
    setSaving(true);
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

    await logActivity('UPDATE_ENGINE_PARAMS', 'dedup_parameter', null, { updated: parameters });
    alert("Parameter mesin diperbarui!");
    setSaving(false);
    fetchData();
  };

  const handleInitializeEngine = async () => {
    setSaving(true);
    await supabase.from('dedup_parameter').delete().neq('field_name', 'SAFETY_LOCK');

    const defaultParams = [
      { field_name: 'nama_lengkap', match_probability_m: 0.95, unmatch_probability_u: 0.05 },
      { field_name: 'tanggal_lahir', match_probability_m: 0.90, unmatch_probability_u: 0.10 },
      { field_name: 'email', match_probability_m: 0.99, unmatch_probability_u: 0.01 },
      { field_name: 'no_telp', match_probability_m: 0.90, unmatch_probability_u: 0.10 },
      { field_name: 'id_wijk', match_probability_m: 0.60, unmatch_probability_u: 0.40 } 
    ];

    const { error } = await supabase.from('dedup_parameter').insert(defaultParams);
    if (!error) {
      await logActivity('RESET_ENGINE', 'dedup_parameter', null, { status: 'Reset' });
      fetchData(); 
    }
    setSaving(false);
  };

  // --- LOGIKA MASTER DATA ---
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

    const { data, error } = await supabase.from(table).insert(payload).select().single();
    
    if (!error && data) {
      const newId = data.id_wijk || data.id_kategori_kegiatan || data.id_peran || data.id_keahlian || data.id_kategori_kesibukan;
      await logActivity('INSERT_MASTER', table, newId, payload);
      setNewName('');
      setNewWeight(10);
      fetchData();
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
      if (!error) {
        // @ts-ignore
        await logActivity('DELETE_MASTER', tableMap[activeTab], id, { id });
        fetchData();
      } else {
        alert("Data gagal dihapus (mungkin masih digunakan).");
      }
    }
  };

  if (loading && parameters.length === 0 && masterData.length === 0) {
    return <div className="p-10 text-center font-black uppercase text-slate-400 tracking-widest">Sinkronisasi Parameter...</div>;
  }

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 font-sans text-left">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-[#0e141b] tracking-tight uppercase">System Settings</h1>
        <p className="text-[#4e7397] text-sm font-bold uppercase tracking-widest italic">Pusat Kalibrasi Identitas & Kamus Data RNHKBP Kayu Putih</p>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-3xl w-fit">
        <TabButton active={activeTab === 'engine'} onClick={() => setActiveTab('engine')} icon={<Sliders size={16}/>} label="Calibration" />
        <TabButton active={activeTab === 'wijk'} onClick={() => setActiveTab('wijk')} icon={<Map size={16}/>} label="Wijk" />
        <TabButton active={activeTab === 'kegiatan'} onClick={() => setActiveTab('kegiatan')} icon={<Tags size={16}/>} label="Kegiatan" />
        <TabButton active={activeTab === 'peran'} onClick={() => setActiveTab('peran')} icon={<UserPlus size={16}/>} label="Peran" />
        <TabButton active={activeTab === 'keahlian'} onClick={() => setActiveTab('keahlian')} icon={<BrainCircuit size={16}/>} label="Keahlian" />
        <TabButton active={activeTab === 'kesibukan'} onClick={() => setActiveTab('kesibukan')} icon={<Activity size={16}/>} label="Kesibukan" />
      </div>

      {activeTab === 'engine' ? (
        <div className="space-y-10">
          <div className="bg-[#197fe6] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden text-left">
            <div className="absolute right-[-40px] top-[-40px] opacity-10 pointer-events-none rotate-12"><Calculator size={300} /></div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl font-black uppercase leading-none tracking-tighter">Fellegi-Sunter<br/>Engine</h2>
                <p className="text-blue-100 text-sm font-bold leading-relaxed opacity-90 uppercase tracking-wide">
                  Kalibrasi tingkat kepercayaan integrasi data jemaat lintas periode.
                </p>
                <button onClick={handleSaveEngine} disabled={saving} className="flex items-center gap-3 px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                  {saving ? <RefreshCw className="animate-spin" /> : <Save />} Update Configuration
                </button>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/20">
                <p className="text-[10px] font-black uppercase text-blue-200 tracking-[0.3em] mb-4">Agreement Weight Formula ($w_a$)</p>
                <div className="text-3xl text-white"><BlockMath math={"w_a = \\ln\\left(\\frac{m}{u}\\right)"} /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {parameters.map((param) => (
              <div key={param.field_name} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group hover:border-blue-300 transition-all text-left">
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                  <div className="lg:w-1/4">
                    <h3 className="text-xl font-black text-[#0e141b] uppercase tracking-tighter">{param.field_name.replace('_', ' ')}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Identity Match Field</p>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-10 w-full">
                    <SliderBlock label="Match Prob (m)" value={param.match_probability_m} color="blue" onChange={(v: number) => handleUpdateLocal(param.field_name, 'match_probability_m', v)} />
                    <SliderBlock label="Unmatch Prob (u)" value={param.unmatch_probability_u} color="amber" onChange={(v: number) => handleUpdateLocal(param.field_name, 'unmatch_probability_u', v)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-8 text-left">
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-32">
              <h3 className="font-black text-xs uppercase tracking-widest mb-8 text-[#197fe6]">Tambah {activeTab} Baru</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Label</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Misal: IT Support" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" />
                </div>
                {['peran', 'kegiatan', 'kesibukan', 'keahlian'].includes(activeTab) && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bobot Strategis (Poin)</label>
                    <input type="number" value={newWeight} onChange={(e) => setNewWeight(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none" />
                  </div>
                )}
                <button onClick={handleAddMaster} className="w-full py-5 bg-[#0e141b] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-lg active:scale-95">Simpan Data</button>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Master Identity</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {masterData.map((item) => (
                    <tr key={item.id_wijk || item.id_kategori_kegiatan || item.id_peran || item.id_keahlian || item.id_kategori_kesibukan} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-800 uppercase italic">
                          {item.nama_wijk || item.nama_kategori || item.nama_peran || item.nama_keahlian}
                        </p>
                        {(item.bobot_kontribusi || item.bobot_dasar || item.bobot_kesibukan || item.bobot_keahlian) && (
                          <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-tighter">
                            Weight: {item.bobot_kontribusi || item.bobot_dasar || item.bobot_kesibukan || item.bobot_keahlian} pts
                          </span>
                        )}
                        <p className="text-[8px] font-mono text-slate-300 mt-1 uppercase">ID: {item.id_wijk || item.id_kategori_kegiatan || item.id_peran || item.id_keahlian || item.id_kategori_kesibukan}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => handleDeleteMaster(item.id_wijk || item.id_kategori_kegiatan || item.id_peran || item.id_keahlian || item.id_kategori_kesibukan)} className="p-3 text-red-200 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${active ? 'bg-white text-[#197fe6] shadow-sm' : 'text-slate-400 hover:text-blue-600'}`}>
      {icon} {label}
    </button>
  );
}

function SliderBlock({ label, value, color, onChange }: any) {
  const accent = color === 'blue' ? 'accent-blue-600' : 'accent-amber-500';
  const text = color === 'blue' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50';
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</label>
        <span className={`text-xs font-black px-3 py-1 rounded-xl ${text}`}>{(value * 100).toFixed(1)}%</span>
      </div>
      <input type="range" min="0.01" max="0.99" step="0.01" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className={`w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer ${accent}`} />
    </div>
  );
}