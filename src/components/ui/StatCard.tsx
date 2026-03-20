import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: ReactNode;
  className?: string;
}

export function StatCard({ title, value, sub, icon, className = '' }: StatCardProps) {
  return (
    <div
      className={`${className} bg-[#0a192f]/40 backdrop-blur-xl p-10 rounded-[3rem] border border-[#C5A059]/20 shadow-2xl flex items-start justify-between group hover:border-[#C5A059]/50 transition-all duration-300`}
      style={{ opacity: 0 }}
    >
      <div className="text-left space-y-1">
        <p className="text-[9px] font-black text-[#C5A059]/60 uppercase tracking-[0.2em] mb-3">
          {title}
        </p>
        <h3 className="text-5xl font-black text-white tracking-tighter italic">
          {value}
        </h3>
        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest pt-3 flex items-center gap-1">
          <ChevronRight size={12} className="text-[#C5A059]" /> {sub}
        </p>
      </div>
      <div
        className={`p-5 bg-[#C5A059]/10 rounded-[2rem] transition-transform group-hover:rotate-12 group-hover:scale-110 duration-300`}
      >
        {icon}
      </div>
    </div>
  );
}