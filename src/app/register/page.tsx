'use client';

import React, { useState, useEffect, useRef } from 'react';
// MVC Imports
import { fetchRegistrationOptions, submitRegistrationForm } from '@/actions/registerController';

// Anime.js V4 Imports
import { animate, createTimeline, spring, waapi, splitText, stagger, createDrawable } from 'animejs';
import { 
  Calendar, Lock, ChevronDown, User, Info, 
  CheckCircle, Mail, Phone, MapPin, Loader2, ArrowRight, ShieldCheck
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Member Details', subtitle: 'Step 1' },
  { id: 2, title: 'Service & Talent', subtitle: 'Step 2' },
  { id: 3, title: 'Review & Confirm', subtitle: 'Step 3' },
];

export default function RegistrationPage() {
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

  // Refs
  const formCardRef = useRef<HTMLDivElement>(null);
  const stepTitleRef = useRef<HTMLHeadingElement>(null);
  const bgRayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadReferenceData() {
      const data = await fetchRegistrationOptions();
      setWijks(data.wijks);
      setSkills(data.skills);
      setOccupations(data.occupations);
    }
    loadReferenceData();
  }, []);

  // ── FITUR 1: WAAPI Background ──
  useEffect(() => {
    if (!bgRayRef.current) return;
    const rayAnim = waapi.animate(bgRayRef.current, {
      rotate: ['0deg', '360deg'],
      opacity: [0.03, 0.08, 0.03],
      duration: 25000,
      iterations: Infinity,
      easing: 'linear'
    });
    
    return () => { rayAnim?.cancel(); };
  }, []);

  // ── FITUR 2A: Initial Card Entry (Hanya Jalan Sekali) ──
  useEffect(() => {
    if (formCardRef.current) {
      animate(formCardRef.current, { opacity: [0, 1], y: [30, 0], duration: 1000, ease: 'outExpo' });
    }
  }, []);

  // ── FITUR 2B: Step Transition (Berjalan tiap ganti step) ──
  useEffect(() => {
    const cardNode = formCardRef.current;
    if (!cardNode) return;

    const inputNodes = Array.from(cardNode.querySelectorAll('.anim-input'));
    inputNodes.forEach(el => ((el as HTMLElement).style.opacity = '0'));

    const timer = setTimeout(() => {
      const titleNode = stepTitleRef.current;
      const currentInputs = Array.from(cardNode.querySelectorAll('.anim-input'));
      const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } });

      if (titleNode) {
        const split = splitText(titleNode, { chars: true });
        if (split && split.chars && split.chars.length > 0) {
          tl.add(split.chars, { opacity: [0, 1], y: [15, 0], rotateX: [90, 0], delay: stagger(30) });
        }
      }

      if (currentInputs.length > 0) {
        tl.add(currentInputs, { opacity: [0, 1], x: [-15, 0], delay: stagger(60) }, titleNode ? '<-=600' : 0);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [currentStep]);

  // ── FITUR 3: Tactile Spring ──
  const handleSpringBtn = (e: React.MouseEvent<HTMLElement>, state: 'down' | 'up') => {
    animate(e.currentTarget, { scale: state === 'down' ? 0.96 : 1, duration: 400, ease: spring({ bounce: 0.4 }) });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleKeahlianChange = (id: string) => {
    setFormData(prev => ({
      ...prev,
      keahlian: prev.keahlian.includes(id) ? prev.keahlian.filter(k => k !== id) : [...prev.keahlian, id]
    }));
  };

  const handleNext = (nextStep: number) => {
    if (currentStep === 1) {
      const { nama_lengkap, email, password, id_wijk, tanggal_lahir, no_telp, alamat } = formData;
      if (!nama_lengkap || !email || !password || !id_wijk || !tanggal_lahir || !no_telp || !alamat) {
        setError("Mohon lengkapi semua data identitas utama (termasuk Alamat & WA)."); 
        return;
      }
      if (alamat.length < 10) {
        setError("Alamat domisili minimal harus 10 karakter.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Format email tidak valid.");
        return;
      }
      const waRegex = /^(\+62|62|0)8\d{8,11}$/;
      if (!waRegex.test(no_telp)) {
        setError("Format nomor WhatsApp tidak valid (gunakan 08/62/+62).");
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.id_kategori_kesibukan) {
        setError("Mohon pilih kategori kesibukan Anda.");
        return;
      }
      if (formData.keahlian.length === 0) {
        setError("Mohon pilih minimal 1 keahlian/talenta.");
        return;
      }
    }

    setError(null);
    setCurrentStep(nextStep);
  };

  const handleSubmit = async () => {
    if (!formData.consent_pdp) { setError("Mohon setujui kebijakan UU PDP."); return; }
    
    setLoading(true); 
    setError(null);
    
    const result = await submitRegistrationForm(formData);
    
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || "Terjadi kesalahan saat pendaftaran.");
    }
    
    setLoading(false); 
  };

  if (submitted) return <SuccessScreen />;

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#051122] font-sans relative selection:bg-[#c5a059]/30 overflow-hidden">
      
      {/* Background */}
      <div ref={bgRayRef} className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="w-[150vmax] h-[150vmax] rounded-full bg-gradient-conic from-transparent via-[#c5a059]/20 to-transparent blur-3xl" />
      </div>

      <div className="w-full max-w-6xl min-h-[750px] flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-2xl border border-[#c5a059]/20 bg-[#050c18] z-10">
        
        {/* Left Side */}
        <div className="relative w-full md:w-1/2 h-48 md:h-auto overflow-hidden">
          <img src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop" alt="Choir" className="absolute inset-0 w-full h-full object-cover grayscale-[30%] brightness-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050c18] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#050c18]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center hidden md:flex">
             <h2 className="font-serif italic text-4xl text-[#c5a059] leading-tight mb-4">&ldquo;Praise the Lord.&rdquo;</h2>
             <p className="font-serif italic text-lg text-[#c5a059]/60">— Psalm 150:6</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 flex flex-col bg-transparent relative overflow-y-auto custom-scrollbar p-8 md:p-12">
          
          <div className="flex items-center gap-4 mb-10 shrink-0">
            <div className="w-10 h-10 border-2 border-[#c5a059] rotate-45 flex items-center justify-center"><ShieldCheck className="text-[#c5a059] -rotate-45" size={18}/></div>
            <div><h1 className="font-serif text-xl text-white">RNHKBP KAYU PUTIH</h1><p className="text-[#c5a059] text-[9px] font-bold tracking-[0.3em] uppercase">Identity Registration</p></div>
          </div>

          <div className="flex justify-between items-center mb-10 px-2 shrink-0">
            {STEPS.map((s) => (
              <div key={s.id} className="flex-1 text-center">
                <div className={`h-1 w-full rounded-full transition-all duration-700 ${currentStep >= s.id ? 'bg-[#c5a059]' : 'bg-white/10'}`} />
                <p className={`text-[8px] mt-2 font-bold uppercase tracking-widest ${currentStep === s.id ? 'text-[#c5a059]' : 'text-white/20'}`}>{s.title}</p>
              </div>
            ))}
          </div>

          {/* Form Container dengan initial opacity 0 */}
          <div ref={formCardRef} className="flex-1" style={{ opacity: 0 }}>
            
            <div style={{ perspective: '800px' }} className="mb-8 overflow-hidden">
              <h3 key={`title-${currentStep}`} ref={stepTitleRef} className="font-serif text-3xl text-white italic">
                {STEPS[currentStep - 1].title}
              </h3>
            </div>

            {error && <div className="p-4 bg-red-950/30 border border-red-900/40 rounded-lg flex gap-3 text-red-400 text-[10px] font-bold uppercase mb-6"><Info size={16}/>{error}</div>}

            {currentStep === 1 && (
              <div key="step1-content" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputBlock label="Nama (KTP)" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} icon={<User size={14}/>} />
                <div className="space-y-2 anim-input">
                  <label className="text-[9px] font-bold text-[#c5a059] uppercase tracking-widest">Wijk</label>
                  <div className="relative">
                    <select name="id_wijk" value={formData.id_wijk} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3.5 text-sm text-white focus:border-[#c5a059] outline-none appearance-none">
                      <option value="" className="bg-[#050c18]">-- Pilih --</option>
                      {wijks.map(w => <option key={w.id_wijk} value={w.id_wijk} className="bg-[#050c18]">{w.nama_wijk}</option>)}
                    </select>
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  </div>
                </div>
                <InputBlock label="Email Identity" name="email" type="email" value={formData.email} onChange={handleInputChange} icon={<Mail size={14}/>} />
                <InputBlock label="Secure Password" name="password" type="password" value={formData.password} onChange={handleInputChange} icon={<Lock size={14}/>} />
                <InputBlock label="No. WhatsApp" name="no_telp" type="tel" value={formData.no_telp} onChange={handleInputChange} icon={<Phone size={14}/>} />
                <InputBlock label="Tanggal Lahir" name="tanggal_lahir" type="date" value={formData.tanggal_lahir} onChange={handleInputChange} icon={<Calendar size={14}/>} />
                
                <div className="col-span-full space-y-2 anim-input">
                  <label className="text-[9px] font-bold text-[#c5a059] uppercase tracking-widest">Alamat Domisili</label>
                  <textarea 
                    name="alamat" 
                    value={formData.alamat} 
                    onChange={handleInputChange} 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-sm text-white focus:border-[#c5a059] outline-none transition-all min-h-[100px] resize-none" 
                    placeholder="Alamat lengkap sesuai KTP / Domisili saat ini..."
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div key="step2-content" className="space-y-8">
                <div className="space-y-4 anim-input">
                  <label className="text-[9px] font-bold text-[#c5a059] uppercase tracking-widest">Kesibukan Saat Ini</label>
                  <div className="grid grid-cols-2 gap-3">
                    {occupations.map((o) => (
                      <label key={o.id_kategori_kesibukan} className={`p-4 border rounded-lg cursor-pointer transition-all text-center ${formData.id_kategori_kesibukan === o.id_kategori_kesibukan ? 'border-[#c5a059] bg-[#c5a059]/10 text-[#c5a059]' : 'border-white/10 text-white/40'}`}>
                        <input type="radio" name="id_kategori_kesibukan" value={o.id_kategori_kesibukan} checked={formData.id_kategori_kesibukan === o.id_kategori_kesibukan} onChange={handleInputChange} className="hidden" />
                        <span className="text-[10px] font-bold uppercase">{o.nama_kategori}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 anim-input">
                  <label className="text-[9px] font-bold text-[#c5a059] uppercase tracking-widest">Keahlian Khusus</label>
                  <div className="grid grid-cols-2 gap-3">
                    {skills.map((s) => (
                      <label key={s.id_keahlian} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData.keahlian.includes(s.id_keahlian) ? 'border-[#c5a059] text-white' : 'border-white/10 text-white/40'}`}>
                        <input type="checkbox" checked={formData.keahlian.includes(s.id_keahlian)} onChange={() => handleKeahlianChange(s.id_keahlian)} className="w-4 h-4 accent-[#c5a059]" />
                        <span className="text-[10px] uppercase">{s.nama_keahlian}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div key="step3-content" className="space-y-6 anim-input">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-3">
                   <div className="flex justify-between text-[9px] uppercase tracking-widest border-b border-white/5 pb-2"><span className="text-[#c5a059]">Nama:</span> <span className="text-white">{formData.nama_lengkap}</span></div>
                   <div className="flex justify-between text-[9px] uppercase tracking-widest border-b border-white/5 pb-2"><span className="text-[#c5a059]">Lahir:</span> <span className="text-white">{formData.tanggal_lahir}</span></div>
                   <div className="flex justify-between text-[9px] uppercase tracking-widest border-b border-white/5 pb-2"><span className="text-[#c5a059]">Email:</span> <span className="text-white lowercase">{formData.email}</span></div>
                   <div className="flex justify-between text-[9px] uppercase tracking-widest border-b border-white/5 pb-2"><span className="text-[#c5a059]">WhatsApp:</span> <span className="text-white">{formData.no_telp}</span></div>
                   <div className="flex justify-between text-[9px] uppercase tracking-widest border-b border-white/5 pb-2"><span className="text-[#c5a059]">Wijk:</span> <span className="text-white">{wijks.find(w => w.id_wijk === formData.id_wijk)?.nama_wijk}</span></div>
                   <div className="flex justify-between text-[9px] uppercase tracking-widest border-b border-white/5 pb-2"><span className="text-[#c5a059]">Kesibukan:</span> <span className="text-white">{occupations.find(o => o.id_kategori_kesibukan === formData.id_kategori_kesibukan)?.nama_kategori}</span></div>
                   <div className="flex justify-between text-[9px] uppercase tracking-widest"><span className="text-[#c5a059]">Keahlian:</span> <span className="text-white">{formData.keahlian.length} Dipilih</span></div>
                   <div className="pt-2 text-[9px] uppercase tracking-widest"><span className="text-[#c5a059]">Alamat:</span> <p className="text-white/60 mt-1 leading-relaxed normal-case font-medium">{formData.alamat}</p></div>
                </div>
                <label className="flex items-start gap-4 p-5 bg-[#c5a059]/5 border border-[#c5a059]/20 rounded-xl cursor-pointer group">
                  <input type="checkbox" checked={formData.consent_pdp} onChange={(e) => setFormData({...formData, consent_pdp: e.target.checked})} className="mt-1 w-4 h-4 accent-[#c5a059]" />
                  <span className="text-[10px] font-medium text-[#c5a059]/80 uppercase leading-relaxed group-hover:text-[#c5a059]">Saya mengerti bahwa data saya hanya digunakan untuk keperluan internal RNHKBP Kayu Putih sesuai UU PDP.</span>
                </label>
              </div>
            )}

            <div className="flex gap-4 mt-12 anim-input">
              {currentStep > 1 && (
                <button onMouseDown={(e) => handleSpringBtn(e, 'down')} onMouseUp={(e) => handleSpringBtn(e, 'up')} onClick={() => setCurrentStep(prev => prev - 1)} className="flex-1 py-4 border border-white/10 text-white/30 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all">Back</button>
              )}
              {currentStep < 3 ? (
                <button onMouseDown={(e) => handleSpringBtn(e, 'down')} onMouseUp={(e) => handleSpringBtn(e, 'up')} onClick={() => handleNext(currentStep + 1)} className="flex-[2] py-4 bg-[#c5a059] text-[#050c18] font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg">Next Identity Step</button>
              ) : (
                <button onMouseDown={(e) => handleSpringBtn(e, 'down')} onMouseUp={(e) => handleSpringBtn(e, 'up')} onClick={handleSubmit} disabled={loading} className="flex-[2] py-4 bg-[#c5a059] text-[#050c18] font-black text-[10px] uppercase tracking-[0.2em] rounded-xl flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Finalize Registration'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #c5a05944; border-radius: 10px; }`}} />
    </main>
  );
}

function SuccessScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const paths = document.querySelectorAll('.corner-path');
      if(paths.length === 0) return;
      
      Array.from(paths).forEach((el, i) => {
        const d = createDrawable(el);
        if(!d || !d[0]) return;
        // @ts-ignore
        d[0].draw = '0 0';
        animate(d, {
          // @ts-ignore 
          draw: ['0 0', '0 1'], 
          duration: 1500, 
          ease: 'inOutCubic', 
          delay: 200 + (i * 100) 
        });
      });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050c18] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full bg-[#0a192f]/60 backdrop-blur-xl border border-[#c5a059]/20 p-12 rounded-2xl text-center space-y-8 relative">
        <SuccessCorners />
        <div className="inline-flex p-6 bg-[#c5a059]/10 text-[#c5a059] rounded-full"><CheckCircle size={56} /></div>
        <h2 className="text-3xl font-serif italic text-white">Registration Sent</h2>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] leading-relaxed">Admin akan memverifikasi data Anda. Silakan cek email secara berkala.</p>
        <button onClick={() => window.location.href = '/login'} className="w-full py-4 bg-[#c5a059] text-[#050c18] font-black tracking-[0.2em] uppercase text-[10px] rounded-xl shadow-xl">Portal Login</button>
      </div>
    </div>
  );
}

function SuccessCorners() {
  return (
    <>
      <svg className="absolute top-0 left-0 w-16 h-16 opacity-40"><path className="corner-path" d="M10,10 L40,10 M10,10 L10,40" stroke="#c5a059" fill="none" strokeWidth="2" /></svg>
      <svg className="absolute top-0 right-0 w-16 h-16 opacity-40 rotate-90"><path className="corner-path" d="M10,10 L40,10 M10,10 L10,40" stroke="#c5a059" fill="none" strokeWidth="2" /></svg>
      <svg className="absolute bottom-0 left-0 w-16 h-16 opacity-40 -rotate-90"><path className="corner-path" d="M10,10 L40,10 M10,10 L10,40" stroke="#c5a059" fill="none" strokeWidth="2" /></svg>
      <svg className="absolute bottom-0 right-0 w-16 h-16 opacity-40 rotate-180"><path className="corner-path" d="M10,10 L40,10 M10,10 L10,40" stroke="#c5a059" fill="none" strokeWidth="2" /></svg>
    </>
  );
}

function InputBlock({ label, name, type = "text", value, onChange, icon }: any) {
  return (
    <div className="space-y-2 anim-input">
      <label className="text-[9px] font-bold text-[#c5a059] uppercase tracking-widest">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#c5a059] transition-colors">{icon}</div>
        <input required name={name} type={type} value={value} onChange={onChange} className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3.5 text-sm text-white focus:border-[#c5a059] transition-all outline-none placeholder:text-white/10" />
      </div>
    </div>
  );
}