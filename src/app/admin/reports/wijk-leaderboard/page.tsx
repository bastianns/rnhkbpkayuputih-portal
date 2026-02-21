'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, Activity, TrendingUp, Medal, Crown, 
  AlertTriangle, BrainCircuit, Users, Download
} from 'lucide-react';

export default function GlobalWijkLeaderboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComprehensiveLeaderboard();
  }, []);

  const fetchComprehensiveLeaderboard = async () => {
    setLoading(true);
    try {
      // Mengambil data mentah untuk dikalkulasi berdasarkan bobot terbaru di Settings
      const { data: wijkList } = await supabase.from('view_global_wijk_leaderboard').select('*');
      
      if (wijkList) {
        // Pastikan sort berdasarkan poin tertinggi
        const sortedData = wijkList.sort((a, b) => b.total_poin_wilayah - a.total_poin_wilayah);
        setData(sortedData);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="p-20 text-center">
      <div className="animate-spin inline-block size-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full mb-4"></div>
      <p className="font-black uppercase tracking-widest text-slate-400">Menyusun Laporan Strategis...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 bg-[#f6f7f8] min-h-screen text-left">
      {/* Header dengan Tombol Export */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-[#0e141b] tracking-tight uppercase italic">Executive Report: Wijk Performance</h1>
          <p className="text-[#4e7397] font-medium text-sm flex items-center gap-2">
            <Activity size={14}/> Berdasarkan Kalibrasi Bobot SSOT Terkini
          </p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase hover:bg-slate-50 shadow-sm transition-all">
          <Download size={16} /> Download PDF
        </button>
      </div>

      {/* Top 3 Spotlight - Lebih Dramatis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.slice(0, 3).map((wijk, idx) => (
          <div key={wijk.id_wijk} className={`p-8 rounded-[2.5rem] border-2 flex flex-col items-center text-center transition-all ${
            idx === 0 ? 'bg-slate-900 text-white border-amber-400 shadow-2xl scale-105' : 'bg-white border-slate-100'
          }`}>
            <div className="mb-4">
              {idx === 0 && <Crown className="text-amber-400 size-14 animate-bounce" />}
              {idx === 1 && <Medal className="text-slate-300 size-12" />}
              {idx === 2 && <Medal className="text-amber-700 size-12" />}
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">{wijk.nama_wijk}</h3>
            <div className="flex items-center gap-2 mb-4">
               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-blue-100 text-blue-600'}`}>
                 Rank #{idx + 1}
               </span>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-white/10">
              <div>
                <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Power Score</p>
                <p className="text-2xl font-black">{wijk.total_poin_wilayah.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase opacity-50 tracking-widest">Efficiency</p>
                <p className="text-2xl font-black text-emerald-500">{wijk.indeks_keaktifan}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Ranking dengan Metrik Tambahan */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-[#4e7397] tracking-widest">
              <tr>
                <th className="px-8 py-6">Pos</th>
                <th className="px-8 py-6">Wilayah / Wijk</th>
                <th className="px-8 py-6 text-center">Resources</th>
                <th className="px-8 py-6 text-center">Participation</th>
                <th className="px-8 py-6">Total Score</th>
                <th className="px-8 py-6">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((wijk, index) => (
                <tr key={wijk.id_wijk} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <span className={`size-10 rounded-xl flex items-center justify-center font-black text-sm ${
                      index < 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 uppercase text-base">{wijk.nama_wijk}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{wijk.kode_wijk}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center font-bold text-slate-600">
                    <div className="flex flex-col items-center">
                      <span className="text-sm">{wijk.total_anggota}</span>
                      <span className="text-[9px] uppercase text-slate-400">Jiwa</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center font-bold text-slate-600">
                     <div className="flex flex-col items-center">
                      <span className="text-sm">{wijk.total_partisipasi}</span>
                      <span className="text-[9px] uppercase text-slate-400">Events</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-200">
                        {wijk.total_poin_wilayah.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {/* Placeholder Logic Burnout dari data indeks */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${wijk.indeks_keaktifan < 1 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {wijk.indeks_keaktifan < 1 ? <AlertTriangle size={12}/> : <TrendingUp size={12}/>}
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {wijk.indeks_keaktifan < 1 ? 'High Risk' : 'Healthy'}
                      </span>
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