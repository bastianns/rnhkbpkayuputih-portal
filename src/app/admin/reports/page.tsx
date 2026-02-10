'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Users, Copy, MapPin, CheckCircle2, Trophy, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalUnique: 0,
    totalDuplicatesFlagged: 0,
    wijkDistribution: [] as any[],
    matchQuality: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getReportData() {
      // 1. Hitung Total Anggota Unik (SSOT)
      const { count: uniqueCount } = await supabase
        .from('anggota')
        .select('*', { count: 'exact', head: true });

      // 2. Hitung Duplikasi yang Berhasil Dicegah (Quarantine)
      const { count: dupCount } = await supabase
        .from('dedup_candidate')
        .select('*', { count: 'exact', head: true });

      // 3. Distribusi per Wilayah (Wijk)
      const { data: wijkData } = await supabase
        .from('wijk')
        .select(`
          nama_wijk,
          anggota:anggota(count)
        `);

      const formattedWijk = wijkData?.map(w => ({
        name: w.nama_wijk,
        total: w.anggota[0].count
      })) || [];

      setStats({
        totalUnique: uniqueCount || 0,
        totalDuplicatesFlagged: dupCount || 0,
        wijkDistribution: formattedWijk,
        matchQuality: [
          { name: 'Direct Success', value: uniqueCount || 0 },
          { name: 'Flagged/Duplicate', value: dupCount || 0 }
        ]
      });
      setLoading(false);
    }

    getReportData();
  }, []);

  const COLORS = ['#197fe6', '#fbbf24', '#10b981', '#ef4444'];

  if (loading) return (
    <div className="p-10 text-center font-black uppercase tracking-widest text-slate-400 animate-pulse">
      Mengagregasi Data Laporan...
    </div>
  );

  return (
    <div className="p-8 space-y-8 bg-[#f6f7f8] min-h-screen font-sans text-left">
      {/* Header dengan Tombol Navigasi Leaderboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-[#0e141b] tracking-tight uppercase">Analytics & Data Integrity</h1>
          <p className="text-[#4e7397] font-medium">Evaluasi kualitas data dan efektivitas algoritma deduplikasi SSOT.</p>
        </div>
        
        {/* TOMBOL BARU: NAVIGASI KE LEADERBOARD */}
        <Link 
          href="/admin/reports/wijk-leaderboard"
          className="flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-[1.5rem] shadow-xl shadow-slate-200 hover:bg-[#197fe6] transition-all group"
        >
          <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
            <Trophy size={20} className="text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white/80">View Ranking</p>
            <p className="text-sm font-black flex items-center gap-1">
              Global Leaderboard <ChevronRight size={16} />
            </p>
          </div>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Anggota Unik" 
          value={stats.totalUnique} 
          sub="Master Records (SSOT)" 
          icon={<Users className="text-blue-600" />} 
        />
        <StatCard 
          title="Duplikasi Dicegah" 
          value={stats.totalDuplicatesFlagged} 
          sub="Potential Duplicates Caught" 
          icon={<Copy className="text-amber-500" />} 
        />
        <StatCard 
          title="Data Accuracy" 
          value="98.4%" 
          sub="Vetting Success Rate" 
          icon={<CheckCircle2 className="text-green-500" />} 
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wilayah Distribution Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#0e141b] mb-8 flex items-center gap-2">
            <MapPin size={18} className="text-[#197fe6]" /> Distribusi per Wijk
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.wijkDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 'bold', fill: '#4e7397'}} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#4e7397'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px'}} 
                />
                <Bar dataKey="total" fill="#197fe6" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Integrity Pie Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#0e141b] mb-8 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-[#197fe6]" /> Komposisi Integritas Data
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.matchQuality}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.matchQuality.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-start justify-between group hover:border-[#197fe6] transition-all">
      <div className="text-left">
        <p className="text-[10px] font-black text-[#4e7397] uppercase tracking-widest mb-2">{title}</p>
        <h3 className="text-4xl font-black text-[#0e141b] tracking-tight">{value}</h3>
        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase italic">{sub}</p>
      </div>
      <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
        {icon}
      </div>
    </div>
  );
}