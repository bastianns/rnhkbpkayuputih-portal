'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, CheckCircle, Loader2, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export default function MemberSelfCheckIn() {
  const { id } = useParams(); // ID Kegiatan
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'processing'>('idle');
  const [msg, setMsg] = useState('');
  
  // STATE BARU: Untuk UU PDP
  const [hasConsented, setHasConsented] = useState(false);

  const handleSearch = async (val: string) => {
    setSearch(val);
    if (val.length < 3) return setResults([]);
    
    const { data } = await supabase
      .from('anggota')
      .select('id_anggota, nama_lengkap, wijk(nama_wijk)')
      .ilike('nama_lengkap', `%${val}%`)
      .limit(5);
    if (data) setResults(data);
  };

  const doCheckIn = async (memberId: string) => {
    if (!hasConsented) {
      setStatus('error');
      setMsg('Anda harus menyetujui pernyataan privasi untuk melakukan check-in.');
      return;
    }

    setStatus('processing');
    const { error } = await supabase.rpc('fn_portal_check_in_anggota', {
      p_id_kegiatan: id,
      p_id_anggota: memberId
    });

    if (error) {
      setStatus('error');
      setMsg(error.message);
    } else {
      setStatus('success');
      setSearch('');
      setResults([]);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-8 min-h-screen bg-[#f8fafc] text-left">
      {/* HEADER */}
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Self Check-In</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Pintu Masuk Digital RNHKBP</p>
      </div>

      {/* PRIVACY CONSENT CARD (WAJIB UU PDP) */}
      <div className={`p-6 rounded-[2rem] border-2 transition-all ${hasConsented ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-100'}`}>
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck className={hasConsented ? 'text-emerald-600' : 'text-blue-600'} size={20} />
          <h2 className={`font-black text-xs uppercase ${hasConsented ? 'text-emerald-700' : 'text-blue-700'}`}>Persetujuan Data Pribadi</h2>
        </div>
        <p className="text-[10px] leading-relaxed font-medium text-slate-600 mb-4 uppercase">
          Saya mengizinkan sistem mencatat kehadiran saya untuk keperluan statistik pelayanan sesuai dengan <span className="font-bold underline">UU No. 27 Tahun 2022 (PDP)</span>.
        </p>
        <label className="flex items-center gap-3 p-4 bg-white rounded-2xl cursor-pointer shadow-sm">
          <input 
            type="checkbox" 
            checked={hasConsented}
            onChange={(e) => setHasConsented(e.target.checked)}
            className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500 border-slate-200"
          />
          <span className="text-[10px] font-black text-slate-700 uppercase">Saya Setuju & Lanjutkan</span>
        </label>
      </div>

      {/* SEARCH INPUT - Hanya aktif jika sudah setuju */}
      <div className={`relative transition-opacity ${!hasConsented ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
        <input 
          type="text"
          placeholder="Masukkan Nama Lengkap..."
          className="w-full pl-16 pr-6 py-6 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border-none font-bold text-lg outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
          value={search}
          disabled={!hasConsented}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* STATUS MESSAGES */}
      {status === 'success' && (
        <div className="p-6 bg-emerald-500 text-white rounded-[2rem] flex items-center gap-4 animate-in zoom-in">
          <CheckCircle size={32} />
          <div>
            <p className="font-black uppercase text-sm leading-none">Check-In Berhasil!</p>
            <p className="text-[10px] font-bold opacity-80 uppercase mt-1">Data Anda telah masuk ke SSOT.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-100 italic">
          <AlertTriangle size={16} /> {msg}
        </div>
      )}

      {/* SEARCH RESULTS */}
      <div className="space-y-3">
        {results.map((m) => (
          <button 
            key={m.id_anggota}
            onClick={() => doCheckIn(m.id_anggota)}
            disabled={status === 'processing'}
            className="w-full flex items-center justify-between p-6 bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl hover:bg-blue-600 group transition-all text-left border border-slate-50"
          >
            <div>
              <p className="font-black text-slate-800 text-base uppercase leading-tight group-hover:text-white transition-colors">{m.nama_lengkap}</p>
              <p className="text-[10px] font-bold text-slate-400 group-hover:text-blue-100 uppercase tracking-widest mt-1">
                Wijk: {m.wijk?.nama_wijk || 'Tanpa Wijk'}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-blue-500 transition-colors">
              {status === 'processing' ? <Loader2 className="animate-spin text-blue-600 group-hover:text-white" /> : <CheckCircle className="text-slate-300 group-hover:text-white" />}
            </div>
          </button>
        ))}
      </div>

      {/* FOOTER INFO */}
      <div className="flex items-center gap-3 px-4 text-slate-400">
        <Info size={14} />
        <p className="text-[9px] font-bold uppercase tracking-widest">Gunakan nama lengkap sesuai database keanggotaan.</p>
      </div>
    </div>
  );
}