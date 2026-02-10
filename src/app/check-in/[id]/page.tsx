'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function MemberSelfCheckIn() {
  const { id } = useParams();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleSearch = async (val: string) => {
    setSearch(val);
    if (val.length < 3) return setResults([]);
    
    // Cari di master anggota
    const { data } = await supabase
      .from('anggota')
      .select('id_anggota, nama_lengkap, wijk(nama_wijk)')
      .ilike('nama_lengkap', `%${val}%`)
      .limit(5);
    if (data) setResults(data);
  };

  const doCheckIn = async (memberId: string) => {
    setStatus('idle');
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

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center space-y-6">
        <div className="size-24 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-green-100 animate-bounce">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-3xl font-black text-[#0e141b] uppercase">Berhasil!</h1>
        <p className="text-slate-500 font-bold">Kehadiran Anda telah tercatat di SSOT Portal.</p>
        <button onClick={() => setStatus('idle')} className="text-[#197fe6] font-black text-xs uppercase tracking-widest border-b-2 border-[#197fe6]">Absen Nama Lain</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] p-6 font-sans">
      <div className="max-w-md mx-auto space-y-8 pt-10">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-[#0e141b] uppercase tracking-tighter">Self Check-in</h1>
          <p className="text-sm font-medium text-[#4e7397]">Silakan masukkan nama Anda untuk presensi.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
          <input 
            type="text"
            placeholder="Cari Nama Lengkap..."
            className="w-full pl-14 pr-6 py-5 bg-white rounded-3xl shadow-sm border-none font-bold text-lg outline-none focus:ring-4 focus:ring-blue-100 transition-all"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {status === 'error' && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-100">
            <AlertTriangle size={16} /> {msg}
          </div>
        )}

        <div className="space-y-3">
          {results.map((m) => (
            <button 
              key={m.id_anggota}
              onClick={() => doCheckIn(m.id_anggota)}
              className="w-full flex items-center justify-between p-6 bg-white rounded-[2rem] shadow-sm hover:scale-[1.02] active:scale-95 transition-all text-left"
            >
              <div>
                <p className="font-black text-[#0e141b] text-base uppercase leading-tight">{m.nama_lengkap}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">Wijk: {m.wijk?.nama_wijk || '-'}</p>
              </div>
              <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Konfirmasi</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}