import { z } from 'zod';

export const RegistrationSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  nama_lengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter').max(100),
  tanggal_lahir: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .refine((val) => {
      const birthDate = new Date(val);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 5 && age <= 120;
    }, 'Tanggal lahir tidak valid atau umur di luar batas (5-120 tahun)'),
  id_wijk: z.string().uuid('Wijk tidak valid'),
  no_telp: z.string().regex(/^08\d{8,11}$/, 'Nomor HP harus berformat 08xxxxxxxxxx'),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  id_kategori_kesibukan: z.string().uuid('Kategori kesibukan tidak valid'),
  keahlian: z.array(z.string().uuid()).min(1, 'Pilih minimal 1 keahlian'),
  consent_pdp: z.boolean().refine(val => val === true, 'Anda harus menyetujui kebijakan privasi data'),
});

export type RegistrationFormData = z.infer<typeof RegistrationSchema>;
