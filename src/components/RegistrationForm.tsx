'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Info, CheckCircle } from 'lucide-react';
import { useRegistrationData } from '@/hooks/useRegistrationData';
import { RegistrationStep1 } from './RegistrationStep1';
import { RegistrationStep2 } from './RegistrationStep2';
import { RegistrationStep3 } from './RegistrationStep3';

const STEPS = [
  { id: 1, title: 'Member Details', subtitle: 'Step 1' },
  { id: 2, title: 'Service & Talent', subtitle: 'Step 2' },
  { id: 3, title: 'Review & Confirm', subtitle: 'Step 3' },
];

interface RegistrationFormProps {
  prefixCls?: string;
}

export default function RegistrationForm({ prefixCls = 'rc-reg' }: RegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  const { wijks, skills, occupations } = useRegistrationData();

  const [formData, setFormData] = useState({
    nama_lengkap: '', id_wijk: '', email: '', password: '',
    no_telp: '', tanggal_lahir: '', alamat: '',
    id_kategori_kesibukan: '', keahlian: [] as string[], consent_pdp: false
  });

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
    return <SuccessView prefixCls={prefixCls} />;
  }

  return (
    <main className={`${prefixCls}-container h-screen w-screen m-0 p-0 flex flex-col md:flex-row bg-[#050c18] font-sans selection:bg-[#c5a059]/30 overflow-hidden`}>
      <SideVisual prefixCls={prefixCls} />

      <div className={`${prefixCls}-form-wrapper w-full md:w-1/2 flex flex-col bg-[#050c18] relative h-auto md:h-screen overflow-y-auto custom-scrollbar shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-10`}>
        <HeaderView prefixCls={prefixCls} />
        <Stepper currentStep={currentStep} prefixCls={prefixCls} />

        <AnimatePresence>
          {error && <ErrorAlert error={error} />}
        </AnimatePresence>

        <div className={`${prefixCls}-content flex-1 px-8 md:px-14 pb-8`}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <RegistrationStep1 formData={formData} wijks={wijks} onChange={handleInputChange} onNext={handleNextStep1} prefixCls={prefixCls} />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <RegistrationStep2 formData={formData} occupations={occupations} skills={skills} onInputChange={handleInputChange} onKeahlianChange={handleKeahlianChange} onNext={handleNextStep2} onPrev={prevStep} prefixCls={prefixCls} />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <RegistrationStep3 formData={formData} loading={loading} onPrev={prevStep} onSubmit={handleSubmit} onConsentChange={(e) => setFormData({...formData, consent_pdp: e.target.checked})} prefixCls={prefixCls} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <FooterView prefixCls={prefixCls} />
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

function SuccessView({ prefixCls }: { prefixCls: string }) {
  return (
    <div className={`${prefixCls}-success h-screen w-full bg-[#050c18] flex items-center justify-center p-6 selection:bg-[#c5a059]/30 font-sans`}>
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

function SideVisual({ prefixCls }: { prefixCls: string }) {
  return (
    <div className={`${prefixCls}-visual relative w-full md:w-1/2 h-[40vh] md:h-screen shrink-0`}>
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
  );
}

function HeaderView({ prefixCls }: { prefixCls: string }) {
  return (
    <div className={`${prefixCls}-header p-8 md:p-12 flex flex-col items-center text-center border-b border-white/5 shrink-0`}>
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
  );
}

function Stepper({ currentStep, prefixCls }: { currentStep: number; prefixCls: string }) {
  return (
    <div className={`${prefixCls}-stepper px-8 py-8 md:px-14 shrink-0`}>
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
  );
}

function ErrorAlert({ error }: { error: string }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-8 md:px-14 mb-4">
      <div className="p-4 bg-red-950/40 border border-red-900/50 rounded flex items-start gap-3 text-red-400 text-[10px] font-bold uppercase tracking-widest">
        <Info size={16} className="shrink-0" /> <span className="leading-relaxed">{error}</span>
      </div>
    </motion.div>
  );
}

function FooterView({ prefixCls }: { prefixCls: string }) {
  return (
    <div className={`${prefixCls}-footer p-8 md:p-14 mt-auto border-t border-white/5 flex flex-wrap justify-center gap-4 text-[9px] uppercase tracking-[0.3em] text-white/30 font-bold shrink-0`}>
      <span>© {new Date().getFullYear()} RNHKBP Kayu Putih</span>
      <span className="hidden md:inline">•</span>
      <a href="#" className="hover:text-[#c5a059] transition-colors">Privacy Policy</a>
    </div>
  );
}
