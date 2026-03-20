"use server";

import { supabase } from '@/lib/supabase';
import { getReferenceData, insertQuarantineData } from '@/lib/models/registerModel';

export async function fetchRegistrationOptions() {
  try {
    return await getReferenceData();
  } catch (error) {
    console.error("Gagal memuat opsi registrasi:", error);
    return { wijks: [], skills: [], occupations: [] };
  }
}

export async function submitRegistrationForm(formData: any) {
  try {
    const emailFormatted = formData.email.toLowerCase().trim();

    // 1. Identity Portaling: Buat akun Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailFormatted, 
      password: formData.password, 
      options: { data: { full_name: formData.nama_lengkap } }
    });

    if (authError) throw authError;

    // 2. Data Isolation: Buang password dan consent_pdp dari payload
    const { password, consent_pdp, ...rawData } = formData;
    rawData.email = emailFormatted; 

    // 3. Simpan ke Antrean Karantina
    await insertQuarantineData(rawData, authData.user?.id);

    return { success: true };
  } catch (error: any) {
    // Menangkap authError dan mengirimkan pesan galat ke View
    return { success: false, error: error.message };
  }
}