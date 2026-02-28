'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, LogIn } from 'lucide-react';
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();


  const isDashboard = pathname.startsWith('/dashboard');
  const isAdmin = pathname.startsWith('/admin');
  
  // Sembunyikan navbar di halaman Login, Register, ATAU halaman utama (/)
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname === '/';

  // Gabungkan semua kondisi: Jika salah satu benar, navbar akan disembunyikan
  const hideNavbar = isDashboard || isAdmin || isAuthPage;

  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased bg-[#050c18]">
        
        {/* Navbar Landing Page - Hanya muncul jika BUKAN di rute yang disembunyikan di atas */}
        {!hideNavbar && (
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-[#1e40af] p-1.5 rounded-lg text-white">
                  <ShieldCheck size={20} />
                </div>
                <span className="font-extrabold text-xl tracking-tighter text-[#0f172a]">SSOT PORTAL</span>
              </div>
              <nav className="flex items-center gap-8">
                <Link href="/register" className="text-xs font-bold text-slate-500 hover:text-[#1e40af] uppercase tracking-widest">
                  Registrasi
                </Link>
                <Link 
                  href="/login"
                  className="flex items-center gap-2 bg-[#0f172a] text-white px-6 py-2.5 rounded-xl font-bold text-[11px] tracking-widest hover:bg-slate-800 transition-all"
                >
                  <LogIn size={16} /> PORTAL SIGN IN
                </Link>
              </nav>
            </div>
          </header>
        )}

        {/* Konten Utama Aplikasi */}
        {children}
      </body>
    </html>
  );
}