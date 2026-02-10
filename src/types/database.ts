export type Anggota = {
  id_anggota: string;
  nama_lengkap: string;
  tanggal_lahir: string;
  id_wijk: string;
  no_telp?: string;
};

export type QuarantineAnggota = {
  id_quarantine: string;
  raw_data: any;
  status: 'pending' | 'resolved' | 'merged';
};
