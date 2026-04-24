"use server";

import { createClient } from '@/lib/supabaseServer';
import { getReferenceData } from '@/lib/models/registerModel';
import { RegistrationSchema } from '@/lib/schemas/registration';

/**
 * Memuat data referensi (Wijk, Keahlian, Kesibukan) untuk form pendaftaran.
 */
export async function fetchRegistrationOptions() {
  try {
    const supabase = await createClient();
    return await getReferenceData(supabase);
  } catch (error) {
    console.error("Gagal memuat opsi registrasi:", error);
    return { wijks: [], skills: [], occupations: [] };
  }
}

/**
 * Memproses pendaftaran jemaat baru.
 * Menggunakan arsitektur Atomic Trigger (Next.js -> Supabase Auth -> DB Trigger).
 */
export async function submitRegistrationForm(rawInput: unknown) {
  try {
    // 1. Validasi Input via Zod (Type-Safety)
    const result = RegistrationSchema.safeParse(rawInput);
    if (!result.success) {
      console.error("Zod Validation Error:", result.error.format());
      // Ambil pesan error pertama dari Zod untuk ditampilkan di UI
      const firstError = result.error.issues[0]?.message || "Data tidak valid.";
      return { 
        success: false, 
        error: firstError 
      };
    }

    const { email, password, ...profileData } = result.data;
    const supabase = await createClient();

    // 2. Eksekusi Atomic Registration
    // Trigger database 'tr_on_new_user_registered' akan otomatis memproses profileData
    // yang dikirimkan melalui metadata. Jika profil gagal masuk karantina,
    // maka pembuatan akun Auth ini akan otomatis di-ROLLBACK oleh PostgreSQL.
    const { error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password,
      options: {
        data: {
          ...profileData,
          // Tambahkan flag untuk identifikasi di log jika perlu
          registration_source: 'portal_mvp_v1'
        }
      }
    });

    if (authError) {
      // Tampilkan pesan error asli agar transparan apa yang salah di sisi database/auth
      return { 
        success: false, 
        error: authError.message
      };
    }

    return { 
      success: true, 
      message: 'Pendaftaran berhasil. Data Anda telah masuk ke antrean verifikasi admin.' 
    };

  } catch (error: any) {
    console.error("Critical Registration Error:", error.message);
    return { 
      success: false, 
      error: error.message || 'Terjadi kesalahan sistem saat memproses pendaftaran.' 
    };
  }
}
