'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  UserPlus, ShieldCheck, Loader2, ArrowRight, 
  CheckCircle2, Info, User, Mail, Phone, 
  Calendar, MapPin, Briefcase, Star, Lock
} from 'lucide-react';

export default function IdentityRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State untuk data referensi dari DB
  const [wijks, setWijks] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [occupations, setOccupations] = useState<any[]>([]);

  useEffect(() => {
    async function fetchReferenceData() {
      // Pastikan RLS sudah dibuka untuk tabel-tabel referensi ini
      const { data: w } = await supabase.from('wijk').select('*').order('nama_wijk');
      const { data: s } = await supabase.from('ref_keahlian').select('*').order('nama_keahlian');
      const { data: o } = await supabase.from('ref_kategori_kesibukan').select('*').order('nama_kategori');
      
      if (w) setWijks(w);
      if (s) setSkills(s);
      if (o) setOccupations(o);
    }
    fetchReferenceData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).toLowerCase().trim();
    const password = formData.get('password') as string;
    const nama_lengkap = formData.get('nama_lengkap') as string;

    try {
      // --- LANGKAH 1: SIGN UP KE SUPABASE AUTH ---
      // Ini menciptakan record di auth.users agar kita dapat UID-nya
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: nama_lengkap } // Menyimpan metadata tambahan
        }
      });

      // Ubah bagian ini di handleSubmit
      if (authError) {
        // Tambahkan ini untuk melihat pesan spesifik dari Supabase
        console.error("Detail Error Auth:", authError);
        throw new Error(`Gagal membuat akun akses: ${authError.message}`);
      }

      const authId = authData.user?.id;

      // --- LANGKAH 2: PREPARASI DATA UNTUK QUARANTINE ---
      const rawData = Object.fromEntries(formData.entries());
      
      // Keamanan: Hapus password dari payload JSON quarantine agar tidak tersimpan plain-text
      delete rawData.password; 
      
      // Ambil data keahlian (multiple checkbox)
      const keahlian = formData.getAll('keahlian');
      
      // Payload lengkap dengan id_auth untuk mempermudah Vetting Admin
      const finalPayload = { 
        ...rawData, 
        email, 
        id_auth: authId, // <--- KUNCI UTAMA SINKRONISASI
        keahlian 
      };

      // --- LANGKAH 3: INSERT KE QUARANTINE ---
      const { error: submitError } = await supabase
        .from('quarantine_anggota')
        .insert([{ 
          raw_data: finalPayload, 
          status: 'pending' 
        }]);

      if (submitError) throw submitError;

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Gagal mengirim data identitas ke sistem karantina.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl text-center space-y-6 animate-in zoom-in duration-500">
          <div className="inline-flex p-5 bg-emerald-50 text-emerald-600 rounded-full">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Vetting Started</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
            Akun Anda telah dibuat. Namun, profil Anda sedang ditahan di tabel <span className="text-blue-600 italic">quarantine</span>. Admin akan melakukan pengecekan duplikasi sebelum memindahkan identitas Anda ke basis data utama.
          </p>
          <button onClick={() => window.location.href = '/login'} className="w-full py-4 bg-[#197fe6] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f6f7f8] flex items-center justify-center p-6 font-sans overflow-y-auto py-20">
      <div className="relative z-10 max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-[#197fe6] rounded-2xl shadow-xl shadow-blue-100 mb-4">
            <UserPlus className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-[#0e141b] uppercase tracking-tighter leading-none">
            Identity <span className="text-[#197fe6]">Profiling</span>
          </h1>
          <p className="text-[10px] font-bold text-[#4e7397] uppercase tracking-[0.2em] italic">
            Single Source of Truth Registration — RNHKBP Kayu Putih
          </p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-white">
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* DATA IDENTITAS DASAR */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <User size={18} className="text-blue-600" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Identitas Utama & Akses</h2>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase">
                  <Info size={16} /> {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#4e7397] uppercase tracking-widest">Nama Lengkap (Sesuai KTP)</label>
                  <input required name="nama_lengkap" type="text" placeholder="SESUAI KTP" className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-xs focus:ring-2 focus:ring-[#197fe6] outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#4e7397] uppercase tracking-widest">Pilih Wijk</label>
                  <select required name="id_wijk" className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-xs focus:ring-2 focus:ring-[#197fe6] outline-none">
                    <option value="">-- PILIH WIJK --</option>
                    {wijks.map(w => <option key={w.id_wijk} value={w.id_wijk}>{w.nama_wijk}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#4e7397] uppercase tracking-widest">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input required name="email" type="email" placeholder="NAMA@EMAIL.COM" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-xs focus:ring-2 focus:ring-[#197fe6] outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#4e7397] uppercase tracking-widest">Password Akses Portal</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input required name="password" type="password" placeholder="MIN. 6 KARAKTER" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-xs focus:ring-2 focus:ring-[#197fe6] outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#4e7397] uppercase tracking-widest">No. WhatsApp</label>
                  <input required name="no_telp" type="tel" placeholder="0812..." className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-xs focus:ring-2 focus:ring-[#197fe6] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#4e7397] uppercase tracking-widest">Tanggal Lahir</label>
                  <input required name="tanggal_lahir" type="date" className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-xs focus:ring-2 focus:ring-[#197fe6] outline-none" />
                </div>
              </div>
              <div className="space-y-2 text-left">
                  <label className="text-[9px] font-black text-[#4e7397] uppercase tracking-widest">Alamat Domisili</label>
                  <textarea name="alamat" rows={2} placeholder="ALAMAT LENGKAP SAAT INI..." className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-xs focus:ring-2 focus:ring-[#197fe6] outline-none" />
              </div>
            </div>

            {/* SEKSI STRATEGIS */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Briefcase size={18} className="text-blue-600" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Variabel Pelayanan</h2>
              </div>
              <div className="space-y-4 text-left">
                <label className="text-[9px] font-black text-[#4e7397] uppercase tracking-widest">Kategori Kesibukan Saat Ini</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {occupations.map((o) => (
                    <label key={o.id_kategori_kesibukan} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors border-2 border-transparent has-[:checked]:border-blue-500 group">
                      <input type="radio" name="id_kategori_kesibukan" value={o.id_kategori_kesibukan} className="hidden" />
                      <span className="text-[10px] font-black uppercase text-slate-500 group-has-[:checked]:text-blue-600">{o.nama_kategori}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4 text-left">
                {/* FIX: Menggunakan &gt; agar tidak error parsing JSX */}
                <label className="text-[9px] font-black text-[#4e7397] uppercase tracking-widest">Keahlian Khusus (Bisa Pilih &gt;1)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {skills.map((s) => (
                    <label key={s.id_keahlian} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors border-2 border-transparent has-[:checked]:border-blue-500">
                      <input type="checkbox" name="keahlian" value={s.id_keahlian} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                      <span className="text-[10px] font-black uppercase text-slate-600">{s.nama_keahlian}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* UU PDP */}
            <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-blue-600" size={18} />
                <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">UU PDP No. 27 Tahun 2022</h3>
              </div>
              <p className="text-[9px] font-medium text-slate-500 leading-relaxed uppercase">
                Data akan dikelola secara internal untuk memori kolektif RNHKBP Kayu Putih sesuai aturan perlindungan data pribadi.
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input required type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest underline">Saya Setuju</span>
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#197fe6] text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Selesaikan Profil & Daftar <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}