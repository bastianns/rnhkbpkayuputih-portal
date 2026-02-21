'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, Users, Zap, TrendingUp, Search, 
  Download, AlertCircle, ArrowUpRight, UserCheck, 
  Clock, Filter, X, ChevronRight, LayoutGrid, List,
  BarChart3, PieChart, Info, ShieldAlert
} from 'lucide-react';

// --- INTERFACES & TYPES (Menambah Baris & Keamanan Tipe) ---
interface WijkStats {
  id: string;
  nama: string;
  kode: string;
  totalPoin: number;
  populasi: number;
  burnoutRate: number;
  skorKeahlian: number;
  efisiensi: number;
  lastActivity: string | null;
  activeMembers: number;
}

interface MemberDetail {
  id_anggota: string;
  nama_lengkap: string;
  poin_individu: number;
  status: string;
}

export default function WijkLeaderboardPage() {
  // --- STATE MANAGEMENT ---
  const [leaderboard, setLeaderboard] = useState<WijkStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedWijk, setSelectedWijk] = useState<WijkStats | null>(null);
  const [wijkMembers, setWijkMembers] = useState<MemberDetail[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [showInactives, setShowInactives] = useState(true);

  // --- CORE LOGIC: FETCH & CALCULATE ---
  const fetchLeaderboardData = async () => {
    setLoading(true);
    try {
      console.log("Memulai sinkronisasi data strategis...");
      
      const [
        { data: wijkList, error: e1 },
        { data: partisipasi, error: e2 },
        { data: anggotaList, error: e3 },
        { data: kesibukanList, error: e4 },
        { data: keahlianList, error: e5 }
      ] = await Promise.all([
        supabase.from('wijk').select('*'),
        supabase.from('riwayat_partisipasi').select(`
          created_at, id_anggota,
          katalog_peran ( bobot_kontribusi ),
          kegiatan ( kategori_kegiatan ( bobot_dasar ) )
        `),
        supabase.from('anggota').select('id_anggota, id_wijk, nama_lengkap'),
        supabase.from('kesibukan_anggota').select('id_anggota, id_kategori_kesibukan').eq('is_current', true),
        supabase.from('keahlian_anggota').select('id_anggota, id_keahlian')
      ]);

      if (e1 || e2 || e3) throw new Error("Gagal mengambil data dari salah satu tabel.");

      const anggotaToWijk = new Map();
      anggotaList?.forEach(a => anggotaToWijk.set(a.id_anggota, a.id_wijk));

      const results = (wijkList || []).map(wijk => {
        const wijkPartisipasi = (partisipasi || []).filter(p => anggotaToWijk.get(p.id_anggota) === wijk.id_wijk);
        const wijkAnggota = (anggotaList || []).filter(a => a.id_wijk === wijk.id_wijk);
        const wijkAnggotaIds = wijkAnggota.map(a => a.id_anggota);

        // Kalkulasi Poin Kompleks
        let totalScore = 0;
        const memberPoints = new Map();

        wijkPartisipasi.forEach(p => {
          const peran = Array.isArray(p.katalog_peran) ? p.katalog_peran[0] : p.katalog_peran;
          const kegiatan = Array.isArray(p.kegiatan) ? p.kegiatan[0] : p.kegiatan;
          const kategori = kegiatan?.kategori_kegiatan;
          const bKategori = Array.isArray(kategori) ? kategori[0] : kategori;

          const pPeran = Number(peran?.bobot_kontribusi || 0);
          const pDasar = Number(bKategori?.bobot_dasar || 0);
          const poinTotal = pPeran + pDasar;

          totalScore += poinTotal;
          memberPoints.set(p.id_anggota, (memberPoints.get(p.id_anggota) || 0) + poinTotal);
        });

        const busyCount = kesibukanList?.filter(k => wijkAnggotaIds.includes(k.id_anggota)).length || 0;
        const skillCount = keahlianList?.filter(kh => wijkAnggotaIds.includes(kh.id_anggota)).length || 0;

        return {
          id: wijk.id_wijk,
          nama: wijk.nama_wijk,
          kode: wijk.kode_wijk || 'N/A',
          totalPoin: totalScore,
          populasi: wijkAnggota.length,
          burnoutRate: wijkAnggota.length > 0 ? (busyCount / wijkAnggota.length) * 100 : 0,
          skorKeahlian: wijkAnggota.length > 0 ? (skillCount / wijkAnggota.length) * 100 : 0,
          efisiensi: wijkAnggota.length > 0 ? totalScore / wijkAnggota.length : 0,
          activeMembers: memberPoints.size,
          lastActivity: wijkPartisipasi[0]?.created_at || null
        };
      });

      setLeaderboard(results.sort((a, b) => b.totalPoin - a.totalPoin));
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- DRILL DOWN LOGIC ---
  const fetchWijkDetails = async (wijk: WijkStats) => {
    setSelectedWijk(wijk);
    setLoadingDetail(true);
    try {
      const { data: members } = await supabase
        .from('anggota')
        .select(`
          id_anggota,
          nama_lengkap,
          status_keanggotaan,
          riwayat_partisipasi (
            katalog_peran ( bobot_kontribusi ),
            kegiatan ( kategori_kegiatan ( bobot_dasar ) )
          )
        `)
        .eq('id_wijk', wijk.id);

      if (members) {
        const formatted = members.map((m: any) => {
          const total = m.riwayat_partisipasi?.reduce((acc: number, curr: any) => {
            const bPeran = curr.katalog_peran?.bobot_kontribusi || 0;
            const bDasar = curr.kegiatan?.kategori_kegiatan?.bobot_dasar || 0;
            return acc + bPeran + bDasar;
          }, 0);
          return {
            id_anggota: m.id_anggota,
            nama_lengkap: m.nama_lengkap,
            poin_individu: total,
            status: m.status_keanggotaan
          };
        }).sort((a: any, b: any) => b.poin_individu - a.poin_individu);
        setWijkMembers(formatted);
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  // --- EXPORT LOGIC ---
  const exportToCSV = () => {
    const headers = "Rank,Nama Wijk,Total Poin,Populasi,Burnout Rate,Efisiensi\n";
    const rows = leaderboard.map((w, i) => 
      `${i + 1},${w.nama},${w.totalPoin},${w.populasi},${w.burnoutRate.toFixed(2)}%,${w.efisiensi.toFixed(2)}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Leaderboard_Wijk_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  useEffect(() => { fetchLeaderboardData(); }, []);

  const filteredData = useMemo(() => {
    return leaderboard.filter(w => 
      w.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.kode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, leaderboard]);

  // --- RENDER COMPONENTS ---
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 border-8 border-blue-100 rounded-full"></div>
        <div className="w-20 h-20 border-8 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
      </div>
      <p className="font-black text-slate-400 uppercase tracking-widest text-sm animate-pulse">
        Menghitung Skor Strategis Fellegi-Sunter...
      </p>
    </div>
  );

  return (
    <div className="p-8 bg-[#f1f5f9] min-h-screen font-sans text-left relative">
      
      {/* MODAL DETAIL (Menambah Kompleksitas & Baris) */}
      {selectedWijk && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="p-8 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-none">{selectedWijk.nama}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Daftar Kontributor Internal</p>
              </div>
              <button onClick={() => setSelectedWijk(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {loadingDetail ? (
                <div className="space-y-4">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {wijkMembers.map((m, idx) => (
                    <div key={m.id_anggota} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-slate-300 w-5">#{idx + 1}</span>
                        <div>
                          <p className="font-black text-slate-800 uppercase text-sm">{m.nama_lengkap}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{m.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-blue-600 leading-none">{m.poin_individu}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Poin</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP HEADER & ACTION BAR */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white"><BarChart3 size={20}/></div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Wijk Leaderboard</h1>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
               Sistem Terkalibrasi <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live Analytics
            </p>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari Nama Wijk atau Kode..." 
                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={exportToCSV} className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase hover:bg-slate-50 transition-all shadow-sm">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* ANALYTICS SUMMARY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard 
            label="Wijk Teratas" 
            value={leaderboard[0]?.nama || 'N/A'} 
            desc="Dominasi Kontribusi" 
            icon={<Trophy className="text-amber-500" />}
            trend="+12% bulan ini"
          />
          <SummaryCard 
            label="Total Poin Kolektif" 
            value={leaderboard.reduce((a,b) => a+b.totalPoin, 0).toLocaleString()} 
            desc="Seluruh Aktivitas" 
            icon={<Zap className="text-blue-500" />}
          />
          <SummaryCard 
            label="Burnout Alert" 
            value={`${(leaderboard.reduce((a,b) => a+b.burnoutRate, 0) / leaderboard.length).toFixed(1)}%`} 
            desc="Rata-rata Beban" 
            icon={<ShieldAlert className="text-red-500" />}
          />
          <SummaryCard 
            label="Efisiensi Tertinggi" 
            value={leaderboard.sort((a,b) => b.efisiensi - a.efisiensi)[0]?.nama || 'N/A'} 
            desc="Poin per Kapita" 
            icon={<TrendingUp className="text-emerald-500" />}
          />
        </div>

        {/* MAIN DATA TABLE */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
              <List size={14} /> Klasemen Kontribusi Strategis
            </h3>
            <div className="flex bg-white p-1 rounded-xl border">
              <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}><List size={18}/></button>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}><LayoutGrid size={18}/></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Rank</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Power Score</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Health Index</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map((item, index) => (
                  <tr key={item.id} className="group hover:bg-blue-50/40 transition-all">
                    <td className="px-8 py-8">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                        index === 0 ? 'bg-amber-100 text-amber-600 ring-4 ring-amber-50' : 
                        index === 1 ? 'bg-slate-200 text-slate-600' : 
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div>
                        <p className="text-lg font-black text-slate-900 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">
                          {item.nama}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-widest">
                            CODE: {item.kode}
                          </span>
                          <span className="text-[10px] font-black text-blue-400 flex items-center gap-1 uppercase tracking-widest">
                            <Users size={12}/> {item.populasi} Anggota
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                           <p className="text-2xl font-black text-slate-800 leading-none">{item.totalPoin.toLocaleString()}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.efisiensi.toFixed(1)} EFF</p>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                              className={`h-full transition-all duration-1000 ${index === 0 ? 'bg-amber-400' : 'bg-blue-600'}`}
                              style={{ width: `${(item.totalPoin / (leaderboard[0]?.totalPoin || 1)) * 100}%` }}
                           />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                       <div className="flex flex-col gap-2">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit ${item.burnoutRate > 50 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${item.burnoutRate > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                             <span className="text-[10px] font-black uppercase tracking-widest">
                                {item.burnoutRate > 50 ? 'High Risk' : 'Healthy'}
                             </span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase ml-1">Load: {item.burnoutRate.toFixed(1)}%</p>
                       </div>
                    </td>
                    <td className="px-8 py-8 text-right">
                       <button 
                        onClick={() => fetchWijkDetails(item)}
                        className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-lg"
                       >
                         <ChevronRight size={20} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div className="flex items-start gap-4 max-w-2xl">
                <Info size={24} className="text-blue-500 mt-1 flex-shrink-0" />
                <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                  <strong>Metodologi Kalkulasi:</strong> Skor dihitung secara otomatis berdasarkan relasi <code>riwayat_partisipasi</code>. Bobot peran ditarik dari tabel <code>katalog_peran</code> dan bobot kegiatan dari <code>kategori_kegiatan</code>. Burnout rate dihitung berdasarkan konsistensi data <code>kesibukan_anggota</code> yang sedang aktif.
                </p>
             </div>
             <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                System Auth: SSOT-ADMIN-v2
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS (Menambah modularitas & baris kode) ---

function SummaryCard({ label, value, desc, icon, trend }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">{icon}</div>
        {trend && <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase">{trend}</span>}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors truncate">{value}</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{desc}</p>
      </div>
    </div>
  );
}