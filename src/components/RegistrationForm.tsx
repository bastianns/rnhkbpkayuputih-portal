'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Lock, ChevronDown, User, Info, 
  CheckCircle, Mail, Phone, MapPin, Loader2, ArrowRight, ShieldCheck
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Member Details', subtitle: 'Step 1' },
  { id: 2, title: 'Service & Talent', subtitle: 'Step 2' },
  { id: 3, title: 'Review & Confirm', subtitle: 'Step 3' },
];

export default function RegistrationForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wijks, setWijks] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [occupations, setOccupations] = useState<any[]>([]);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nama_lengkap: '', id_wijk: '', email: '', password: '',
    no_telp: '', tanggal_lahir: '', alamat: '',
    id_kategori_kesibukan: '', keahlian: [] as string[], consent_pdp: false
  });

  useEffect(() => {
    async function fetchReferenceData() {
      const { data: w } = await supabase.from('wijk').select('*').order('nama_wijk');
      const { data: s } = await supabase.from('ref_keahlian').select('*').order('nama_keahlian');
      const { data: o } = await supabase.from('ref_kategori_kesibukan').select('*').order('nama_kategori');
      if (w) setWijks(w); if (s) setSkills(s); if (o) setOccupations(o);
    }
    fetchReferenceData();
  }, []);

  const handleInputChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleKeahlianChange = (id: string) => {
    setFormData(prev => ({
      ...prev, keahlian: prev.keahlian.includes(id) ? prev.keahlian.filter(k => k !== id) : [...prev.keahlian, id]
    }));
  };

  const handleNextStep1 = () => {
    if (!formData.nama_lengkap || !formData.email || !formData.password || !formData.id_wijk) {
      setError("Mohon lengkapi Nama, Email, Password, dan Wijk sebelum melanjutkan.");
      return;
    }
    setError(null); setCurrentStep(2);
  };

  const handleNextStep2 = () => { setError(null); setCurrentStep(3); };
  const prevStep = () => { setError(null); setCurrentStep((prev) => Math.max(prev - 1, 1)); };

  const handleSubmit = async () => {
    if (!formData.consent_pdp) {
      setError("Anda harus menyetujui kebijakan UU PDP untuk melanjutkan.");
      return;
    }
    setLoading(true); setError(null);

    try {
      const emailFormatted = formData.email.toLowerCase().trim();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailFormatted, password: formData.password,
        options: { data: { full_name: formData.nama_lengkap } }
      });
      if (authError) throw new Error(authError.message);

      const authId = authData.user?.id;
      const { password, consent_pdp, ...rawData } = formData;
      const finalPayload = { ...rawData, email: emailFormatted, id_auth: authId };

      const { error: submitError } = await supabase
        .from('quarantine_anggota')
        .insert([{ raw_data: finalPayload, status: 'pending' }]);

      if (submitError) throw submitError;
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Gagal mengirim data pendaftaran.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="h-screen w-full bg-[#050c18] flex items-center justify-center p-6 selection:bg-[#c5a059]/30 font-sans">
        <div className="max-w-md w-full bg-[#050c18] border border-[#c5a059]/30 p-12 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center space-y-8 relative overflow-hidden">
          <div className="inline-flex p-6 bg-[#c5a059]/10 text-[#c5a059] rounded-full border border-[#c5a059]/20 shadow-inner">
            <CheckCircle size={56} />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-serif italic text-white">Registration Complete</h2>
            <p className="text-xs font-medium text-white/50 leading-relaxed uppercase tracking-widest">
              Data Anda telah masuk ke sistem <span className="text-[#c5a059]">Quarantine</span>. Admin akan melakukan validasi SSOT segera.
            </p>
          </div>
          <button onClick={() => window.location.href = '/login'} className="w-full py-4 bg-[#c5a059] hover:bg-[#A68545] text-[#050c18] font-bold tracking-[0.2em] uppercase text-xs transition-all rounded-md">
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  /* KUNCI FULLSCREEN: Menggunakan h-screen dan w-full tanpa padding (p-0) pada main element */
  return (
    <main className="h-screen w-screen m-0 p-0 flex flex-col md:flex-row bg-[#050c18] font-sans selection:bg-[#c5a059]/30 overflow-hidden">
      
      {/* KIRI: Gambar Penuh Tanpa Margin */}
      <div className="relative w-full md:w-1/2 h-[40vh] md:h-screen shrink-0">
        <img
          src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop"
          alt="Choir"
          className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[20%] brightness-75"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050c18] via-[#050c18]/40 to-transparent md:bg-gradient-to-r" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
            <h2 className="font-serif italic text-4xl md:text-5xl lg:text-6xl text-[#c5a059] leading-tight mb-6 drop-shadow-2xl">
              &ldquo;Let everything that has breath praise the Lord. Praise the Lord.&rdquo;
            </h2>
            <div className="w-16 h-1 bg-[#c5a059] mx-auto mb-5 opacity-60"></div>
            <p className="font-serif italic text-xl md:text-2xl text-[#c5a059]/90 tracking-wider">— Psalm 150:6</p>
          </motion.div>
        </div>
      </div>

      {/* KANAN: Form Penuh Tanpa Margin */}
      <div className="w-full md:w-1/2 flex flex-col bg-[#050c18] relative h-auto md:h-screen overflow-y-auto custom-scrollbar shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-10">
        
        {/* Header */}
        <div className="p-8 md:p-12 flex flex-col items-center text-center border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 relative flex items-center justify-center border-2 border-[#c5a059] rotate-45 shadow-[0_0_20px_rgba(197,160,89,0.15)]">
              <span className="text-[#c5a059] font-bold -rotate-45 text-xs tracking-widest">RNP</span>
            </div>
            <div className="text-left">
              <h1 className="font-serif text-2xl md:text-3xl text-white tracking-wide">Remaja Naposo</h1>
              <p className="text-[#c5a059] text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mt-1">HKBP Kayu Putih</p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="px-8 py-8 md:px-14 shrink-0">
          <div className="flex justify-between items-center relative">
            {STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center z-10 flex-1">
                <div className={`h-1 w-full mb-3 rounded-full transition-colors duration-500 ${currentStep >= step.id ? 'bg-[#c5a059] shadow-[0_0_10px_rgba(197,160,89,0.5)]' : 'bg-white/10'}`} />
                <span className={`text-[9px] md:text-[10px] uppercase tracking-[0.2em] mb-1 font-bold ${currentStep === step.id ? 'text-[#c5a059]' : 'text-white/40'}`}>
                  {step.subtitle}
                </span>
                <span className={`text-[10px] md:text-[11px] font-medium text-center tracking-wider uppercase ${currentStep === step.id ? 'text-white' : 'text-white/30'}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-8 md:px-14 mb-4">
              <div className="p-4 bg-red-950/40 border border-red-900/50 rounded flex items-start gap-3 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                <Info size={16} className="shrink-0" /> <span className="leading-relaxed">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        <div className="flex-1 px-8 md:px-14 pb-8">
          <AnimatePresence mode="wait">
            
            {/* STEP 1 */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="font-serif text-3xl text-white italic">Identitas Pribadi</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputBlock label="Nama Lengkap (KTP)" name="nama_lengkap" icon={<User size={16}/>} value={formData.nama_lengkap} onChange={handleInputChange} />
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.2em]">Pilih Wijk</label>
                    <div className="relative group">
                      <select name="id_wijk" value={formData.id_wijk} onChange={handleInputChange} className="w-full bg-[#0a192f]/30 border border-[#c5a059]/30 rounded-md pl-10 pr-4 py-3.5 text-sm text-white appearance-none focus:outline-none focus:border-[#c5a059] focus:bg-[#0a192f]/60 transition-colors cursor-pointer group-hover:border-[#c5a059]/60">
                        <option value="" className="bg-[#050c18] text-white/50">-- Pilih Wilayah --</option>
                        {wijks.map(w => <option key={w.id_wijk} value={w.id_wijk} className="bg-[#050c18]">{w.nama_wijk}</option>)}
                      </select>
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5a059]/50" />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5a059] pointer-events-none" />
                    </div>
                  </div>

                  <InputBlock label="Email Aktif" name="email" type="email" icon={<Mail size={16}/>} value={formData.email} onChange={handleInputChange} />
                  <InputBlock label="Password Portal" name="password" type="password" icon={<Lock size={16}/>} value={formData.password} onChange={handleInputChange} />
                  <InputBlock label="No. WhatsApp" name="no_telp" type="tel" icon={<Phone size={16}/>} value={formData.no_telp} onChange={handleInputChange} />
                  <InputBlock label="Tanggal Lahir" name="tanggal_lahir" type="date" icon={<Calendar size={16}/>} value={formData.tanggal_lahir} onChange={handleInputChange} />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.2em]">Alamat Domisili</label>
                  <textarea name="alamat" value={formData.alamat} onChange={handleInputChange} className="w-full bg-[#0a192f]/30 border border-[#c5a059]/30 rounded-md px-4 py-4 text-sm text-white focus:outline-none focus:border-[#c5a059] focus:bg-[#0a192f]/60 transition-colors min-h-[100px] resize-none" placeholder="Alamat lengkap saat ini..."/>
                </div>

                <button onClick={handleNextStep1} className="w-full relative group overflow-hidden border border-[#c5a059] rounded-md py-4 mt-6 transition-all duration-300 hover:bg-[#c5a059]/10 hover:shadow-[0_0_20px_rgba(197,160,89,0.2)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#c5a059]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="relative flex justify-center items-center gap-2 text-[11px] font-bold text-[#c5a059] uppercase tracking-[0.3em]">Selanjutnya <ArrowRight size={14} /></span>
                </button>
              </motion.div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="text-center mb-6">
                  <h3 className="font-serif text-3xl text-white italic">Pelayanan & Talenta</h3>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.2em]">Kategori Kesibukan Saat Ini</label>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {occupations.map((o) => (
                      <label key={o.id_kategori_kesibukan} className="flex flex-col items-center gap-2 p-5 border border-[#c5a059]/20 bg-[#0a192f]/20 rounded-md cursor-pointer hover:bg-[#c5a059]/10 transition-all has-[:checked]:border-[#c5a059] has-[:checked]:bg-[#c5a059]/10 group">
                        <input type="radio" name="id_kategori_kesibukan" value={o.id_kategori_kesibukan} checked={formData.id_kategori_kesibukan === o.id_kategori_kesibukan} onChange={handleInputChange} className="hidden" />
                        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-white/50 group-has-[:checked]:text-[#c5a059] text-center leading-relaxed">{o.nama_kategori}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <label className="text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.2em]">Keahlian Khusus (Bisa Pilih &gt; 1)</label>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {skills.map((s) => (
                      <label key={s.id_keahlian} className="flex items-center gap-4 p-4 border border-[#c5a059]/20 bg-[#0a192f]/20 rounded-md cursor-pointer hover:bg-[#c5a059]/10 transition-all has-[:checked]:border-[#c5a059]">
                        <input type="checkbox" checked={formData.keahlian.includes(s.id_keahlian)} onChange={() => handleKeahlianChange(s.id_keahlian)} className="w-5 h-5 rounded border-[#c5a059]/50 bg-transparent text-[#c5a059] focus:ring-[#c5a059] focus:ring-offset-[#050c18] cursor-pointer" />
                        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-white/70">{s.nama_keahlian}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 w-full pt-8">
                  <button onClick={prevStep} className="flex-1 py-4 border border-white/20 text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] rounded-md hover:bg-white/5 transition-colors">Kembali</button>
                  <button onClick={handleNextStep2} className="flex-[2] py-4 bg-[#c5a059] text-[#050c18] font-bold text-[10px] uppercase tracking-[0.3em] rounded-md hover:bg-[#A68545] transition-colors shadow-[0_0_20px_rgba(197,160,89,0.2)]">Review Data</button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="text-center mb-6">
                  <CheckCircle className="w-12 h-12 text-[#c5a059] mx-auto mb-4 opacity-80" />
                  <h3 className="font-serif text-3xl text-white italic">Review & Confirm</h3>
                </div>

                <div className="w-full bg-[#0a192f]/30 p-6 md:p-8 rounded-lg border border-[#c5a059]/20 text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-white/70 space-y-5">
                  <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-[#c5a059]">Nama Lengkap:</span> <span className="text-right">{formData.nama_lengkap || '-'}</span></div>
                  <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-[#c5a059]">Email Login:</span> <span className="text-right lowercase">{formData.email || '-'}</span></div>
                  <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-[#c5a059]">WhatsApp:</span> <span className="text-right">{formData.no_telp || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-[#c5a059]">Jml. Keahlian:</span> <span className="text-right">{formData.keahlian.length} Dipilih</span></div>
                </div>

                <div className="p-6 border border-[#c5a059]/30 rounded-lg bg-[#c5a059]/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#c5a059]"></div>
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck className="text-[#c5a059]" size={20} />
                    <h3 className="text-[11px] font-bold text-[#c5a059] uppercase tracking-widest">Kepatuhan UU PDP</h3>
                  </div>
                  <p className="text-[9px] md:text-[10px] font-medium text-white/60 leading-relaxed uppercase tracking-widest mb-6">Sesuai UU PDP No. 27/2022, data Anda hanya digunakan untuk kepentingan internal database RNHKBP Kayu Putih.</p>
                  <label className="flex items-center gap-4 cursor-pointer group w-fit">
                    <input type="checkbox" checked={formData.consent_pdp} onChange={(e) => setFormData({...formData, consent_pdp: e.target.checked})} className="w-5 h-5 rounded border-[#c5a059]/50 bg-transparent text-[#c5a059] focus:ring-[#c5a059] focus:ring-offset-[#050c18] cursor-pointer" />
                    <span className="text-[10px] md:text-[11px] font-bold uppercase text-[#c5a059] group-hover:underline tracking-[0.2em]">Saya Setuju & Mengerti</span>
                  </label>
                </div>

                <div className="flex gap-4 w-full pt-4">
                  <button onClick={prevStep} disabled={loading} className="flex-1 py-4 border border-white/20 text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] rounded-md hover:bg-white/5 transition-colors disabled:opacity-50">Kembali</button>
                  <button onClick={handleSubmit} disabled={loading} className="flex-[2] py-4 bg-[#c5a059] text-[#050c18] font-bold text-[10px] md:text-[11px] uppercase tracking-[0.3em] rounded-md hover:bg-[#A68545] transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_30px_rgba(197,160,89,0.3)]">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Kirim Registrasi'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-8 md:p-14 mt-auto border-t border-white/5 flex flex-wrap justify-center gap-4 text-[9px] uppercase tracking-[0.3em] text-white/30 font-bold shrink-0">
          <span>© {new Date().getFullYear()} RNHKBP Kayu Putih</span>
          <span className="hidden md:inline">•</span>
          <a href="#" className="hover:text-[#c5a059] transition-colors">Privacy Policy</a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(197, 160, 89, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(197, 160, 89, 0.6); }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.8) sepia(1) hue-rotate(15deg) saturate(300%); cursor: pointer; }
      `}} />
    </main>
  );
}

function InputBlock({ label, name, type = "text", value, onChange, icon }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.2em]">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5a059]/50 group-focus-within:text-[#c5a059] transition-colors pointer-events-none">{icon}</div>
        <input required name={name} type={type} value={value} onChange={onChange} className="w-full bg-[#0a192f]/30 border border-[#c5a059]/30 rounded-md pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#c5a059] focus:bg-[#0a192f]/60 transition-colors placeholder:text-white/20" />
      </div>
    </div>
  );
}