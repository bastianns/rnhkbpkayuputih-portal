'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, ShieldCheck } from 'lucide-react';
// INTEGRASI POIN 3: Import helper audit log
import { createAuditLog } from '@/lib/audit';

/**
 * Dashboard Bridge: Menangani pengalihan otomatis dari /dashboard 
 * ke rute dinamis /dashboard/[id_anggota] untuk menghindari error 404.
 */
export default function DashboardBridge() {
  const router = useRouter();

  useEffect(() => {
    async function syncAndRedirect() {
      // 1. Ambil data user yang sedang login dari Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. INTEGRASI POIN 3: Catat akses masuk ke dashboard index
        await createAuditLog(
          'ACCESS_DASHBOARD_INDEX',
          'anggota',
          user.id,
          null,
          { device: navigator.userAgent }
        );

        // 3. Arahkan ke rute dinamis sesuai ID user (Penyelesaian 404)
        router.push(`/dashboard/${user.id}`);
      } else {
        // 4. Jika tidak ada session, kembalikan ke halaman login
        router.push('/login');
      }
    }

    syncAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center p-10 text-center font-sans">
      {/* Branding Logo Premium */}
      <div className="mb-8 animate-pulse text-left">
        <div className="flex items-center gap-3">
          <div className="bg-[#1e40af] p-2 rounded-xl text-white shadow-lg">
            <ShieldCheck size={28} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black text-2xl tracking-tighter text-[#0f172a]">SSOT</span>
            <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-[0.3em]">Portal Jemaat</span>
          </div>
        </div>
      </div>

      {/* Loading State Premium */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="animate-spin text-[#1e40af] relative z-10 mx-auto" size={48} />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-[0.4em]">
            Sinkronisasi Identitas
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-relaxed max-w-[200px] mx-auto">
            Menghubungkan sesi Anda dengan basis data pusat RNHKBP Kayu Putih...
          </p>
        </div>
      </div>
    </div>
  );
}