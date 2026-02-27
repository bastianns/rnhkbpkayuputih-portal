"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Users,
  Copy,
  MapPin,
  CheckCircle2,
  Trophy,
  ChevronRight,
  Activity,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalUnique: 0,
    totalPendingVetting: 0,
    dynamicAccuracy: "0",
    wijkDistribution: [] as any[],
    matchQuality: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getReportData() {
      setLoading(true);
      try {
        // 1. Hitung Total Anggota Terverifikasi (Master Records)
        const { count: uniqueCount } = await supabase
          .from("anggota")
          .select("*", { count: "exact", head: true })
          .eq("is_verified", true);

        // 2. Hitung Data yang Sedang Ditahan (Quarantine)
        // Ini adalah indikator beban kerja deduplikasi yang sedang berjalan
        const { count: quarantineCount } = await supabase
          .from("quarantine_anggota")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // 3. Kalkulasi Data Accuracy (Berdasarkan Integritas Tabel Utama)
        const totalAttempts = (uniqueCount || 0) + (quarantineCount || 0);
        const accuracyRate =
          totalAttempts > 0
            ? (((uniqueCount || 0) / totalAttempts) * 100).toFixed(1)
            : "100";

        // 4. Distribusi per Wilayah (Wijk) - Mengambil Data Real
        const { data: wijkData } = await supabase.from("wijk").select(`
            nama_wijk,
            anggota:anggota(count)
          `);

        const formattedWijk =
          wijkData?.map((w) => ({
            name: w.nama_wijk,
            total: w.anggota[0]?.count || 0,
          })) || [];

        setStats({
          totalUnique: uniqueCount || 0,
          totalPendingVetting: quarantineCount || 0,
          dynamicAccuracy: accuracyRate,
          wijkDistribution: formattedWijk,
          matchQuality: [
            { name: "Verified (Clean)", value: uniqueCount || 0 },
            { name: "Pending Review", value: quarantineCount || 0 },
          ],
        });
      } catch (err) {
        console.error("Gagal memuat analitik:", err);
      } finally {
        setLoading(false);
      }
    }

    getReportData();
  }, []);

  const COLORS = ["#197fe6", "#fbbf24", "#10b981", "#ef4444"];

  if (loading)
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-black uppercase tracking-widest text-slate-400">
          Mengagregasi Integritas Data...
        </p>
      </div>
    );

  return (
    <div className="p-8 space-y-8 bg-[#f6f7f8] min-h-screen font-sans text-left animate-in fade-in duration-500">
      {/* Header & Leaderboard Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#197fe6] font-black text-[10px] uppercase tracking-[0.3em]">
            <Activity size={14} /> Executive Summary
          </div>
          <h1 className="text-4xl font-black text-[#0e141b] tracking-tighter uppercase leading-none">
            Analytics & <span className="text-[#197fe6]">Integrity</span>
          </h1>
          <p className="text-[#4e7397] font-bold text-sm uppercase opacity-70 italic">
            Evaluasi kualitas algoritma Fellegi-Sunter & Performa Wilayah
          </p>
        </div>

        <Link
          href="/admin/reports/wijk-leaderboard"
          className="flex items-center gap-4 bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl shadow-slate-200 hover:bg-[#197fe6] transition-all group active:scale-95"
        >
          <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
            <Trophy size={24} className="text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white/80">
              Rankings
            </p>
            <p className="text-base font-black flex items-center gap-1">
              Global Leaderboard <ChevronRight size={18} />
            </p>
          </div>
        </Link>
      </div>

      {/* Metrics Row - Dinamis 100% */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Anggota Unik"
          value={stats.totalUnique}
          sub="Master Records Verified"
          icon={<Users className="text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="Vetting Queue"
          value={stats.totalPendingVetting}
          sub="Items in Quarantine"
          icon={<ShieldAlert className="text-amber-500" />}
          color="amber"
        />
        <StatCard
          title="Data Accuracy"
          value={`${stats.dynamicAccuracy}%`}
          sub="System Integrity Rate"
          icon={<CheckCircle2 className="text-green-500" />}
          color="green"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wilayah Distribution Chart */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#0e141b] flex items-center gap-3">
              <MapPin size={20} className="text-[#197fe6]" /> Demografi per Wijk
            </h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.wijkDistribution}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: "900", fill: "#4e7397" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: "bold", fill: "#4e7397" }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "24px",
                    border: "none",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
                    padding: "20px",
                    fontWeight: "bold",
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="#197fe6"
                  radius={[10, 10, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Integrity Pie Chart */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#0e141b] mb-10 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-[#197fe6]" /> Komposisi
            Integritas
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.matchQuality}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.matchQuality.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "20px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: "30px",
                    fontSize: "11px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color }: any) {
  const hoverColor =
    color === "blue"
      ? "hover:border-blue-400"
      : color === "amber"
        ? "hover:border-amber-400"
        : "hover:border-green-400";
  const iconBg =
    color === "blue"
      ? "bg-blue-50"
      : color === "amber"
        ? "bg-amber-50"
        : "bg-green-50";

  return (
    <div
      className={`bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-start justify-between group ${hoverColor} transition-all duration-300`}
    >
      <div className="text-left space-y-1">
        <p className="text-[10px] font-black text-[#4e7397] uppercase tracking-[0.2em] mb-3">
          {title}
        </p>
        <h3 className="text-5xl font-black text-[#0e141b] tracking-tighter italic">
          {value}
        </h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2 flex items-center gap-1">
          <ChevronRight size={10} /> {sub}
        </p>
      </div>
      <div
        className={`p-5 ${iconBg} rounded-[2rem] transition-transform group-hover:rotate-12 duration-300`}
      >
        {icon}
      </div>
    </div>
  );
}
