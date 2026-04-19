'use client';

import React from 'react';
import { CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';

interface Step3Props {
  formData: any;
  loading: boolean;
  onPrev: () => void;
  onSubmit: () => void;
  onConsentChange: (e: any) => void;
  prefixCls?: string;
}

export function RegistrationStep3({ 
  formData, loading, onPrev, onSubmit, onConsentChange, prefixCls = 'rc-reg' 
}: Step3Props) {
  return (
    <div className={`${prefixCls}-step space-y-8`}>
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
          <h3 className={`text-[11px] font-bold text-[#c5a059] uppercase tracking-widest ${prefixCls}-label`}>Kepatuhan UU PDP</h3>
        </div>
        <p className="text-[9px] md:text-[10px] font-medium text-white/60 leading-relaxed uppercase tracking-widest mb-6">Sesuai UU PDP No. 27/2022, data Anda hanya digunakan untuk kepentingan internal database RNHKBP Kayu Putih.</p>
        <label className="flex items-center gap-4 cursor-pointer group w-fit">
          <input type="checkbox" checked={formData.consent_pdp} onChange={onConsentChange} className="w-5 h-5 rounded border-[#c5a059]/50 bg-transparent text-[#c5a059] focus:ring-[#c5a059] focus:ring-offset-[#050c18] cursor-pointer" />
          <span className="text-[10px] md:text-[11px] font-bold uppercase text-[#c5a059] group-hover:underline tracking-[0.2em]">Saya Setuju & Mengerti</span>
        </label>
      </div>

      <div className="flex gap-4 w-full pt-4">
        <button onClick={onPrev} disabled={loading} className="flex-1 py-4 border border-white/20 text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] rounded-md hover:bg-white/5 transition-colors disabled:opacity-50">Kembali</button>
        <button onClick={onSubmit} disabled={loading} className="flex-[2] py-4 bg-[#c5a059] text-[#051122] font-bold text-[10px] md:text-[11px] uppercase tracking-[0.3em] rounded-md hover:bg-[#A68545] transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_30px_rgba(197,160,89,0.3)]">
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Kirim Registrasi'}
        </button>
      </div>
    </div>
  );
}
