'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck, LogOut, Calendar, Users,
  Activity, FileText, Settings, Database,
  Menu, X, User,
} from 'lucide-react';

// ── Anime.js V4 Imports ──
import { animate, spring, createAnimatable } from 'animejs';
import { handleLogout } from '@/actions/authController';
import { supabase } from '@/lib/supabase';
import '../globals.css';

const ADMIN_NAV = [
  { name: 'Penjadwalan', path: '/admin/events', icon: Calendar },
  { name: 'Vetting Queue', path: '/admin/queue', icon: ShieldCheck },
  { name: 'Master Records', path: '/admin/records', icon: Database },
  { name: 'Analytics', path: '/admin/reports', icon: Activity },
  { name: 'Audit Logs', path: '/admin/logs', icon: FileText },
  { name: 'System Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Refs untuk Cursor Glow
  const glowRef = useRef<HTMLDivElement>(null);

  // ── FITUR: Ambil Data Admin (hanya untuk display, bukan untuk keamanan) ──
  useEffect(() => {
    const getAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setAdminEmail(user.email ?? 'Administrator');
    };
    getAdmin();
  }, []);

  // ── FITUR: Golden Cursor Glow ──
  useEffect(() => {
    if (!glowRef.current) return;

    const glow = createAnimatable(glowRef.current, {
      x: 0,
      y: 0,
      ease: 'out(3)',
    });

    const handleMouseMove = (e: MouseEvent) => {
      glow.x(e.clientX - 150);
      glow.y(e.clientY - 150);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ── LOGOUT HANDLER ──
  // PENTING: handleLogout() di server akan memanggil redirect('/login').
  // Next.js mengimplementasikan redirect() dengan melempar error internal (NEXT_REDIRECT).
  // Karena itu, kita TIDAK boleh menangkap semua error — hanya tangkap error
  // yang bukan berasal dari redirect Next.js.
  const handleSignOut = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar dari sistem?')) return;

    setIsLoggingOut(true);

    try {
      const result = await handleLogout();

      // Jika sampai sini, berarti signOut gagal sebelum redirect dipanggil
      // (handleLogout mengembalikan { success: false, error: ... })
      if (result && !result.success) {
        alert(`Gagal logout: ${result.error}`);
        setIsLoggingOut(false);
      }
      // Jika redirect berhasil, komponen ini tidak akan dirender lagi
      // sehingga setIsLoggingOut(false) tidak diperlukan
    } catch (err: any) {
      // Next.js redirect() melempar error dengan digest 'NEXT_REDIRECT'
      // Ini adalah perilaku normal dan TIDAK perlu ditangani
      if (err?.digest?.startsWith('NEXT_REDIRECT')) {
        // Redirect sedang berjalan — biarkan Next.js menanganinya
        return;
      }

      // Error lain yang tidak terduga
      console.error('Logout error:', err);
      alert('Terjadi kesalahan saat logout. Silakan coba lagi.');
      setIsLoggingOut(false);
    }
  };

  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, {
      scale: state === 'down' ? 0.95 : 1,
      duration: 400,
      ease: spring({ bounce: 0.4 }),
    });
  };

  return (
    <div className="min-h-screen bg-[#051122] flex flex-col md:flex-row font-sans text-white selection:bg-[#C5A059]/30 relative overflow-hidden">

      {/* ── MOUSE GLOW ELEMENT ── */}
      <div
        ref={glowRef}
        className="fixed pointer-events-none z-0 size-[300px] rounded-full blur-[120px] bg-[#C5A059]/10 opacity-60"
        style={{ willChange: 'transform' }}
      />

      {/* ── MOBILE OVERLAY ── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 transition-transform duration-500 ease-out
          fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0a192f]/60 backdrop-blur-2xl border-r border-[#C5A059]/10 
          flex flex-col z-40 shadow-[20px_0_40px_rgba(0,0,0,0.3)]
        `}
      >
        {/* Logo */}
        <div className="p-8 flex flex-col items-center justify-center border-b border-[#C5A059]/10">
          <div className="w-16 h-16 rounded-full border border-[#C5A059]/50 flex items-center justify-center bg-[#C5A059]/5 mb-4 shadow-[0_0_20px_rgba(197,160,89,0.1)]">
            <ShieldCheck size={28} className="text-[#C5A059]" />
          </div>
          <h2 className="font-serif italic text-lg text-white tracking-wide">RNHKBP</h2>
          <p className="text-[8px] font-black text-[#C5A059] uppercase tracking-[0.3em] mt-1 text-center italic">
            Command Center
          </p>
        </div>

        {/* ── LOGGED IN INFO ── */}
        <div className="px-6 py-4 flex items-center gap-3 border-b border-[#C5A059]/5 bg-white/5">
          <div className="size-8 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
            <User size={14} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <p className="text-[9px] font-black text-[#C5A059] uppercase tracking-tighter">
              Current Admin
            </p>
            <p className="text-[10px] text-white/60 truncate font-mono">
              {adminEmail || 'Loading...'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {ADMIN_NAV.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileOpen(false)}
                onMouseDown={(e) => handleSpringBtn(e, 'down')}
                onMouseUp={(e) => handleSpringBtn(e, 'up')}
                className={`nav-item-anim flex items-center gap-3 px-4 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  isActive
                    ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 shadow-inner'
                    : 'text-white/40 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <item.icon size={16} className={isActive ? 'text-[#C5A059]' : 'text-white/20'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Exit Button */}
        <div className="p-6 border-t border-[#C5A059]/10">
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            onMouseDown={(e) => handleSpringBtn(e, 'down')}
            onMouseUp={(e) => handleSpringBtn(e, 'up')}
            className="flex items-center justify-center gap-2 w-full py-4 bg-red-950/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={14} />
            {isLoggingOut ? 'Keluar...' : 'Exit System'}
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOGGLE BUTTON ── */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-[#0a192f]/80 border border-[#C5A059]/20 rounded-lg p-2 text-[#C5A059]"
        onClick={() => setIsMobileOpen((prev) => !prev)}
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 relative min-w-0 flex flex-col max-h-screen overflow-hidden bg-transparent">
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">{children}</div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(197, 160, 89, 0.1); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(197, 160, 89, 0.3); }
        `,
        }}
      />
    </div>
  );
}
