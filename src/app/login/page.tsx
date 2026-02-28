'use client';

import React, { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  Cross, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Lock 
} from 'lucide-react';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Menangkap parameter 'next' dari URL (misal: /check-in/id-kegiatan)
  const nextPath = searchParams.get('next') || '/dashboard';

  // Deteksi peran secara dinamis berdasarkan domain email
  const isSystemAdmin = email.toLowerCase().endsWith('@rnhkbp.com');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSystemAdmin) {
        // --- ALUR A: ADMINISTRATOR (@rnhkbp.com) ---
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        router.push('/admin');

      } else {
        // --- ALUR B: ANGGOTA JEMAAT (Magic Link) ---
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextPath}`,
            shouldCreateUser: false, // Proteksi SSOT: Hanya email terdaftar yang bisa login
          },
        });

        if (otpError) throw otpError;
        setMessage('Tautan akses suci telah dikirim ke email Anda. Silakan periksa kotak masuk atau spam.');
      }
    } catch (err: any) {
      if (err.message.includes('Signups not allowed')) {
        setError("Email tidak terdaftar dalam SSOT. Silakan registrasi terlebih dahulu.");
      } else {
        setError(err.message || "Gagal melakukan autentikasi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#051122] overflow-hidden font-sans selection:bg-[#C5A059]/30">
      
      {/* KIRI: Image and Quote */}
      <div className="relative w-full md:w-1/2 h-[40vh] md:h-screen overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#051122]/40 to-[#051122] md:bg-gradient-to-r md:from-transparent md:to-[#051122] z-10" />
        <img
          src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop"
          alt="Church Community"
          className="absolute inset-0 w-full h-full object-cover grayscale-[30%] brightness-50"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute bottom-12 left-8 md:bottom-20 md:left-16 z-20 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h2 className="font-serif font-bold italic text-4xl md:text-6xl text-white leading-tight mb-6 drop-shadow-2xl">
              Faith in Action, <br />
              <span className="text-[#C5A059]">United in Purpose.</span>
            </h2>
            <div className="w-12 h-1 bg-[#C5A059] mb-4"></div>
            <p className="font-serif italic text-lg text-white/70 tracking-widest">
              Matthew 5:16
            </p>
          </motion.div>
        </div>
      </div>

      {/* KANAN: Login Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 bg-[#051122]">
        
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="relative mb-5">
            <div className="w-16 h-16 border-2 border-[#C5A059] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(197,160,89,0.15)]">
              <Cross className="text-[#C5A059] w-7 h-7" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#C5A059] w-4 h-4 rounded-full border-2 border-[#051122]" />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.3em] text-[#C5A059] uppercase">RNHKBP</h1>
          <p className="text-[9px] font-bold tracking-[0.2em] text-[#C5A059]/70 uppercase mt-1">Kayu Putih Youth Ministry</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="w-full max-w-md border border-[#C5A059]/30 rounded-xl p-8 md:p-12 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(10, 25, 47, 0.4), rgba(5, 17, 34, 0.8))',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}
        >
          {/* Decorative Gold Border Corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#C5A059]/80 rounded-tl-xl opacity-70" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#C5A059]/80 rounded-tr-xl opacity-70" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#C5A059]/80 rounded-bl-xl opacity-70" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#C5A059]/80 rounded-br-xl opacity-70" />

          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl text-white mb-1">SSOT Portal</h2>
            <h3 className="font-serif italic text-lg text-[#C5A059]">Identity Access</h3>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            
            {/* Feedback Messages */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div className="p-4 bg-red-950/40 border border-red-900/50 rounded flex items-start gap-3 text-red-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    <AlertCircle size={16} className="shrink-0" /> <span className="leading-relaxed">{error}</span>
                  </div>
                </motion.div>
              )}
              {message && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <div className="p-4 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded flex items-start gap-3 text-[#C5A059] text-[10px] font-bold uppercase tracking-widest mb-4">
                    <CheckCircle2 size={16} className="shrink-0" /> <span className="leading-relaxed">{message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-[0.2em] text-white/50 uppercase font-bold">
                Alamat Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#C5A059] transition-colors" size={18} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jemaat@email.com"
                  className="w-full bg-[#051122]/50 border border-white/10 rounded-lg pl-12 pr-4 py-3.5 text-sm text-white focus:border-[#C5A059] focus:bg-[#051122] focus:ring-1 focus:ring-[#C5A059]/50 outline-none transition-all placeholder:text-white/20"
                />
              </div>
            </div>

            {/* Smart Password Field (Hanya muncul untuk Admin) */}
            <AnimatePresence>
              {isSystemAdmin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="block text-[10px] tracking-[0.2em] text-[#C5A059] uppercase font-bold mt-2">
                    Admin Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C5A059]/50 group-focus-within:text-[#C5A059] transition-colors" size={18} />
                    <input
                      required={isSystemAdmin}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#051122]/50 border border-[#C5A059]/30 rounded-lg pl-12 pr-4 py-3.5 text-sm text-white focus:border-[#C5A059] focus:bg-[#051122] focus:ring-1 focus:ring-[#C5A059] outline-none transition-all placeholder:text-white/20"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#C5A059] hover:bg-[#A68545] text-[#051122] font-black py-4 rounded-lg transition-all transform active:scale-[0.98] uppercase tracking-[0.2em] text-[11px] mt-6 flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                isSystemAdmin ? 'Login Administrator' : 'Kirim Tautan Akses'
              )}
            </button>
          </form>

          {/* Link ke Registrasi */}
          <div className="mt-8 text-center relative z-10">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
              Belum terdaftar di SSOT? {' '}
              <Link 
                href="/register"
                className="text-[#C5A059] hover:text-white transition-colors ml-1"
              >
                Registrasi
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center text-[9px] tracking-[0.3em] text-white/20 uppercase font-bold">
          &copy; {new Date().getFullYear()} RNHKBP Kayu Putih.<br className="md:hidden" /> All Rights Reserved.
        </div>
      </div>
    </div>
  );
}

// Wrapper Suspense wajib di Next.js App Router jika memakai useSearchParams()
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#051122] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#C5A059]" size={32} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}