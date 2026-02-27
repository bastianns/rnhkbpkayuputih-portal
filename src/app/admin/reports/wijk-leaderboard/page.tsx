'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, Activity, TrendingUp, Medal, Crown, 
  AlertTriangle, BrainCircuit, Users, Download, 
  ChevronUp, Loader2
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
      // Memanggil view yang sudah kita perbaiki di SQL Editor tadi
      const { data: wijkList, error } = await supabase
        .from('view_global_wijk_leaderboard')
        .select('*')
        .order('total_poin_wilayah', { ascending: false });
      
      if (error) throw error;
      setData(wijkList || []);
    } catch (err) {
      console.error("Gagal menyusun leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="font-black uppercase tracking-widest text-slate-400 animate-pulse">
        Menghitung Power Score Wilayah...
      </p>
    </div>
  );

  return (
    <div className="p-8 space-y-10 bg-[#f6f7f8] min-h-screen text-left animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em]">
            <BrainCircuit size={14}/> Intelligence Dashboard
          </div>
          <h1 className="text-4xl font-black text-[#0e141b] tracking-tighter uppercase italic leading-none">
            Wijk <span className="text-blue-600">Performance</span> Index
          </h1>
          <p className="text-[#4e7397] font-bold text-xs uppercase tracking-widest flex items-center gap-2 opacity-70">
            <Activity size={14}/> Berdasarkan Real-Time Calibration RNHKBP SSOT
          </p>
        </div>
        <button className="group flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white shadow-sm transition-all active:scale-95">
          <Download size={16} className="group-hover:animate-bounce" /> Export Executive PDF
        </button>
      </div>

      {/* Top 3 Podium Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
        {data.slice(0, 3).map((wijk, idx) => {
          // Logic warna podium
          const isWinner = idx === 0;
          return (
            <div key={wijk.id_wijk} className={`relative p-10 rounded-[3.5rem] border-4 flex flex-col items-center text-center transition-all duration-500 hover:translate-y-[-10px] ${
              isWinner 
                ? 'bg-slate-900 text-white border-amber-400 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] scale-105 z-10' 
                : 'bg-white border-white shadow-xl text-slate-900'
            }`}>
              {isWinner && (
                <div className="absolute -top-6 bg-amber-400 text-slate-900 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">
                  Top Performance
                </div>
              )}
              
              <div className="mb-6">
                {idx === 0 && <Crown className="text-amber-400" size={64} />}
                {idx === 1 && <Medal className="text-slate-300" size={56} />}
                {idx === 2 && <Medal className="text-amber-700" size={56} />}
              </div>

              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 leading-tight">
                {wijk.nama_wijk}
              </h3>
              
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-8 ${
                isWinner ? 'bg-white/10 text-amber-400' : 'bg-blue-50 text-blue-600'
              }`}>
                Ranking #{idx + 1}
              </span>

              <div className={`grid grid-cols-2 gap-8 w-full pt-8 border-t ${isWinner ? 'border-white/10' : 'border-slate-50'}`}>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase opacity-50 tracking-[0.2em]">Power Score</p>
                  <p className="text-3xl font-black tabular-nums">{wijk.total_poin_wilayah.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase opacity-50 tracking-[0.2em]">Efficiency</p>
                  <p className={`text-3xl font-black tabular-nums ${isWinner ? 'text-amber-400' : 'text-emerald-500'}`}>
                    {wijk.indeks_keaktifan}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Ranking Table */}
      <div className="bg-white border border-slate-100 rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              <tr>
                <th className="px-10 py-8">Pos</th>
                <th className="px-10 py-8">Identity / Wilayah</th>
                <th className="px-10 py-8 text-center">Resources</th>
                <th className="px-10 py-8 text-center">Participation</th>
                <th className="px-10 py-8">Total Score</th>
                <th className="px-10 py-8">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((wijk, index) => (
                <tr key={wijk.id_wijk} className="hover:bg-blue-50/30 transition-all group cursor-default">
                  <td className="px-10 py-7">
                    <span className={`size-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${
                      index < 3 ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 uppercase text-lg italic tracking-tight">{wijk.nama_wijk}</span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Wijk Code: {wijk.kode_wijk || 'W-ID'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <div className="flex flex-col items-center bg-slate-50 rounded-2xl py-3 px-4 group-hover:bg-white transition-colors">
                      <span className="text-lg font-black text-slate-700">{wijk.total_anggota}</span>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">JIWA</span>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-center">
                     <div className="flex flex-col items-center border border-slate-100 rounded-2xl py-3 px-4">
                      <span className="text-lg font-black text-slate-700">{wijk.total_partisipasi}</span>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">EVENTS</span>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-2">
                      <div className="px-6 py-3 bg-[#197fe6] text-white rounded-2xl text-base font-black shadow-lg shadow-blue-100 italic">
                        {wijk.total_poin_wilayah.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl w-fit font-black text-[10px] uppercase tracking-widest ${
                      wijk.indeks_keaktifan < 0.5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {wijk.indeks_keaktifan < 0.5 ? <AlertTriangle size={14} className="animate-pulse"/> : <ChevronUp size={14}/>}
                      {wijk.indeks_keaktifan < 0.5 ? 'Low Engagement' : 'Optimal'}
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