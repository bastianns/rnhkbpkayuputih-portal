"use server";

import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

/**
 * Memproses permintaan login jemaat dan admin secara aman.
 * Menggunakan metadata role dari JWT untuk menentukan hak akses admin.
 */
export async function processLoginRequest(email: string, password?: string, redirectPath: string = '/dashboard') {
  try {
    const supabase = await createClient();
    const formattedEmail = email.toLowerCase().trim();

    if (!password) {
      return { success: false, error: "Password wajib diisi." };
    }

    // 1. Melakukan autentikasi kredensial
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email: formattedEmail, 
      password 
    });

    if (authError) throw authError;

    // 2. KEAMANAN: Verifikasi Role Admin dari App Metadata (bukan cek domain email)
    // Supabase menyimpan role di app_metadata setelah kita set di SQL/Dashboard
    const isSystemAdmin = authData.user?.app_metadata?.role === 'admin';

    return { 
      success: true, 
      redirect: isSystemAdmin ? '/admin' : redirectPath 
    };

  } catch (error: any) {
    const errorMessage = error.message.includes('Invalid login credentials')
      ? 'Email atau Password salah.'
      : error.message || 'Gagal melakukan autentikasi.';
      
    return { success: false, error: errorMessage };
  }
}

/**
 * Menghapus sesi pengguna secara permanen.
 */
export async function handleLogout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { success: false, error: error.message };
  }

  redirect('/login');
}
