'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Send
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
  const nextPath = searchParams.get('next') || '/';

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
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError("Kredensial Admin tidak valid.");
          setLoading(false);
          return;
        }

        const userId = authData.user?.id;

        // Pencatatan Audit Trail
        await supabase.from('audit_log').insert({
          actor_id: userId,
          action: 'ADMIN_LOGIN',
          entity: 'system_access',
          entity_id: userId,
          new_data: { 
            role: 'ADMIN_INTERNAL',
            access_type: 'FULL_CONTROL',
            login_at: new Date().toISOString() 
          }
        });

        // Redirect ke 'next' jika ada, jika tidak ke /admin
        router.push(nextPath !== '/' ? nextPath : '/admin');
      } else {
        // --- ALUR B: ANGGOTA (Jemaat) ---
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            // Menyisipkan parameter 'next' ke dalam callback agar tidak looping
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${nextPath}`,
            // GEMBOK KEAMANAN: Jangan buat user baru secara otomatis jika belum terdaftar/diverifikasi
            shouldCreateUser: false 
          },
        });

        if (otpError) {
          // Tangkap error spesifik jika user tidak ditemukan di sistem (ditolak karena shouldCreateUser: false)
          if (otpError.message.includes('Signups not allowed') || otpError.message.toLowerCase().includes('not found') || otpError.status === 400) {
            setError("Akses Ditolak: Email belum terdaftar di SSOT atau masih dalam antrean verifikasi Admin.");
          } else if (otpError.status === 429) {
            setError("Terlalu banyak permintaan. Silakan tunggu 1 jam atau gunakan email lain.");
          } else {
            setError(otpError.message || "Gagal mengirim tautan. Pastikan email Anda sudah terdaftar dan diverifikasi.");
          }
          setLoading(false);
          return;
        }

        setMessage("Tautan akses telah dikirim! Periksa kotak masuk Email atau WhatsApp Anda.");
      }
    } catch (err) {
      setError("Terjadi kesalahan sinkronisasi sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f6f7f8] flex items-center justify-center p-6 font-sans overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#d0dbe7_1px,transparent_1px)] [background-size:32px_32px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500 text-left">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-[#197fe6] rounded-2xl shadow-xl shadow-blue-100 mb-4">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-[#0e141b] uppercase tracking-tighter leading-none">
            SSOT <span className="text-[#197fe6]">Access</span>
          </h1>
          <p className="text-[10px] font-bold text-[#4e7397] uppercase tracking-widest italic leading-relaxed">
            RNHKBP Kayu Putih — Identity Vetting Portal
          </p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-white">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4e7397] uppercase tracking-[0.2em] ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#197fe6] transition-colors" size={18} />
                  <input 
                    required 
                    type="email" 
                    placeholder="nama@email.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#197fe6] transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {isSystemAdmin && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-[#4e7397] uppercase tracking-[0.2em] ml-1">
                    Admin Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#197fe6] transition-colors" size={18} />
                    <input 
                      required 
                      type="password" 
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#197fe6] transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                <AlertCircle className="text-red-500 shrink-0" size={16} />
                <p className="text-[10px] font-black text-red-500 uppercase leading-tight tracking-tight">
                  {error}
                </p>
              </div>
            )}

            {message && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
                <Send className="text-green-600 shrink-0" size={16} />
                <p className="text-[10px] font-black text-green-600 uppercase leading-tight tracking-tight">
                  {message}
                </p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#197fe6] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>{isSystemAdmin ? 'Login Administrator' : 'Kirim Tautan Akses'} <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        <div className="text-center space-y-1">
          <p className="text-[10px] text-[#4e7397] font-black uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} RNHKBP Kayu Putih — SSOT Project
          </p>
        </div>
      </div>
    </div>
  );
}

// Komponen utama menggunakan Suspense karena memakai useSearchParams
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}