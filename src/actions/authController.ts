"use server";

import { supabase } from '@/lib/supabase';

export async function processLoginRequest(email: string, password?: string, redirectPath: string = '/dashboard') {
  try {
    const formattedEmail = email.toLowerCase().trim();

    if (!password) {
      return { success: false, error: "Password wajib diisi untuk masuk ke sistem." };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: formattedEmail, 
      password 
    });

    if (error) throw error;

    const isSystemAdmin = formattedEmail.endsWith('@rnhkbp.com');
    return { 
      success: true, 
      redirect: isSystemAdmin ? '/admin' : redirectPath 
    };

  } catch (error: any) {
    const errorMessage = error.message.includes('Signups not allowed')
      ? 'Email tidak terdaftar. Silakan registrasi terlebih dahulu.'
      : error.message || 'Gagal melakukan autentikasi.';
      
    return { success: false, error: errorMessage };
  }
}