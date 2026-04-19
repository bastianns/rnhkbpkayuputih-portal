'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRegistrationData() {
  const [wijks, setWijks] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [occupations, setOccupations] = useState<any[]>([]);

  useEffect(() => {
    async function fetchReferenceData() {
      const { data: w } = await supabase.from('wijk').select('*').order('nama_wijk');
      const { data: s } = await supabase.from('ref_keahlian').select('*').order('nama_keahlian');
      const { data: o } = await supabase.from('ref_kategori_kesibukan').select('*').order('nama_kategori');
      if (w) setWijks(w); 
      if (s) setSkills(s); 
      if (o) setOccupations(o);
    }
    fetchReferenceData();
  }, []);

  return { wijks, skills, occupations };
}
