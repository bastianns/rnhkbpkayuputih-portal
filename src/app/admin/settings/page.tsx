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
  PlayCircle // Icon baru untuk tombol inisialisasi
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'engine' | 'wijk' | 'kegiatan' | 'peran'>('engine');
  const [parameters, setParameters] = useState<any[]>([]);
  const [masterData, setMasterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State untuk form tambah data baru
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState(10);

  // --- LOGIKA FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'engine') {
      const { data } = await supabase.from('dedup_parameter').select('*').order('field_name', { ascending: true });
      if (data) setParameters(data);
    } else {
      const tableMap = { wijk: 'wijk', kegiatan: 'kategori_kegiatan', peran: 'katalog_peran' };
      // @ts-ignore
      const { data } = await supabase.from(tableMap[activeTab]).select('*').order('created_at', { ascending: false });
      if (data) setMasterData(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // --- LOGIKA ENGINE CALIBRATION (UPDATE) ---
  const handleUpdateLocal = (fieldName: string, key: string, value: number) => {
    setParameters(prev => prev.map(p => p.field_name === fieldName ? { ...p, [key]: value } : p));
  };

  const handleSaveEngine = async () => {
    setSaving(true);
    for (const param of parameters) {
      if (param.match_probability_m <= param.unmatch_probability_u) {
        alert(`Kesalahan pada ${param.field_name}: m harus > u.`);
        setSaving(false);
        return;
      }
      await supabase.from('dedup_parameter').update({
        match_probability_m: param.match_probability_m,
        unmatch_probability_u: param.unmatch_probability_u
      }).eq('field_name', param.field_name);
    }
    alert("Konfigurasi mesin berhasil diperbarui!");
    setSaving(false);
    fetchData();
  };

  // --- LOGIKA BARU: INISIALISASI ENGINE (INSERT) ---
  // Fitur ini memungkinkan kamu mengisi data awal dari frontend tanpa SQL
  const handleInitializeEngine = async () => {
    setSaving(true);
    
    // 1. BERSIHKAN DATA LAMA AGAR TIDAK DUPLIKAT/ERROR
    // Menghapus semua data di tabel dedup_parameter sebelum insert ulang
    const { error: deleteError } = await supabase.from('dedup_parameter').delete().neq('field_name', 'PLACEHOLDER_SAFETY');
    
    if (deleteError) {
        console.error("Gagal membersihkan tabel:", deleteError);
        alert("Gagal membersihkan data lama. Cek console.");
        setSaving(false);
        return;
    }

    // 2. DATA DEFAULT (SUDAH DIPERBAIKI: ADA ID_WIJK)
    const defaultParams = [
      { field_name: 'nama_lengkap', match_probability_m: 0.95, unmatch_probability_u: 0.05 },
      { field_name: 'tanggal_lahir', match_probability_m: 0.90, unmatch_probability_u: 0.10 },
      { field_name: 'email', match_probability_m: 0.99, unmatch_probability_u: 0.01 },
      { field_name: 'no_telp', match_probability_m: 0.90, unmatch_probability_u: 0.10 },
      // [FIX] INI YANG HILANG SEBELUMNYA:
      { field_name: 'id_wijk', match_probability_m: 0.60, unmatch_probability_u: 0.40 } 
    ];

    const { error } = await supabase.from('dedup_parameter').insert(defaultParams);
    
    if (error) {
      alert("Gagal inisialisasi: " + error.message);
    } else {
      alert("Mesin SSOT berhasil diinisialisasi ulang lengkap dengan parameter Wijk!");
      fetchData(); // Refresh otomatis agar slider muncul
    }
    setSaving(false);
  };

  // --- LOGIKA MASTER DATA (UUID Management) ---
  const handleAddMaster = async () => {
    if (!newName) return;
    let payload: any = {};
    let table = '';

    if (activeTab === 'wijk') {
      table = 'wijk';
      payload = { nama_wijk: newName };
    } else if (activeTab === 'kegiatan') {
      table = 'kategori_kegiatan';
      payload = { nama_kategori: newName, bobot_dasar: newWeight };
    } else if (activeTab === 'peran') {
      table = 'katalog_peran';
      payload = { nama_peran: newName, bobot_kontribusi: newWeight };
    }

    const { error } = await supabase.from(table).insert(payload);
    if (!error) {
      setNewName('');
      fetchData();
    }
  };

  const handleDeleteMaster = async (id: string) => {
    const idMap = { wijk: 'id_wijk', kegiatan: 'id_kategori_kegiatan', peran: 'id_peran' };
    const tableMap = { wijk: 'wijk', kegiatan: 'kategori_kegiatan', peran: 'katalog_peran' };
    
    if (confirm('Hapus data referensi ini? Jemaat yang terhubung mungkin akan kehilangan relasi data.')) {
      // @ts-ignore
      await supabase.from(tableMap[activeTab]).delete().eq(idMap[activeTab], id);
      fetchData();
    }
  };

  if (loading && parameters.length === 0 && masterData.length === 0) {
    return <div className="p-10 text-center font-black uppercase text-slate-400 tracking-widest">Sinkronisasi Pusat Data...</div>;
  }

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 font-sans text-left">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-[#0e141b] tracking-tight uppercase">System Configuration</h1>
          <p className="text-[#4e7397] text-sm font-bold uppercase tracking-widest">Manajemen Kamus Data & Kalibrasi Mesin SSOT</p>
        </div>
      </div>

      {/* Custom Tabs Selector */}
      <div className="flex flex-wrap gap-3 p-1.5 bg-slate-100 rounded-[1.5rem] w-fit">
        <TabButton active={activeTab === 'engine'} onClick={() => setActiveTab('engine')} icon={<Sliders size={16}/>} label="Engine Calibration" />
        <TabButton active={activeTab === 'wijk'} onClick={() => setActiveTab('wijk')} icon={<Map size={16}/>} label="Daftar Wijk" />
        <TabButton active={activeTab === 'kegiatan'} onClick={() => setActiveTab('kegiatan')} icon={<Tags size={16}/>} label="Kategori Kegiatan" />
        <TabButton active={activeTab === 'peran'} onClick={() => setActiveTab('peran')} icon={<UserPlus size={16}/>} label="Katalog Peran" />
      </div>

      {activeTab === 'engine' ? (
        <div className="space-y-10">
          {/* Hero Section: Mathematical Logic */}
          <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none"><Calculator size={240} /></div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 text-left">
                <h2 className="text-3xl font-black leading-tight uppercase">Pembobotan Fellegi-Sunter</h2>
                <p className="text-blue-50 text-base leading-relaxed opacity-90">
                  Kalibrasi probabilitas untuk menentukan ambang batas kepercayaan sistem dalam mendeteksi duplikasi identitas secara otomatis.
                </p>
                <div className="flex gap-4">
                    <button onClick={handleSaveEngine} disabled={saving || parameters.length === 0} className="flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-amber-400 hover:text-white transition-all disabled:opacity-50">
                    {saving ? <RefreshCw className="animate-spin" /> : <Save />} Simpan Kalibrasi
                    </button>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 space-y-4 text-left">
                <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest">Rumus Agreement Weight ($w_a$)</p>
                <div className="text-2xl text-white font-mono"><BlockMath math={"\\ln\\left(\\frac{m}{u}\\right)"} /></div>
              </div>
            </div>
          </div>

          {/* Configuration Sliders OR Empty State Initializer */}
          {parameters.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {parameters.map((param) => (
                  <div key={param.field_name} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm group hover:border-blue-300 transition-all text-left">
                    <div className="flex flex-col lg:flex-row gap-12 items-center">
                      <div className="lg:w-1/4 space-y-2">
                        <h3 className="text-xl font-black text-[#0e141b] uppercase tracking-tight">{param.field_name.replace('_', ' ')}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Field Identity Integration</p>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-10 w-full">
                        <SliderBlock label="Match Probability (m)" value={param.match_probability_m} color="blue" onChange={(v: number) => handleUpdateLocal(param.field_name, 'match_probability_m', v)} />
                        <SliderBlock label="Unmatch Probability (u)" value={param.unmatch_probability_u} color="amber" onChange={(v: number) => handleUpdateLocal(param.field_name, 'unmatch_probability_u', v)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          ) : (
              // TAMPILAN JIKA DATABASE KOSONG (FITUR BARU)
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-[2rem] p-12 text-center space-y-6">
                  <div className="mx-auto bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center text-slate-500">
                      <Sliders size={32} />
                  </div>
                  <div className="space-y-2">
                      <h3 className="text-xl font-black text-[#0e141b] uppercase">Parameter Mesin Belum Dikonfigurasi</h3>
                      <p className="text-sm text-slate-500 max-w-md mx-auto">Database parameter kosong. Klik tombol di bawah untuk menginisialisasi parameter Fellegi-Sunter dengan nilai standar (default).</p>
                  </div>
                  <button onClick={handleInitializeEngine} disabled={saving} className="mx-auto flex items-center gap-2 px-8 py-4 bg-[#0e141b] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg">
                    {saving ? <RefreshCw className="animate-spin" size={16}/> : <PlayCircle size={16}/>} Inisialisasi Default
                  </button>
              </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-8">
          {/* Form Tambah Master Data */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 sticky top-32 text-left">
              <h3 className="font-black text-sm uppercase mb-6 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" /> Tambah {activeTab}
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Entitas</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contoh: Wijk 7 / Ibadah" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20" />
                </div>
                {(activeTab === 'peran' || activeTab === 'kegiatan') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bobot Poin</label>
                    <input type="number" value={newWeight} onChange={(e) => setNewWeight(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" />
                  </div>
                )}
                <button onClick={handleAddMaster} className="w-full py-4 bg-[#0e141b] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">Simpan Record</button>
              </div>
            </div>
          </div>

          {/* List Master Data (Dictionary Table) */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">UUID Sistem</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Nama Label</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {masterData.map((item) => (
                    <tr key={item.id_wijk || item.id_kategori_kegiatan || item.id_peran} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-[9px] text-slate-300 uppercase tracking-tighter">
                        {item.id_wijk || item.id_kategori_kegiatan || item.id_peran}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-[#0e141b] uppercase">
                          {item.nama_wijk || item.nama_kategori || item.nama_peran}
                        </p>
                        {item.bobot_kontribusi && <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Weight: {item.bobot_kontribusi} pts</p>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDeleteMaster(item.id_wijk || item.id_kategori_kegiatan || item.id_peran)} className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={18} />
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

// --- SUB-COMPONENTS ---
function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-blue-600'}`}>
      {icon} {label}
    </button>
  );
}

function SliderBlock({ label, value, color, onChange }: any) {
  const accentClass = color === 'blue' ? 'accent-blue-600' : 'accent-amber-500';
  const textClass = color === 'blue' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50';
  
  return (
    <div className="space-y-4 text-left">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <span className={`text-xs font-black px-3 py-1 rounded-xl ${textClass}`}>{(value * 100).toFixed(1)}%</span>
      </div>
      <input type="range" min="0.01" max="0.99" step="0.01" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className={`w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer ${accentClass}`} />
    </div>
  );
}