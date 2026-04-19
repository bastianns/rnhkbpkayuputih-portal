"use server";

import { createClient } from '@/lib/supabaseServer';
import { getReferenceData } from '@/lib/models/registerModel';

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
    const supabase = await createClient();
    const emailFormatted = formData.email.toLowerCase().trim();

    // 1. Identity Portaling: Buat akun Auth & Kirim semua data profil ke Metadata
    const { error: authError } = await supabase.auth.signUp({
      email: emailFormatted, 
      password: formData.password, 
      options: { 
        data: { 
          nama_lengkap: formData.nama_lengkap,
          tanggal_lahir: formData.tanggal_lahir,
          id_wijk: formData.id_wijk,
          no_telp: formData.no_telp,
          alamat: formData.alamat,
          id_kategori_kesibukan: formData.id_kategori_kesibukan,
          keahlian: formData.keahlian,
          consent_pdp: formData.consent_pdp
        } 
      }
    });

    if (authError) throw authError;

    return { 
      success: true, 
      message: 'Pendaftaran berhasil. Data Anda telah masuk ke antrean vetting untuk diverifikasi oleh admin.' 
    };
  } catch (error: any) {
    console.error("Registration Error:", error.message);
    return { success: false, error: error.message || 'Terjadi kesalahan saat pendaftaran.' };
  }
}