import { supabase } from '@/lib/supabase';

export async function getReferenceData() {
  const [wRes, sRes, oRes] = await Promise.all([
    supabase.from('wijk').select('*').order('nama_wijk'),
    supabase.from('ref_keahlian').select('*').order('nama_keahlian'),
    supabase.from('ref_kategori_kesibukan').select('*').order('nama_kategori')
  ]);
  
  return {
    wijks: wRes.data || [],
    skills: sRes.data || [],
    occupations: oRes.data || []
  };
}

export async function insertQuarantineData(rawData: any, authId: string | undefined) {
  const { error } = await supabase.from('quarantine_anggota').insert([{ 
    raw_data: { ...rawData, id_auth: authId }, 
    status: 'pending' 
  }]);
  
  if (error) throw error;
}