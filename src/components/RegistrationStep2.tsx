'use client';

import React from 'react';

interface Step2Props {
  formData: any;
  occupations: any[];
  skills: any[];
  onInputChange: (e: any) => void;
  onKeahlianChange: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
  prefixCls?: string;
}

export function RegistrationStep2({ 
  formData, occupations, skills, onInputChange, onKeahlianChange, onNext, onPrev, prefixCls = 'rc-reg' 
}: Step2Props) {
  return (
    <div className={`${prefixCls}-step space-y-8`}>
      <div className="text-center mb-6">
        <h3 className="font-serif text-3xl text-white italic">Pelayanan & Talenta</h3>
      </div>

      <div className="space-y-4">
        <label className={`text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.2em] ${prefixCls}-label`}>Kategori Kesibukan Saat Ini</label>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {occupations.map((o) => (
            <label key={o.id_kategori_kesibukan} className="flex flex-col items-center gap-2 p-5 border border-[#c5a059]/20 bg-[#0a192f]/20 rounded-md cursor-pointer hover:bg-[#c5a059]/10 transition-all has-[:checked]:border-[#c5a059] has-[:checked]:bg-[#c5a059]/10 group">
              <input type="radio" name="id_kategori_kesibukan" value={o.id_kategori_kesibukan} checked={formData.id_kategori_kesibukan === o.id_kategori_kesibukan} onChange={onInputChange} className="hidden" />
              <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-white/50 group-has-[:checked]:text-[#c5a059] text-center leading-relaxed">{o.nama_kategori}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <label className={`text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.2em] ${prefixCls}-label`}>Keahlian Khusus (Bisa Pilih &gt; 1)</label>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {skills.map((s) => (
            <label key={s.id_keahlian} className="flex items-center gap-4 p-4 border border-[#c5a059]/20 bg-[#0a192f]/20 rounded-md cursor-pointer hover:bg-[#c5a059]/10 transition-all has-[:checked]:border-[#c5a059]">
              <input type="checkbox" checked={formData.keahlian.includes(s.id_keahlian)} onChange={() => onKeahlianChange(s.id_keahlian)} className="w-5 h-5 rounded border-[#c5a059]/50 bg-transparent text-[#c5a059] focus:ring-[#c5a059] focus:ring-offset-[#050c18] cursor-pointer" />
              <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-white/70">{s.nama_keahlian}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4 w-full pt-8">
        <button onClick={onPrev} className="flex-1 py-4 border border-white/20 text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] rounded-md hover:bg-white/5 transition-colors">Kembali</button>
        <button onClick={onNext} className="flex-[2] py-4 bg-[#c5a059] text-[#050c18] font-bold text-[10px] uppercase tracking-[0.3em] rounded-md hover:bg-[#A68545] transition-colors shadow-[0_0_20px_rgba(197,160,89,0.2)]">Review Data</button>
      </div>
    </div>
  );
}
