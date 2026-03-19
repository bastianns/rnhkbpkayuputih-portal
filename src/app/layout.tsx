'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, LogIn } from 'lucide-react';
import { useEffect, useRef } from 'react';
// Import fitur Anime.js V4
import { animate, spring, splitText, stagger } from 'animejs';
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const titleRef = useRef<HTMLSpanElement>(null);

  // Tentukan rute mana saja yang TIDAK boleh menampilkan Navbar Landing Page
  const isDashboardOrAdmin = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/check-in');

  // --- 1. FITUR: text.splitText() untuk Judul Header ---
  useEffect(() => {
    if (!isDashboardOrAdmin && titleRef.current) {
      // Pecah teks "RNHKBP KAYU PUTIH" menjadi karakter individu
      const { chars } = splitText(titleRef.current, { chars: true });
      
      // Animasikan setiap huruf meluncur naik secara berurutan (stagger)
      animate(chars, {
        opacity: [0, 1],
        y: [15, 0],
        delay: stagger(40),
        duration: 800,
        ease: 'outExpo'
      });
    }
  }, [isDashboardOrAdmin]);

  // --- 2. FITUR: easings.spring() untuk Feedback Tombol (Tactile Effect) ---
  const handleSpringClick = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, {
      scale: state === 'down' ? 0.94 : 1,
      duration: 400,
      ease: spring({ bounce: 0.45 }) // Efek membal premium
    });
  };

  return (
    // Tetap gunakan suppressHydrationWarning untuk menghindari error ekstensi browser
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        
        {!isDashboardOrAdmin && (
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-[#1e40af] p-1.5 rounded-lg text-white">
                  <ShieldCheck size={20} />
                </div>
                {/* Teks diganti dan diberi ref untuk splitText */}
                <span 
                  ref={titleRef}
                  className="font-extrabold text-xl tracking-tighter text-[#0f172a] uppercase"
                >
                  RNHKBP KAYU PUTIH
                </span>
              </div>
              
              <nav className="flex items-center gap-8">
                {/* Tombol Registrasi dengan efek Spring */}
                <Link 
                  href="/register" 
                  onMouseDown={(e) => handleSpringClick(e, 'down')}
                  onMouseUp={(e) => handleSpringClick(e, 'up')}
                  onMouseLeave={(e) => animate(e.currentTarget, { scale: 1, duration: 200 })}
                  className="text-xs font-bold text-slate-500 hover:text-[#1e40af] uppercase tracking-widest transition-colors"
                >
                  Registrasi
                </Link>
                
                {/* Tombol Sign In dengan efek Spring dan Shadow */}
                <Link 
                  href="/login"
                  onMouseDown={(e) => handleSpringClick(e, 'down')}
                  onMouseUp={(e) => handleSpringClick(e, 'up')}
                  onMouseLeave={(e) => animate(e.currentTarget, { scale: 1, duration: 200 })}
                  className="flex items-center gap-2 bg-[#0f172a] text-white px-6 py-2.5 rounded-xl font-bold text-[11px] tracking-widest hover:bg-slate-800 transition-all shadow-md active:shadow-none"
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