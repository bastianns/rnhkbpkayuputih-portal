'use client';

import Sidebar from './Sidebar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Bell, Search, UserCircle } from 'lucide-react';

/**
 * AdminLayout berfungsi sebagai wrapper utama untuk semua halaman di bawah rute /admin.
 * Mengintegrasikan Sidebar modular, Proteksi Sesi, dan Topbar Global.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // PROTEKSI: Cek apakah user memiliki sesi yang valid sebelum merender halaman Admin
    const checkAdminSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Jika tidak ada sesi, tendang kembali ke halaman Login
        router.push('/login');
      } else {
        // Sesi valid, izinkan masuk ke area Admin
        setIsAuthorized(true);
      }
    };

    checkAdminSession();
  }, [router]);

  // Tampilkan layar loading saat memverifikasi sesi
  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#fcfcfd]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#1e40af]" size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Mengautentikasi Akses Admin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fcfcfd] font-sans text-slate-900 selection:bg-amber-500/20">
      {/* Sidebar Modular */}
      <Sidebar />

      {/* Area Konten Utama */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* TOPBAR / HEADER GLOBAL (Fitur Baru) */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 z-20 shrink-0 shadow-sm">
          {/* Global Search Placeholder */}
          <div className="flex items-center gap-4 text-slate-400 focus-within:text-[#1e40af] transition-colors w-96 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Cari anggota, wijk, atau ID kegiatan..." 
              className="bg-transparent border-none outline-none text-xs font-bold w-full placeholder:text-slate-300 text-slate-700"
            />
          </div>

          {/* Profil Admin & Notifikasi */}
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-[#f59e0b] transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 size-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#1e40af] transition-colors">Admin Portal</p>
                <p className="text-sm font-bold leading-none text-slate-700">Command Center</p>
              </div>
              <div className="size-10 bg-[#1e40af]/10 rounded-xl flex items-center justify-center group-hover:bg-[#1e40af] transition-colors">
                <UserCircle size={24} className="text-[#1e40af] group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto relative animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}