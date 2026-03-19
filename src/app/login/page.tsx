'use client';

import React, { useState, Suspense, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { animate, createTimeline, spring, waapi, splitText, stagger } from 'animejs';
import Link from 'next/link';
import { Cross, Loader2, AlertCircle, CheckCircle2, Mail, Lock, ArrowRight } from 'lucide-react';

// ─────────────────────────────────────────────────────────
// Ornate Corner Accent
// ─────────────────────────────────────────────────────────
function CornerAccent({ position }: { position: 'tl' | 'br' }) {
  const isTL = position === 'tl';
  return (
    <div
      className={`absolute w-8 h-8 ${
        isTL
          ? 'top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl'
          : 'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl'
      } border-[#C5A059]/40`}
    />
  );
}

// ─────────────────────────────────────────────────────────
// Input Field Component
// ─────────────────────────────────────────────────────────
interface InputFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  isAdmin?: boolean;
}

function InputField({ label, type, value, onChange, placeholder, icon, isAdmin }: InputFieldProps) {
  return (
    <div className="auth-input-group space-y-2">
      <label
        className={`text-[9px] tracking-[0.2em] uppercase font-black ${
          isAdmin ? 'text-[#C5A059]' : 'text-[#C5A059]/60'
        }`}
      >
        {label}
      </label>
      <div className="relative">
        <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isAdmin ? 'text-[#C5A059]/40' : 'text-white/20'}`}>
          {icon}
        </span>
        <input
          required
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl pl-12 pr-4 py-4 text-sm text-white outline-none transition-all placeholder:text-white/10 focus:ring-1 ${
            isAdmin
              ? 'bg-[#C5A059]/5 border border-[#C5A059]/20 focus:border-[#C5A059] focus:ring-[#C5A059]/20'
              : 'bg-white/5 border border-white/10 focus:border-[#C5A059] focus:ring-[#C5A059]/10'
          }`}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Notification Banner
// ─────────────────────────────────────────────────────────
function Notification({ type, message }: { type: 'error' | 'success'; message: string }) {
  const isError = type === 'error';
  return (
    <div
      className={`p-4 rounded-lg flex items-start gap-3 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2 ${
        isError
          ? 'bg-red-950/30 border border-red-500/30 text-red-400'
          : 'bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059]'
      }`}
    >
      {isError ? <AlertCircle size={16} className="shrink-0 mt-px" /> : <CheckCircle2 size={16} className="shrink-0 mt-px" />}
      <span>{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Login Content
// ─────────────────────────────────────────────────────────
function LoginContent() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  const router       = useRouter();
  const searchParams = useSearchParams();

  const titleRef  = useRef<HTMLHeadingElement>(null);
  const cardRef   = useRef<HTMLDivElement>(null);
  const logoRef   = useRef<HTMLDivElement>(null);
  const bgRayRef  = useRef<HTMLDivElement>(null);
  const btnRef    = useRef<HTMLButtonElement>(null);

  const nextPath      = searchParams.get('next') || '/dashboard';
  const isSystemAdmin = email.toLowerCase().endsWith('@rnhkbp.com');

  // ── FITUR 1: WAAPI Background Pulse ──────────────────────────
    useEffect(() => {
      if (!bgRayRef.current) return;
      const rayAnim = waapi.animate(bgRayRef.current, {
        rotate    : ['0deg', '360deg'],
        opacity   : [0.05, 0.1, 0.05],
        duration  : 20000,
        iterations: Infinity,
        easing    : 'linear',
      });

      // Tambahkan kurung kurawal di sini
      return () => {
        rayAnim?.cancel();
      };
    }, []);

  // ── FITUR 2: BULLETPROOF Entry Choreography ──────────────────
  useEffect(() => {
    // 1. Sembunyikan elemen secara manual saat pertama kali mount
    if (logoRef.current) logoRef.current.style.opacity = '0';
    if (cardRef.current) cardRef.current.style.opacity = '0';
    if (btnRef.current) btnRef.current.style.opacity = '0';
    const initialInputs = Array.from(document.querySelectorAll('.auth-input-group'));
    initialInputs.forEach(el => ((el as HTMLElement).style.opacity = '0'));

    const timer = setTimeout(() => {
      // 2. Ambil Node secara aman
      const logoNode  = logoRef.current;
      const cardNode  = cardRef.current;
      const titleNode = titleRef.current;
      const btnNode   = btnRef.current;

      // Jika satu saja tidak ada, batalkan animasi (mencegah crash)
      if (!logoNode || !cardNode || !titleNode || !btnNode) return;

      // 3. Pencegahan double-split saat Hot Reload (Tanpa menyentuh innerText React)
      let splitChars: any[] = [];
      if (!titleNode.dataset.split) {
        const split = splitText(titleNode, { chars: true });
        if (split && split.chars) splitChars = split.chars;
        titleNode.dataset.split = "true";
      } else {
        // Jika sudah pernah di-split, tangkap kembali elemen spannya
        splitChars = Array.from(titleNode.querySelectorAll('span'));
      }

      // 4. Bangun Timeline dengan validasi panjang target (length > 0)
      const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1200 } });
      
      tl.add(logoNode, { opacity: [0, 1], y: [-30, 0], scale: [0.8, 1] })
        .add(cardNode, { opacity: [0, 1], y: [40, 0] }, '<-=800');

      // Wajib cek panjang array sebelum add ke Anime.js!
      if (splitChars.length > 0) {
        tl.add(splitChars, {
          opacity : [0, 1],
          y       : [20, 0],
          rotateX : [90, 0],
          delay   : stagger(50),
        }, '<-=1000');
      }

      const currentInputs = Array.from(document.querySelectorAll('.auth-input-group'));
      if (currentInputs.length > 0) {
        tl.add(currentInputs, {
          opacity: [0, 1],
          x      : [-20, 0],
          delay  : stagger(100),
        }, '<-=800');
      }

      tl.add(btnNode, { opacity: [0, 1], scale: [0.9, 1] }, '<-=900');

    }, 200); // 200ms memberikan kepastian DOM sudah dicat penuh oleh browser

    return () => clearTimeout(timer);
  }, []);

  // ── FITUR 3: Tactile Spring Feedback ─────────────────────────
  const handleSpringBtn = (e: React.MouseEvent<HTMLButtonElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, {
      scale   : state === 'down' ? 0.96 : 1,
      duration: 400,
      ease    : spring({ bounce: 0.4 }),
    });
  };

  // ── Login Handler ─────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSystemAdmin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push('/admin');
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo : `${window.location.origin}/auth/callback?next=${nextPath}`,
            shouldCreateUser: false,
          },
        });
        if (otpError) throw otpError;
        setMessage('Tautan akses telah dikirim ke email Anda. Silakan periksa inbox atau folder spam.');
      }
    } catch (err: any) {
      setError(
        err.message.includes('Signups not allowed')
          ? 'Email tidak terdaftar. Silakan registrasi terlebih dahulu.'
          : err.message || 'Gagal melakukan autentikasi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#051122] overflow-hidden font-sans relative selection:bg-[#C5A059]/30">

      {/* ── WAAPI Background Ray ── */}
      <div ref={bgRayRef} className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-10">
        <div className="w-[150vmax] h-[150vmax] rounded-full bg-gradient-conic from-transparent via-[#C5A059]/20 to-transparent blur-3xl" />
      </div>

      {/* ── LEFT SIDE: Hero Image ── */}
      <div className="relative w-full md:w-1/2 h-[35vh] md:h-screen overflow-hidden z-10">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#051122]/60 to-[#051122] md:bg-gradient-to-r md:from-transparent md:to-[#051122] z-10" />
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#051122_100%)] z-10 opacity-60" />

        <img
          src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop"
          alt="RNHKBP Community"
          className="absolute inset-0 w-full h-full object-cover grayscale-[20%] brightness-50"
        />

        <div className="absolute bottom-10 left-8 md:bottom-20 md:left-16 z-20">
          <p className="text-[9px] font-bold tracking-[0.4em] text-[#C5A059]/70 uppercase mb-3">
            RNHKBP Kayu Putih
          </p>
          <h2 className="font-serif font-bold italic text-4xl md:text-6xl text-white leading-tight mb-5 drop-shadow-2xl">
            Faith in Action, <br />
            <span className="text-[#C5A059]">United in Purpose.</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-16 h-[2px] bg-[#C5A059]" />
            <div className="w-2 h-2 rounded-full bg-[#C5A059]/60" />
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE: Form ── */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-16 bg-transparent z-10">

        {/* Logo */}
        <div ref={logoRef} className="flex flex-col items-center mb-8">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-[#C5A059] shadow-[0_0_30px_rgba(197,160,89,0.15)]" />
            <div className="absolute inset-[3px] rounded-full bg-[#C5A059]/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Cross className="text-[#C5A059] w-7 h-7" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-[0.3em] text-[#C5A059] uppercase">
            RNHKBP
          </h1>
          <p className="text-[9px] font-bold tracking-[0.3em] text-[#C5A059]/60 uppercase">
            Kayu Putih Youth Ministry
          </p>
        </div>

        {/* Card */}
        <div
          ref={cardRef}
          className="w-full max-w-md border border-[#C5A059]/20 rounded-2xl p-8 md:p-12 relative backdrop-blur-xl bg-[#0a192f]/40 shadow-[0_32px_64px_rgba(0,0,0,0.4)]"
        >
          <CornerAccent position="tl" />
          <CornerAccent position="br" />

          {/* Card Header */}
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.4em] text-[#C5A059]/60 uppercase mb-2">
              RNHKBP KAYU PUTIH
            </p>
            {/* Wrapper judul untuk perspective 3D */}
            <div style={{ perspective: '800px' }} className="overflow-hidden">
              <h3
                ref={titleRef}
                className="font-serif italic text-3xl text-white uppercase tracking-tight"
              >
                Identity Access
              </h3>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">

            {/* Notifications */}
            {error   && <Notification type="error"   message={error} />}
            {message && <Notification type="success" message={message} />}

            {/* Email Field */}
            <InputField
              label="Email Identity"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="jemaat@rnhkbp.com"
              icon={<Mail size={18} />}
            />

            {/* Password Field — hanya tampil jika admin */}
            {isSystemAdmin && (
              <div className="animate-in fade-in slide-in-from-left-4">
                <InputField
                  label="Admin Credentials"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  icon={<Lock size={18} />}
                  isAdmin
                />
              </div>
            )}

            <button
              ref={btnRef}
              type="submit"
              disabled={loading}
              onMouseDown={(e) => handleSpringBtn(e, 'down')}
              onMouseUp={(e)   => handleSpringBtn(e, 'up')}
              onMouseLeave={(e) => animate(e.currentTarget, { scale: 1, duration: 200 })}
              className="w-full bg-[#C5A059] text-[#051122] font-black py-4 rounded-xl uppercase tracking-[0.2em] text-[11px] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d4b46a] transition-colors"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {isSystemAdmin ? 'Administrator Sign In' : 'Request Access Link'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">
              New Member?{' '}
              <Link
                href="/register"
                className="text-[#C5A059] hover:text-white transition-colors ml-1 underline decoration-[#C5A059]/30 underline-offset-4"
              >
                Register Identity
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-12 text-[9px] tracking-[0.3em] text-white/20 uppercase font-bold text-center">
          &copy; {new Date().getFullYear()} RNHKBP Kayu Putih. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page Export — dibungkus Suspense untuk useSearchParams()
// ─────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#051122] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#C5A059]" size={32} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}