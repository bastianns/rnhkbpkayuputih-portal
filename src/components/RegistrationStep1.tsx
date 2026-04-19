'use client';

import React from 'react';
import { User, Mail, Lock, Phone, Calendar, MapPin, ChevronDown } from 'lucide-react';

interface Step1Props {
  formData: any;
  wijks: any[];
  onChange: (e: any) => void;
  onNext: () => void;
  prefixCls?: string;
}

export function RegistrationStep1({ formData, wijks, onChange, onNext, prefixCls = 'rc-reg' }: Step1Props) {
  return (
    <div className={`${prefixCls}-step space-y-6`}>
      <div className="text-center mb-8">
        <h3 className="font-serif text-3xl text-white italic">Identitas Pribadi</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputBlock label="Nama Lengkap (KTP)" name="nama_lengkap" icon={<User size={16}/>} value={formData.nama_lengkap} onChange={onChange} prefixCls={prefixCls} />
        
        <div className="space-y-2">
          <label className={`text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.2em] ${prefixCls}-label`}>Pilih Wijk</label>
          <div className="relative group">
            <select name="id_wijk" value={formData.id_wijk} onChange={onChange} className="w-full bg-[#0a192f]/30 border border-[#c5a059]/30 rounded-md pl-10 pr-4 py-3.5 text-sm text-white appearance-none focus:outline-none focus:border-[#c5a059] focus:bg-[#0a192f]/60 transition-colors cursor-pointer group-hover:border-[#c5a059]/60">
              <option value="" className="bg-[#050c18] text-white/50">-- Pilih Wilayah --</option>
              {wijks.map(w => <option key={w.id_wijk} value={w.id_wijk} className="bg-[#050c18]">{w.nama_wijk}</option>)}
            </select>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5a059]/50" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5a059] pointer-events-none" />
          </div>
        </div>

        <InputBlock label="Email Aktif" name="email" type="email" icon={<Mail size={16}/>} value={formData.email} onChange={onChange} prefixCls={prefixCls} />
        <InputBlock label="Password Portal" name="password" type="password" icon={<Lock size={16}/>} value={formData.password} onChange={onChange} prefixCls={prefixCls} />
        <InputBlock label="No. WhatsApp" name="no_telp" type="tel" icon={<Phone size={16}/>} value={formData.no_telp} onChange={onChange} prefixCls={prefixCls} />
        <InputBlock label="Tanggal Lahir" name="tanggal_lahir" type="date" icon={<Calendar size={16}/>} value={formData.tanggal_lahir} onChange={onChange} prefixCls={prefixCls} />
      </div>

      <div className="space-y-2 pt-2">
        <label className={`text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.2em] ${prefixCls}-label`}>Alamat Domisili</label>
        <textarea name="alamat" value={formData.alamat} onChange={onChange} className="w-full bg-[#0a192f]/30 border border-[#c5a059]/30 rounded-md px-4 py-4 text-sm text-white focus:outline-none focus:border-[#c5a059] focus:bg-[#0a192f]/60 transition-colors min-h-[100px] resize-none" placeholder="Alamat lengkap saat ini..."/>
      </div>

      <button onClick={onNext} className="w-full relative group overflow-hidden border border-[#c5a059] rounded-md py-4 mt-6 transition-all duration-300 hover:bg-[#c5a059]/10 hover:shadow-[0_0_20px_rgba(197,160,89,0.2)]">
        <span className="relative flex justify-center items-center gap-2 text-[11px] font-bold text-[#c5a059] uppercase tracking-[0.3em]">Selanjutnya</span>
      </button>
    </div>
  );
}

function InputBlock({ label, name, type = "text", value, onChange, icon, prefixCls }: any) {
  return (
    <div className={`space-y-2 ${prefixCls}-input-block`}>
      <label className={`text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.2em] ${prefixCls}-label`}>{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5a059]/50 group-focus-within:text-[#c5a059] transition-colors pointer-events-none">{icon}</div>
        <input required name={name} type={type} value={value} onChange={onChange} className="w-full bg-[#0a192f]/30 border border-[#c5a059]/30 rounded-md pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-[#c5a059] focus:bg-[#0a192f]/60 transition-colors placeholder:text-white/20" />
      </div>
    </div>
  );
}
