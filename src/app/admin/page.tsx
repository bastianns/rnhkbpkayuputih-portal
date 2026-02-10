'use client';

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, 
  Bell, 
  Clock,      // Pengganti PendingActions
  BadgeCheck, // Pengganti Verified (Lebih Enterprise)
  RefreshCw,  // Pengganti Sync
  CheckCircle,
  Merge
} from 'lucide-react';

export default function AdminDashboard() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ pending: 0, processed: 0 });

  const fetchData = async () => {
    const { data, count } = await supabase
      .from('dedup_candidate')
      .select(`
        id_candidate, score, decision, created_at,
        quarantine_anggota:id_quarantine_b (raw_data, status)
      `, { count: 'exact' })
      .eq('decision', 'possible');

    if (data) setCandidates(data);
    if (count !== null) setStats(prev => ({ ...prev, pending: count }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (idCandidate: string, decision: 'ACCEPT' | 'MERGE') => {
    setLoadingId(idCandidate);
    const { error } = await supabase.rpc('fn_portal_resolve_dedup', {
      p_id_candidate: idCandidate,
      p_decision: decision
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      await fetchData();
    }
    setLoadingId(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen text-left">
      {/* Page Header Area */}
      <div className="p-8">
        <div className="flex justify-between items-end mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-[#0e141b] text-3xl font-black tracking-tight uppercase">Deduplication Queue</h1>
            <p className="text-[#4e7397] text-base leading-relaxed">
              Review potential member duplicates based on <strong>Fellegi-Sunter</strong> scoring engine.
            </p>
          </div>
        </div>

        {/* Metrics Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <MetricCard 
            title="Pending Reviews" 
            value={stats.pending.toString()} 
            icon={<Clock size={22} />} // Sudah diperbaiki
            color="amber" 
          />
          <MetricCard 
            title="System Accuracy" 
            value="98.2%" 
            icon={<BadgeCheck size={22} />} // Sudah diperbaiki
            color="green" 
          />
          <MetricCard 
            title="Sync Nodes" 
            value="Active" 
            icon={<RefreshCw size={22} />} // Sudah diperbaiki
            color="blue" 
          />
        </div>

        {/* Table Content Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[#4e7397] text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-6 py-5">Member Info</th>
                  <th className="px-6 py-5">Similarity Score</th>
                  <th className="px-6 py-5">Match Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((c) => (
                  <tr key={c.id_candidate} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0e141b]">{c.quarantine_anggota?.raw_data?.nama_lengkap}</span>
                        <span className="text-[10px] font-mono text-slate-400">ID: {c.id_candidate.split('-')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 w-32">
                        <div className="flex justify-between text-[10px] font-bold text-blue-600">
                          <span>{Number(c.score).toFixed(1)}</span>
                          <span className="text-slate-300">PTS</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${Math.min(Number(c.score) * 8, 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        Number(c.score) > 10 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {Number(c.score) > 10 ? 'High Confidence' : 'Review Required'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleResolve(c.id_candidate, 'ACCEPT')}
                          disabled={loadingId === c.id_candidate}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle size={14} /> Accept
                        </button>
                        <button 
                          onClick={() => handleResolve(c.id_candidate, 'MERGE')}
                          disabled={loadingId === c.id_candidate}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                        >
                          <Merge size={14} /> Merge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {candidates.length === 0 && (
              <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
                <CheckCircle size={40} className="opacity-20" />
                <p className="text-sm font-medium italic">Queue is clear. No pending duplicates.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }: any) {
  const colorMap: any = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100'
  };
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[#4e7397] text-xs font-black uppercase tracking-widest">{title}</p>
        <div className={`p-2 rounded-xl border ${colorMap[color]}`}>{icon}</div>
      </div>
      <h3 className="text-[#0e141b] text-3xl font-black">{value}</h3>
    </div>
  );
}