'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  History, 
  Calendar, 
  ChevronLeft, 
  Loader2, 
  ShieldCheck,
  Search,
  Filter
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
        const { data: history, error } = await supabase
          .from('riwayat_partisipasi')
          .select(`
            id_partisipasi,
            waktu_check_in,
            kegiatan:id_kegiatan (nama_kegiatan),
            peran:id_peran (nama_peran)
          `)
          .eq('id_anggota', id)
          .order('waktu_check_in', { ascending: false });

        if (error) throw error;
        if (history) setActivities(history);
      } catch (err) {
        console.error("Gagal mengambil riwayat:", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchFullHistory();
  }, [id]);

  // Logika Filter Pencarian
  const filteredActivities = activities.filter(act => 
    act.kegiatan?.nama_kegiatan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10">
      <Loader2 className="animate-spin text-[#1e40af] mb-4" size={48} />
      <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.3em]">Memuat Riwayat Lengkap...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfd] font-sans antialiased">
      {/* --- HEADER NAV --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-500/20 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-[#1e40af] transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col leading-none">
            <h1 className="font-extrabold text-xl tracking-tighter text-[#0f172a] uppercase">Perjalanan Keanggotaan</h1>
            <span className="text-[9px] font-bold text-[#f59e0b] tracking-[0.2em] uppercase">Arsip Partisipasi Terpadu</span>
          </div>
        </div>
        <ShieldCheck className="text-[#1e40af]" size={24} />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* --- SEARCH BAR --- */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1e40af] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama kegiatan..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-[#1e40af]/20 transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* --- ACTIVITY LIST --- */}
        <div className="space-y-4">
          {filteredActivities.length > 0 ? filteredActivities.map((act) => (
            <div key={act.id_partisipasi} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-5 hover:border-[#1e40af]/20 transition-all group">
              <div className="size-14 bg-slate-50 text-[#1e40af] rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#1e40af] group-hover:text-white transition-all">
                <Calendar size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-[#0f172a] uppercase leading-tight truncate">
                  {act.kegiatan?.nama_kegiatan}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[9px] font-bold text-[#1e40af] bg-blue-50 px-2 py-0.5 rounded uppercase">
                    {act.peran?.nama_peran || 'Jemaat'}
                  </span>
                  <span className="text-[10px] text-[#64748b] font-medium italic">
                    {new Date(act.waktu_check_in).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-20 bg-white rounded-[24px] border-2 border-dashed border-slate-100">
              <History className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-sm font-bold text-slate-400 uppercase italic tracking-widest">Data tidak ditemukan</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}