'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Cross, ShieldCheck } from 'lucide-react';
import { createAuditLog } from '@/lib/audit';
import { motion } from 'motion/react';

/**
 * Dashboard Bridge: Gerbang estetik yang menghubungkan sesi login
 * dengan data profil jemaat di RNHKBP Kayu Putih.
 */
export default function DashboardBridge() {
  const router = useRouter();

  useEffect(() => {
    async function syncAndRedirect() {
      // Tunggu sebentar untuk memastikan cookie tersinkronisasi
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await createAuditLog('ACCESS_DASHBOARD_BRIDGE', 'auth', user.id, null, { device: navigator.userAgent });

        const { data: member } = await supabase
          .from('anggota')
          .select('id_anggota')
          .eq('id_auth', user.id)
          .maybeSingle();

        if (member) {
          router.push(`/dashboard/${member.id_anggota}`);
        } else {
          // Placeholder untuk user yang baru daftar (masih di karantina)
          router.push(`/dashboard/${user.id}`);
        }
      } else {
        router.push('/login');
      }
    }

    const timer = setTimeout(syncAndRedirect, 500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen bg-[#050c18] flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      {/* Background Decorative Rays */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vmax] h-[100vmax] bg-[radial-gradient(circle,#c5a059_0%,transparent_70%)] blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 space-y-8"
      >
        {/* Ornate Logo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-[#c5a059] rotate-45 shadow-[0_0_30px_rgba(197,160,89,0.2)]"></div>
            <Cross className="text-[#c5a059] relative z-10 w-8 h-8" />
          </div>
          
          <div className="space-y-1">
            <h1 className="font-serif text-2xl text-white tracking-[0.2em] uppercase italic">RNHKBP Kayu Putih</h1>
            <p className="text-[#c5a059] text-[10px] font-bold tracking-[0.4em] uppercase opacity-70">Identity Portal</p>
          </div>
        </div>

        {/* Loading State */}
        <div className="space-y-4 max-w-xs mx-auto pt-4">
          <div className="relative flex justify-center">
            <Loader2 className="animate-spin text-[#c5a059]/40 absolute" size={56} strokeWidth={1} />
            <ShieldCheck className="text-[#c5a059] relative z-10 mt-3" size={24} />
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] animate-pulse">
              Authenticating Identity
            </p>
            <div className="h-[1px] w-12 bg-[#c5a059]/30 mx-auto"></div>
            <p className="text-[9px] font-serif italic text-white/40 leading-relaxed tracking-wider">
              Menyelaraskan sesi Anda dengan basis data pusat...
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer Minimalist */}
      <footer className="absolute bottom-10 left-0 w-full text-center">
        <p className="text-[8px] font-bold text-white/10 uppercase tracking-[0.5em]">
          Single Source of Truth System
        </p>
      </footer>
    </main>
  );
}
