import React from 'react';
import { motion } from 'framer-motion';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { DocsSidebar } from '../../components/layout/DocsSidebar';

export const IsikhnasStatusDoc: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Breadcrumbs items={[
        { label: 'Layanan Publik', href: '/' },
        { label: 'Status Integrasi iSIKHNAS' }
      ]} />

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-start">
        <DocsSidebar className="hidden lg:block" />

        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex-1 py-8 px-0 lg:px-10 docs-prose"
        >
          <div className="border-b border-[#d0d7de] pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1f2328] mb-3">
              Status & Informasi Prosedur Portal lalin.isikhnas.co.id
            </h1>
            <p className="text-base sm:text-lg text-[#57606a] leading-relaxed">
              Pemberitahuan resmi mengenai status operasional sistem lalu lintas ternak nasional iSIKHNAS dan tata cara pelayanan alternatif di Kabupaten Mimika.
            </p>
          </div>

          {/* Service Outage Notice Banner */}
          <div className="p-4 sm:p-5 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] mb-8 shadow-2xs">
            <div className="flex items-center gap-2.5 font-bold text-sm sm:text-base text-[#1f2328] mb-2">
              <span className="w-3 h-3 rounded-full bg-[#9a6700] shrink-0"></span>
              <span>Status Sistem Nasional: Tidak Dapat Diakses (Web Not Available)</span>
            </div>
            <p className="text-sm sm:text-base text-[#57606a] m-0 leading-relaxed">
              Domain dan portal layanan lalu lintas hewan daring nasional pada alamat <code className="text-xs sm:text-sm font-mono">lalin.isikhnas.co.id</code> saat ini dalam kondisi nonaktif/tidak tersedia dari pusat Kementerian Pertanian.
            </p>
          </div>

          <h2>Prosedur Pengganti Pelayanan di Mimika</h2>
          <p>
            Untuk memastikan arus distribusi pasokan ternak dan produk pangan hewani tidak terhambat, Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika menerapkan prosedur verifikasi langsung (interim SOP):
          </p>
          <ul>
            <li>
              <strong>Pelayanan Rekomendasi Terpadu:</strong> Seluruh permohonan rekomendasi pengeluaran dan pemasukan ditangani secara langsung oleh tim verifikasi veteriner Dinas Peternakan Kabupaten Mimika.
            </li>
            <li>
              <strong>Pencatatan Mandiri di SI-LANTAS MIMIKA:</strong> Data lalu lintas (masuk/keluar) tetap dicatat, dipantau, dan dihitung secara otomatis melalui sistem SI-LANTAS internal Dinas Peternakan Mimika.
            </li>
            <li>
              <strong>Pemeriksaan Fisik Karantina Tetap Wajib:</strong> Petugas pos pengawasan Pomako dan Mozes Kilangin melakukan inspeksi manual fisik, suhu, dan verifikasi sertifikat kesehatan cetak dari daerah asal.
            </li>
          </ul>

          <h2>Langkah Bagi Pelaku Usaha</h2>
          <ol className="list-decimal pl-6 space-y-3 text-sm sm:text-base text-[#24292f] leading-relaxed">
            <li>Pelaku usaha tidak perlu menunggu aktivasi portal <code>lalin.isikhnas.co.id</code> untuk mengajukan izin.</li>
            <li>Silakan menghubungi petugas pelayanan Dinas Peternakan Mimika via loket kantor atau melalui layanan <strong>WhatsApp Business Resmi SI-LANTAS</strong>.</li>
            <li>Kirimkan softcopy berkas SKKH dan dokumen pendukung kepada petugas untuk diproses verifikasinya.</li>
          </ol>
        </motion.main>
      </div>
    </div>
  );
};
