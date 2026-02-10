'use client';

import RegistrationForm from '../components/RegistrationForm';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle, 
  Fingerprint,
  Users,
  Lock,
  LogIn
} from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f7f8] font-sans selection:bg-blue-100 selection:text-blue-700 text-left">
      
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#d0dbe7_1px,transparent_1px)] [background-size:32px_32px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/20 blur-[120px] rounded-full"></div>
      </div>

      <main className="relative z-10 flex flex-col items-center px-4 py-12 md:px-10 lg:px-40">
        
        {/* Navigation Header Updated */}
        <nav className="w-full max-w-[1280px] flex justify-between items-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-200">
              <Users className="text-white" size={20} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg font-black text-[#0e141b] tracking-tighter uppercase leading-none">
                Portal <span className="text-blue-600">Anggota</span>
              </span>
              <span className="text-[10px] font-bold text-[#4e7397] uppercase tracking-widest mt-1">
                RNHKBP Kayu Putih
              </span>
            </div>
          </div>
          
          <Link 
            href="/login" 
            className="text-xs font-black text-[#0e141b] hover:text-blue-600 transition-all flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md"
          >
            <LogIn size={14} />
            Masuk ke Dashboard
            <ArrowRight size={14} />
          </Link>
        </nav>

        <div className="max-w-[1280px] w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-5 flex flex-col gap-10 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                <Lock size={12} />
                Secure Data Integration
              </div>
              
              <h1 className="text-[#0e141b] text-5xl md:text-6xl font-black leading-[1.05] tracking-tight text-left uppercase">
                Satu Identitas,<br/>
                <span className="text-blue-600">Satu Kebenaran.</span>
              </h1>
              
              <p className="text-[#4e7397] text-lg leading-relaxed max-w-md font-medium text-left">
                Sistem pendataan terpadu untuk memastikan setiap anggota terdaftar dengan identitas tunggal yang akurat, tervalidasi, dan terlindungi.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FeatureCard 
                icon={<Fingerprint className="text-blue-600" size={20} />} 
                title="Pencocokan Cerdas" 
                desc="Menggunakan algoritma Fellegi-Sunter untuk menjamin integritas data jemaat tanpa duplikasi." 
              />
              <FeatureCard 
                icon={<ShieldCheck className="text-blue-600" size={20} />} 
                title="Privasi Terjamin" 
                desc="Pemrosesan data yang transparan dan aman sesuai standar UU Pelindungan Data Pribadi (PDP)." 
              />
            </div>
          </div>

          <div className="lg:col-span-7 w-full animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/10 to-cyan-400/5 rounded-[3rem] blur-3xl opacity-50"></div>
              <div className="relative bg-white p-2 md:p-4 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-white">
                <RegistrationForm />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="group flex items-start gap-4 p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-sm hover:shadow-md hover:border-blue-600/30 transition-all text-left">
      <div className="p-2.5 bg-blue-600/5 rounded-xl group-hover:bg-blue-600/10 transition-colors flex-shrink-0">
        {icon}
      </div>
      <div className="text-left">
        <h3 className="font-black text-[#0e141b] text-base leading-none mb-2 uppercase tracking-tight">{title}</h3>
        <p className="text-xs text-[#4e7397] font-bold leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}