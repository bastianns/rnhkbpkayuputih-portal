'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Clock, 
  BadgeCheck, 
  RefreshCw, 
  CheckCircle, 
  Merge,
  AlertCircle,
  X,
  ArrowRightLeft,
  User,
  Calendar,
  MapPin,
  Phone,
  Database as DbIcon,
  Check,
  AlertCircle as AlertIcon,
  Home,
  ShieldCheck,
  Search
} from 'lucide-react';
// INTEGRASI POIN 3: Import helper audit log
import { createAuditLog } from '@/lib/audit';

export default function QueuePage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [wijkList, setWijkList] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0 });
  const [selectedComparison, setSelectedComparison] = useState<any>(null);

  // Fetch data kandidat dan metadata Wijk untuk mapping
  const fetchData = async () => {
    const { data: wijks } = await supabase.from('wijk').select('id_wijk, nama_wijk');
    if (wijks) setWijkList(wijks);

    const { data, count } = await supabase
      .from('dedup_candidate')
      .select(`
        id_candidate, score, decision, created_at,
        original_record:id_anggota_a (
          id_anggota, nama_lengkap, tanggal_lahir, alamat, no_telp, 
          id_wijk,
          wijk:id_wijk (nama_wijk)
        ),
        quarantine_record:id_quarantine_b (
          id_quarantine, raw_data
        )
      `, { count: 'exact' })
      .eq('decision', 'possible')
      .order('score', { ascending: false });

    if (data) setCandidates(data);
    if (count !== null) setStats({ pending: count });
  };

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * INTEGRASI POIN 3 & 5: RESOLUSI DATA & VERIFIKASI
   * Memproses keputusan admin dan mencatatnya ke Audit Log.
   */
  const handleResolve = async (idCandidate: string, decision: 'ACCEPT' | 'MERGE') => {
    setLoadingId(idCandidate);
    
    // 1. Jalankan fungsi resolusi di Database
    const { error } = await supabase.rpc('fn_portal_resolve_dedup', {
      p_id_candidate: idCandidate,
      p_decision: decision
    });

    if (error) {
      alert("Gagal memproses resolusi: " + error.message);
    } else {
      // 2. CATAT KE AUDIT LOG
      await createAuditLog(
        'RESOLVE_DEDUP',
        'dedup_candidate',
        idCandidate,
        null,
        { 
          decision: decision,
          result: decision === 'ACCEPT' ? 'NEW_VERIFIED_MEMBER' : 'UPDATED_MASTER'
        }
      );

      await fetchData();
      setSelectedComparison(null);
    }
    setLoadingId(null);
  };

  const getWijkName = (id: string) => wijkList.find(w => w.id_wijk === id)?.nama_wijk || 'Tidak Diketahui';

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 text-left relative bg-[#f6f7f8] min-h-screen font-sans">
      {/* Header Dashboard Premium */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <ShieldCheck size={20} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Identity Vetting Center</span>
        </div>
        <h1 className="text-3xl font-black text-[#0e141b] tracking-tight uppercase">Deduplication Queue</h1>
        <p className="text-[#4e7397] text-base max-w-2xl leading-relaxed italic">
          Tinjau pendaftaran jemaat yang ditahan di <strong>Quarantine</strong> untuk verifikasi identitas unik.
        </p>
      </div>

      {/* Ringkasan Metrik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QueueMetric label="Pending Review" value={stats.pending.toString()} icon={<Clock size={20} className="text-amber-600" />} bgColor="bg-amber-50" />
        <QueueMetric label="Vetting Status" value="Active" icon={<RefreshCw size={20} className="text-blue-600" />} bgColor="bg-blue-50" />
        <QueueMetric label="Data Integrity" value="98.2%" icon={<BadgeCheck size={20} className="text-green-600" />} bgColor="bg-green-50" />
      </div>

      {/* Tabel Antrean Utama */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <h3 className="font-black text-[#0e141b] text-xs uppercase tracking-[0.2em]">Antrean Verifikasi Jemaat</h3>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
            <AlertCircle size={14} /> Fellegi-Sunter Analysis Active
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[#4e7397] text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Kandidat Pendaftar</th>
                <th className="px-8 py-5 text-center">Similarity Score</th>
                <th className="px-8 py-5">Status Risiko</th>
                <th className="px-8 py-5 text-right">Aksi Analisis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((c) => (
                <tr key={c.id_candidate} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1 text-left">
                      <span className="font-black text-[#0e141b] text-sm uppercase">{c.quarantine_record?.raw_data?.nama_lengkap}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {c.id_candidate.split('-')[0]}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm font-black text-blue-600">{Number(c.score).toFixed(2)}</span>
                      <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(Number(c.score) * 8, 100)}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                      Number(c.score) > 12 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {Number(c.score) > 12 ? 'High Duplicate Risk' : 'Potential Match'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedComparison(c)}
                      className="px-6 py-2.5 bg-white border border-slate-200 text-[#0e141b] text-[10px] font-black rounded-xl hover:bg-[#1e40af] hover:text-white hover:border-[#1e40af] transition-all uppercase tracking-widest shadow-sm"
                    >
                      Bandingkan & Verifikasi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {candidates.length === 0 && (
            <div className="py-24 text-center space-y-4 opacity-30">
              <CheckCircle size={60} className="mx-auto text-slate-300" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-400">Antrean Quarantine Bersih</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Enterprise Side-by-Side Comparison */}
      {selectedComparison && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0e141b]/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden border border-white flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-blue-600 rounded-[1.2rem] text-white shadow-xl shadow-blue-100">
                  <ArrowRightLeft size={24} />
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-black text-[#0e141b] tracking-tight uppercase leading-none">Vetting Analysis</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Deduplication Engine Intelligence</p>
                </div>
              </div>
              <button onClick={() => setSelectedComparison(null)} className="p-3 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            {/* Perbandingan Data */}
            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 overflow-y-auto relative text-left">
              <div className="absolute left-1/2 top-10 bottom-10 w-px bg-slate-100 hidden lg:block"></div>

              {/* Kolom A: Master Record */}
              <div className="space-y-6 text-left">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-full w-fit">
                  <DbIcon size={12} className="text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Record (Database)</span>
                </div>
                <div className="grid gap-4">
                  <CompareField icon={<User size={18}/>} label="Nama Lengkap" value={selectedComparison.original_record.nama_lengkap} />
                  <CompareField icon={<Calendar size={18}/>} label="Tgl Lahir" value={selectedComparison.original_record.tanggal_lahir} />
                  <CompareField icon={<MapPin size={18}/>} label="Wilayah (Wijk)" value={selectedComparison.original_record.wijk?.nama_wijk} />
                  <CompareField icon={<Phone size={18}/>} label="Telepon" value={selectedComparison.original_record.no_telp || 'N/A'} />
                  <CompareField icon={<Home size={18}/>} label="Alamat" value={selectedComparison.original_record.alamat || 'N/A'} />
                </div>
              </div>

              {/* Kolom B: Request Pending */}
              <div className="space-y-6 text-left">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full w-fit border border-blue-100">
                  <Clock size={12} className="text-blue-600" />
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Request Pending (Quarantine)</span>
                </div>
                <div className="grid gap-4">
                  <CompareField 
                    icon={<User size={18}/>} label="Nama Lengkap" 
                    value={selectedComparison.quarantine_record.raw_data.nama_lengkap} 
                    highlight isChanged={selectedComparison.original_record.nama_lengkap !== selectedComparison.quarantine_record.raw_data.nama_lengkap}
                  />
                  <CompareField 
                    icon={<Calendar size={18}/>} label="Tgl Lahir" 
                    value={selectedComparison.quarantine_record.raw_data.tanggal_lahir} 
                    highlight isChanged={selectedComparison.original_record.tanggal_lahir !== selectedComparison.quarantine_record.raw_data.tanggal_lahir}
                  />
                  <CompareField 
                    icon={<MapPin size={18}/>} label="Wilayah (Wijk)" 
                    value={getWijkName(selectedComparison.quarantine_record.raw_data.id_wijk)} 
                    highlight isChanged={selectedComparison.original_record.id_wijk !== selectedComparison.quarantine_record.raw_data.id_wijk}
                  />
                  <CompareField 
                    icon={<Phone size={18}/>} label="Telepon" 
                    value={selectedComparison.quarantine_record.raw_data.no_telp || 'N/A'} 
                    highlight isChanged={selectedComparison.original_record.no_telp !== selectedComparison.quarantine_record.raw_data.no_telp}
                  />
                  <CompareField 
                    icon={<Home size={18}/>} label="Alamat" 
                    value={selectedComparison.quarantine_record.raw_data.alamat || 'N/A'} 
                    highlight isChanged={selectedComparison.original_record.alamat !== selectedComparison.quarantine_record.raw_data.alamat}
                  />
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="px-10 py-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3 text-blue-600">
                <div className="p-2 bg-blue-100 rounded-lg"><AlertIcon size={18} /></div>
                <span className="text-sm font-black uppercase tracking-tighter italic">Similarity Score: {Number(selectedComparison.score).toFixed(2)} Points</span>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  onClick={() => handleResolve(selectedComparison.id_candidate, 'ACCEPT')}
                  disabled={!!loadingId}
                  className="flex-1 md:flex-none px-8 py-4 bg-white border border-slate-200 text-[#0e141b] text-[10px] font-black rounded-[1.2rem] hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all uppercase tracking-widest shadow-sm disabled:opacity-50"
                >
                  Accept as New (Verify)
                </button>
                <button 
                  onClick={() => handleResolve(selectedComparison.id_candidate, 'MERGE')}
                  disabled={!!loadingId}
                  className="flex-1 md:flex-none px-10 py-4 bg-[#1e40af] text-white text-[10px] font-black rounded-[1.2rem] hover:bg-blue-800 transition-all uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingId ? <RefreshCw className="animate-spin" size={16} /> : <Merge size={16} />} 
                  Merge & Sync Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-komponen tetap sama
function CompareField({ icon, label, value, highlight = false, isChanged = false }: any) {
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${
      highlight ? (isChanged ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-blue-50/30 border-blue-100') : 'bg-white border-slate-100'
    }`}>
      <div className="flex items-center gap-4 text-left">
        <div className={`p-2.5 rounded-xl ${
          highlight ? (isChanged ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white shadow-md shadow-blue-100') : 'bg-slate-100 text-slate-500'
        }`}>
          {isChanged ? <AlertCircle size={18} /> : (highlight ? <Check size={18} /> : icon)}
        </div>
        <div className="text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className={`text-sm font-black ${isChanged ? 'text-amber-700' : (highlight ? 'text-blue-700' : 'text-[#0e141b]')}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function QueueMetric({ label, value, icon, bgColor }: any) {
  return (
    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-600/20 transition-all duration-300">
      <div className="flex flex-col gap-1 text-left">
        <p className="text-[10px] font-black text-[#4e7397] uppercase tracking-widest leading-none">{label}</p>
        <h3 className="text-3xl font-black text-[#0e141b] leading-none mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
    </div>
  );
}