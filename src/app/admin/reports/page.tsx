"use client";

import { useState, useEffect, useRef } from "react";
// Import Controller dan Komponen yang sudah dipisah
import { fetchAggregatedReportStats } from "@/actions/reportController";
import { StatCard } from "@/components/ui/StatCard";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, MapPin, CheckCircle2, Trophy, ChevronRight, Activity, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalUnique: 0,
    totalPendingVetting: 0,
    dynamicAccuracy: "0",
    wijkDistribution: [] as any[],
    matchQuality: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  // ── Refs untuk Animasi Premium ──
  const bgAmbientRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Memanggil Controller (Logic Layer), View tidak perlu tahu cara query database
        const aggregatedData = await fetchAggregatedReportStats();
        setStats(aggregatedData);
      } catch (err) {
        console.error("Gagal memuat analitik:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ── FITUR 1: WAAPI Ambient Background (Opera Gold) ──
  useEffect(() => {
    if (loading || !bgAmbientRef.current) return;
    const ambientAnim = waapi.animate(bgAmbientRef.current, {
      rotate: ['0deg', '360deg'],
      opacity: [0.02, 0.06, 0.02],
      scale: [1, 1.2, 1],
      duration: 35000,
      iterations: Infinity,
      easing: 'linear'
    });

    return () => { ambientAnim?.cancel(); };
  }, [loading]);

  // ── FITUR 2: Safe Entry Choreography & SplitText ──
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      const headerNode = headerRef.current;
      const titleNode = titleRef.current;
      const statNodes = Array.from(document.querySelectorAll('.anim-stat'));
      const chartNodes = Array.from(document.querySelectorAll('.anim-chart'));

      if (!headerNode || !titleNode) return;

      headerNode.style.opacity = '0';
      statNodes.forEach(el => ((el as HTMLElement).style.opacity = '0'));
      chartNodes.forEach(el => ((el as HTMLElement).style.opacity = '0'));

      let splitChars: any[] = [];
      if (!titleNode.dataset.split) {
        titleNode.innerText = "Analytics & Integrity"; 
        const split = splitText(titleNode, { chars: true });
        if (split && split.chars) splitChars = split.chars;
        titleNode.dataset.split = "true";
      } else {
        splitChars = Array.from(titleNode.querySelectorAll('span'));
      }

      const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } });

      tl.add(headerNode, { opacity: [0, 1], y: [-20, 0] });

      if (splitChars.length > 0) {
        tl.add(splitChars, {
          opacity: [0, 1],
          y: [20, 0],
          rotateX: [90, 0],
          delay: stagger(30)
        }, '<-=600');
      }

      if (statNodes.length > 0) {
        tl.add(statNodes, {
          opacity: [0, 1],
          y: [30, 0],
          delay: stagger(100)
        }, '<-=500');
      }

      if (chartNodes.length > 0) {
        tl.add(chartNodes, {
          opacity: [0, 1],
          scale: [0.85, 1],
          translateY: [20, 0],
          ease: 'outElastic(1, 0.6)',
          duration: 1200,
          delay: stagger(200)
        }, '<-=400');
      }

    }, 150);

    return () => clearTimeout(timer);
  }, [loading]);

  // ── FITUR 3: Tactile Spring ──
  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, {
      scale: state === 'down' ? 0.95 : 1,
      duration: 400,
      ease: spring({ bounce: 0.4 })
    });
  };

  const COLORS = ["#C5A059", "#0a192f", "#10b981", "#ef4444"];

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4 bg-[#051122]">
        <Loader2 className="animate-spin text-[#C5A059]" size={40} />
        <p className="font-black uppercase tracking-widest text-[#C5A059]/60 text-[10px] animate-pulse">
          Mengagregasi Integritas Data...
        </p>
      </div>
    );

  return (
    <div className="p-8 space-y-8 bg-[#051122] min-h-screen font-sans text-left relative overflow-hidden">
      
      {/* WAAPI Background Effect */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-end items-start">
        <div 
          ref={bgAmbientRef} 
          className="w-[120vmax] h-[120vmax] -translate-y-1/3 translate-x-1/4 rounded-full" 
          style={{ background: 'conic-gradient(from 0deg, transparent, rgba(197, 160, 89, 0.05), transparent)' }} 
        />
      </div>

      <div className="relative z-10 space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ opacity: 0 }}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#C5A059] font-black text-[10px] uppercase tracking-[0.3em]">
              <Activity size={14} /> Executive Summary
            </div>
            
            <div style={{ perspective: '800px' }} className="overflow-hidden py-1 text-left">
              <h1 ref={titleRef} className="text-4xl font-black text-white tracking-tighter uppercase leading-none italic">
                Analytics & Integrity
              </h1>
            </div>

            <p className="text-[#C5A059]/60 font-bold text-sm uppercase italic mt-1">
              Evaluasi Kualitas Master Data & Demografi Wijk
            </p>
          </div>

          <Link
            href="/admin/reports/wijk-leaderboard"
            onMouseDown={(e) => handleSpringBtn(e, 'down')}
            onMouseUp={(e) => handleSpringBtn(e, 'up')}
            onMouseLeave={(e) => animate(e.currentTarget, { scale: 1, duration: 200 })}
            className="flex items-center gap-4 bg-[#0a192f] text-white px-8 py-5 rounded-[2rem] border border-[#C5A059]/20 shadow-2xl hover:bg-[#C5A059]/10 transition-all duration-300 group"
          >
            <div className="p-3 bg-[#C5A059]/10 rounded-xl group-hover:bg-[#C5A059]/20 transition-colors">
              <Trophy size={24} className="text-[#C5A059]" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]/40 group-hover:text-[#C5A059]/80 transition-colors">
                Rankings
              </p>
              <p className="text-base font-black flex items-center gap-1 text-white">
                Global Leaderboard <ChevronRight size={18} className="text-[#C5A059] group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </Link>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            className="anim-stat"
            title="Total Anggota Unik"
            value={stats.totalUnique}
            sub="Master Records Verified"
            icon={<Users size={28} className="text-[#C5A059]" />}
          />
          <StatCard
            className="anim-stat"
            title="Vetting Queue"
            value={stats.totalPendingVetting}
            sub="Items in Quarantine"
            icon={<ShieldAlert size={28} className="text-amber-500" />}
          />
          <StatCard
            className="anim-stat"
            title="Data Accuracy"
            value={`${stats.dynamicAccuracy}%`}
            sub="System Integrity Rate"
            icon={<CheckCircle2 size={28} className="text-emerald-400" />}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Bar Chart */}
          <div className="anim-chart bg-[#0a192f]/40 backdrop-blur-xl p-10 rounded-[3rem] border border-[#C5A059]/20 shadow-2xl hover:border-[#C5A059]/40 hover:shadow-[0_0_30px_rgba(197,160,89,0.15)] transition-all duration-500">
            <div className="flex justify-between items-center mb-10 text-left">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] flex items-center gap-3">
                <MapPin size={20} /> Demografi per Wijk
              </h3>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.wijkDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(197, 160, 89, 0.1)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: "900", fill: "rgba(255, 255, 255, 0.4)", textAnchor: "middle" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: "bold", fill: "rgba(255, 255, 255, 0.4)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(197, 160, 89, 0.05)" }}
                    contentStyle={{
                      backgroundColor: "#0a192f",
                      borderRadius: "16px",
                      border: "1px solid rgba(197, 160, 89, 0.3)",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="#C5A059"
                    radius={[8, 8, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="anim-chart bg-[#0a192f]/40 backdrop-blur-xl p-10 rounded-[3rem] border border-[#C5A059]/20 shadow-2xl hover:border-[#C5A059]/40 hover:shadow-[0_0_30px_rgba(197,160,89,0.15)] transition-all duration-500">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059] mb-10 flex items-center gap-3 italic">
              <CheckCircle2 size={20} /> Komposisi Integritas
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.matchQuality}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.matchQuality.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a192f",
                      borderRadius: "16px",
                      border: "1px solid rgba(197, 160, 89, 0.3)",
                      color: "#fff"
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: "24px",
                      fontSize: "10px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "rgba(255, 255, 255, 0.5)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}