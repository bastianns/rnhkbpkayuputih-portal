'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  History, Calendar, ChevronLeft, Loader2, 
  ShieldCheck, Search, Trophy, Zap, Star
} from 'lucide-react';

export default function MemberHistoryPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchFullHistory() {
      setLoading(true);
      try {
        // Mengambil data riwayat partisipasi dengan join ke kegiatan & peran
        const { data: history, error } = await supabase
          .from('riwayat_partisipasi')
          .select(`
            id_partisipasi,
            waktu_check_in,
            kegiatan:id_kegiatan (nama_kegiatan, kategori_kegiatan(bobot_dasar)),
            peran:id_peran (nama_peran, bobot_kontribusi)
          `)
          .eq('id_anggota', id)
          .order('waktu_check_in', { ascending: false });

        if (error) throw error;
        setActivities(history || []);
      } catch (err) {
        console.error("Gagal mengambil riwayat:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchFullHistory();
  }, [id]);

  // Kalkulasi Statistik Kumulatif untuk Memicu Keaktifan
  const stats = useMemo(() => {
    const totalPoin = activities.reduce((acc, curr) => {
      const bDasar = curr.kegiatan?.kategori_kegiatan?.bobot_dasar || 0;
      const bPeran = curr.peran?.bobot_kontribusi || 0;
      return acc + bDasar + bPeran;
    }, 0);

    return {
      totalHadir: activities.length,
      totalPoin: totalPoin,
      rankTitle: totalPoin > 500 ? 'Pilar Pelayanan' : totalPoin > 200 ? 'Anggota Aktif' : 'Anggota Baru'
    };
  }, [activities]);

  const filteredActivities = activities.filter(act => 
    act.kegiatan?.nama_kegiatan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10">
      <div className="relative">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500 scale-75" />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Menyusun Arsip Kebaikan...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      {/* HEADER NAV */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all">
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="font-black text-lg tracking-tight text-slate-900 uppercase italic leading-none">Log Pelayanan</h1>
            <span className="text-[9px] font-bold text-blue-500 tracking-[0.2em] uppercase mt-1">Personal Journey</span>
          </div>
        </div>
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <ShieldCheck size={20} />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8 space-y-6">
        
        {/* SUMMARY STATS CARD ( Gamification Elements ) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
            <Trophy className="absolute -right-2 -bottom-2 text-white/10 group-hover:scale-125 transition-transform" size={80} />
            <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Total Poin</p>
            <h3 className="text-3xl font-black italic">{stats.totalPoin.toLocaleString()}</h3>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              <span className="text-[9px] font-black uppercase">{stats.rankTitle}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Kehadiran</p>
            <h3 className="text-3xl font-black text-slate-900">{stats.totalHadir} <span className="text-sm text-slate-300 font-bold uppercase italic">Kegiatan</span></h3>
            <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(stats.totalHadir * 5, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Cari Riwayat Kegiatan..."
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* LIST AKTIVITAS */}
        <div className="space-y-3">
          {filteredActivities.length > 0 ? filteredActivities.map((act) => {
             const bDasar = act.kegiatan?.kategori_kegiatan?.bobot_dasar || 0;
             const bPeran = act.peran?.bobot_kontribusi || 0;
             return (
              <div key={act.id_partisipasi} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1 truncate max-w-[150px]">
                      {act.kegiatan?.nama_kegiatan}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(act.waktu_check_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {act.peran?.nama_peran || 'Jemaat'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-blue-600">+{bDasar + bPeran}</span>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Poin</p>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
              <History className="mx-auto text-slate-200 mb-2" size={40} />
              <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Belum ada riwayat aktivitas</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}