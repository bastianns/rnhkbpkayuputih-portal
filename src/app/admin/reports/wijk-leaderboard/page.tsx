'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, 
  MapPin, 
  Users, 
  Activity, 
  TrendingUp, 
  ChevronRight,
  Medal,
  Crown
} from 'lucide-react';
import Link from 'next/link';

export default function GlobalWijkLeaderboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data: list, error } = await supabase
        .from('view_global_wijk_leaderboard')
        .select('*');

      if (!error && list) {
        setData(list);
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  if (loading) return <div className="p-10 text-center font-black uppercase tracking-widest text-slate-400">Menghitung Statistik Wilayah...</div>;

  return (
    <div className="p-8 space-y-8 bg-[#f6f7f8] min-h-screen text-left">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-[#0e141b] tracking-tight uppercase">Global Wijk Leaderboard</h1>
        <p className="text-[#4e7397] font-medium">Kompetisi keaktifan antar wilayah berbasis data partisipasi SSOT.</p>
      </div>

      {/* Top 3 Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.slice(0, 3).map((wijk, idx) => (
          <div key={wijk.id_wijk} className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center text-center transition-all hover:scale-[1.02] ${
            idx === 0 ? 'bg-slate-900 text-white border-amber-400 shadow-2xl shadow-amber-900/10' : 'bg-white border-slate-100'
          }`}>
            <div className="mb-4">
              {idx === 0 && <Crown className="text-amber-400 size-12" />}
              {idx === 1 && <Medal className="text-slate-300 size-10" />}
              {idx === 2 && <Medal className="text-amber-700 size-10" />}
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-1">{wijk.nama_wijk}</h3>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${idx === 0 ? 'text-amber-400' : 'text-blue-600'}`}>
              Rank #{idx + 1}
            </p>
            <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-white/10">
              <div>
                <p className="text-[8px] font-black uppercase opacity-50 tracking-widest">Total Poin</p>
                <p className="text-lg font-black">{wijk.total_poin_wilayah}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase opacity-50 tracking-widest">Indeks</p>
                <p className="text-lg font-black text-green-400">{wijk.indeks_keaktifan}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Ranking Table */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="text-xs font-black text-[#4e7397] uppercase tracking-[0.2em] flex items-center gap-2">
            <Activity size={16} /> Klasemen Seluruh Wilayah
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-[#4e7397] tracking-widest">
              <tr>
                <th className="px-8 py-4">Peringkat</th>
                <th className="px-8 py-4">Nama Wijk</th>
                <th className="px-8 py-4">Total Anggota</th>
                <th className="px-8 py-4">Total Hadir</th>
                <th className="px-8 py-4">Total Poin</th>
                <th className="px-8 py-4">Indeks Keaktifan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((wijk, index) => (
                <tr key={wijk.id_wijk} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <span className={`size-8 rounded-lg flex items-center justify-center font-black text-sm ${
                      index < 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col text-left">
                      <span className="font-black text-[#0e141b] uppercase text-sm tracking-tight">{wijk.nama_wijk}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{wijk.kode_wijk}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-sm text-[#4e7397]">{wijk.total_anggota}</td>
                  <td className="px-8 py-5 font-bold text-sm text-[#4e7397]">{wijk.total_partisipasi}</td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-black">
                      {wijk.total_poin_wilayah}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-green-500" />
                      <span className="font-black text-sm text-[#0e141b]">{wijk.indeks_keaktifan}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}