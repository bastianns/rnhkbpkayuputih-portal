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

    // 1. Identity Portaling: Buat akun Auth (Supabase GoTrue)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailFormatted, 
      password: formData.password, 
      options: { data: { full_name: formData.nama_lengkap } }
    });

    if (authError) throw authError;

    // 2. Data Isolation & Sanitization
    // Membuang password dan consent_pdp dari payload yang akan disimpan ke DB
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, consent_pdp, ...rawData } = formData;
    rawData.email = emailFormatted;
    rawData.created_at = new Date().toISOString();

    // 3. Panggil Model untuk memicu RPC Identity Vetting Engine (Fellegi-Sunter)
    await insertQuarantineData(rawData, authData.user?.id);

    return { 
      success: true, 
      message: 'Pendaftaran berhasil. Data Anda telah masuk ke antrean vetting untuk diverifikasi oleh admin.' 
    };
  } catch (error: any) {
    console.error("Registration Error:", error.message);
    return { success: false, error: error.message || 'Terjadi kesalahan saat pendaftaran.' };
  }
}