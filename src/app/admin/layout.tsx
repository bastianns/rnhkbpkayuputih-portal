import Sidebar from './Sidebar';

/**
 * AdminLayout berfungsi sebagai wrapper utama untuk semua halaman di bawah rute /admin.
 * Mengintegrasikan Sidebar modular dan area konten utama yang dapat di-scroll.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f7f8]">
      {/* Sidebar - Menggunakan komponen eksternal Sidebar.tsx */}
      <Sidebar />

      {/* Area Konten Utama */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          {/* Konten halaman spesifik (Dashboard, Records, dll) akan dirender di sini */}
          {children}
        </div>
      </main>
    </div>
  );
}