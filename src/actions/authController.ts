"use server";

import { supabase } from '@/lib/supabase';

export async function processLoginRequest(email: string, password?: string, redirectPath: string = '/dashboard') {
  try {
    const formattedEmail = email.toLowerCase().trim();
    const isSystemAdmin = formattedEmail.endsWith('@rnhkbp.com');

    if (isSystemAdmin) {
      if (!password) return { success: false, error: "Password wajib diisi untuk Administrator." };
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email: formattedEmail, 
        password 
      });
      
      if (error) throw error;
      return { success: true, redirect: '/admin' };
    } 
    
    // Jalur Jemaat (Magic Link)
    else {
      // Perhatikan penggunaan window.location.origin tidak bisa di Server Action, 
      // kita harus membangun URL absolut menggunakan process.env atau origin request
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      
      const { error } = await supabase.auth.signInWithOtp({
        email: formattedEmail,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=${redirectPath}`,
          shouldCreateUser: false, // Penting: Proteksi SSOT
        },
      });

      if (error) throw error;
      return { 
        success: true, 
        message: 'Tautan akses telah dikirim ke email Anda. Silakan periksa inbox atau folder spam.' 
      };
    }
  } catch (error: any) {
    const errorMessage = error.message.includes('Signups not allowed')
      ? 'Email tidak terdaftar. Silakan registrasi terlebih dahulu.'
      : error.message || 'Gagal melakukan autentikasi.';
      
    return { success: false, error: errorMessage };
  }
}