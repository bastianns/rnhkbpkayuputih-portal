import React from 'react';

interface LogStatProps {
  icon: React.ReactNode;
  label: string;
  value?: string | number;
  color: 'gold' | 'emerald' | 'blue' | 'red';
  className?: string;
}

export function LogStat({ icon, label, value, color, className = '' }: LogStatProps) {
  // Mapping warna sesuai desain UI premium Anda
  const colorMap: Record<string, string> = {
    gold: 'text-[#C5A059] bg-[#C5A059]/10 border-[#C5A059]/20 shadow-[0_0_15px_rgba(197,160,89,0.2)]',
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    red: 'text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
  };

  return (
    <div className={`${className} bg-[#0a192f]/60 backdrop-blur-xl p-8 rounded-[2rem] border border-[#C5A059]/20 shadow-2xl flex items-center gap-5 group hover:border-[#C5A059]/50 transition-all duration-500`}>
      <div className={`p-4 rounded-2xl border ${colorMap[color] || colorMap.gold} group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-[#C5A059]/60 uppercase tracking-[0.2em] mb-1">
          {label}
        </p>
        <p className="text-3xl font-black text-white italic tracking-tighter leading-none">
          {value !== undefined ? value : 0}
        </p>
      </div>
    </div>
  );
}