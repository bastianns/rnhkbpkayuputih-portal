'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, Database, Users, BarChart3, 
  Settings, ClipboardList, Calendar, ShieldCheck, 
  LogOut, Loader2
} from 'lucide-react';

// ── Anime.js V4 Imports ──
import { animate, createTimeline, spring, stagger } from 'animejs';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // ── FITUR 1: Animasi Entry Sidebar ──
  useEffect(() => {
    const timer = setTimeout(() => {
      const navItems = Array.from(document.querySelectorAll('.anim-nav-item'));
      const profileCard = document.querySelector('.anim-profile-card');
      
      const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 800 } });
      
      if (navItems.length > 0) {
        tl.add(navItems, {
          opacity: [0, 1],
          x: [-15, 0],
          delay: stagger(60)
        });
      }
      
      if (profileCard) {
        tl.add(profileCard, { opacity: [0, 1], y: [15, 0] }, '<-=400');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh(); 
    } catch (error) {
      console.error("Gagal logout admin:", error);
      setIsLoggingOut(false);
    }
  };

  // ── Tactile Spring untuk Tombol Logout ──
  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.4 }) });
  };

  return (
    <aside ref={sidebarRef} className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between z-30 font-sans">
      <div className="flex flex-col">
        {/* Logo & Branding Section */}
        <div className="p-6 flex items-center gap-3">
          <div className="size-8 bg-[#197fe6] rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <ShieldCheck size={18} />
          </div>
          <div className="text-left">
            <h1 className="text-[#0e141b] text-sm font-black leading-tight uppercase tracking-tighter">Admin Portal</h1>
            <p className="text-[#4e7397] text-[10px] font-bold uppercase tracking-widest">RNHKBP Kayu Putih</p>
          </div>
        </div>

        {/* Menu Navigasi Utama */}
        <nav className="mt-4 px-3 space-y-1">
          <NavItem href="/admin" icon={<LayoutDashboard size={18}/>} label="Dashboard" active={pathname === '/admin'} />
          <NavItem href="/admin/records" icon={<Database size={18}/>} label="Master Records" active={pathname.startsWith('/admin/records')} />
          <NavItem href="/admin/events" icon={<Calendar size={18}/>} label="Events & Attend" active={pathname.startsWith('/admin/events')} />
          <NavItem href="/admin/queue" icon={<Users size={18}/>} label="Dedup Queue" active={pathname.startsWith('/admin/queue')} />
          <NavItem href="/admin/reports" icon={<BarChart3 size={18}/>} label="Analytics" active={pathname.startsWith('/admin/reports')} />
          <NavItem href="/admin/logs" icon={<ClipboardList size={18}/>} label="Audit Logs" active={pathname.startsWith('/admin/logs')} />
          <NavItem href="/admin/settings" icon={<Settings size={18}/>} label="Settings" active={pathname.startsWith('/admin/settings')} />
        </nav>
      </div>

      {/* Admin Profile Footer + Log Out Button */}
      <div className="p-4 border-t border-slate-50 space-y-2 anim-profile-card" style={{ opacity: 0 }}>
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
          <div className="size-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-[10px]">
            AD
          </div>
          <div className="flex flex-col overflow-hidden text-left">
            <p className="text-xs font-black truncate text-[#0e141b] uppercase">Admin SSOT</p>
            <p className="text-[10px] text-[#4e7397] font-bold uppercase tracking-tighter italic">Verified Steward</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          onMouseDown={(e) => handleSpringBtn(e, 'down')}
          onMouseUp={(e) => handleSpringBtn(e, 'up')}
          onMouseLeave={(e) => animate(e.currentTarget, { scale: 1, duration: 200 })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 font-bold text-sm transition-all disabled:opacity-50"
        >
          {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
          <span>{isLoggingOut ? 'Signing out...' : 'Keluar Sistem'}</span>
        </button>
      </div>
    </aside>
  );
}

// ── Sub Komponen NavItem dengan Tactile Spring ──
function NavItem({ icon, label, href, active }: { icon: any, label: string, href: string, active: boolean }) {
  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.95 : 1, duration: 400, ease: spring({ bounce: 0.4 }) });
  };

  return (
    <Link 
      href={href}
      onMouseDown={(e) => handleSpringBtn(e as any, 'down')}
      onMouseUp={(e) => handleSpringBtn(e as any, 'up')}
      onMouseLeave={(e) => animate(e.currentTarget, { scale: 1, duration: 200 })}
      className={`anim-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group block ${
        active 
          ? 'bg-blue-50 text-[#197fe6] shadow-sm border-l-4 border-[#197fe6]' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-[#197fe6]'
      }`}
      style={{ opacity: 0 }}
    >
      <span className={`${active ? 'text-[#197fe6]' : 'text-slate-400 group-hover:text-[#197fe6]'}`}>
        {icon}
      </span>
      <span className={`text-sm ${active ? 'font-bold' : 'font-medium'}`}>
        {label}
      </span>
    </Link>
  );
}