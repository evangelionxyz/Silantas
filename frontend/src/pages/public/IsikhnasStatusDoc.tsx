import React from 'react';
import { motion } from 'framer-motion';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { SUANGGI_BRAND } from '../../constants/brand';

export const IsikhnasStatusDoc: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f7f6f1] flex flex-col">
      <Breadcrumbs items={[
        { label: `Layanan Publik ${SUANGGI_BRAND.name}`, href: '/' },
        { label: 'Status Integrasi iSIKHNAS' }
      ]} />

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex-1">
        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="py-8 sm:py-10 docs-prose min-w-0"
        >
          <div className="not-prose bg-[#78350f] text-white p-6 sm:p-8 mb-8 border border-[#b45309] shadow-xs">
            <span className="inline-block px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider bg-[#fcd34d] text-[#1f2328] mb-3">
              Pemberitahuan Layanan &amp; Pemuktahiran &bull; {SUANGGI_BRAND.name}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2.5 leading-tight">
              Status Portal lalin.isikhnas.co.id &amp; Sistem Terpadu {SUANGGI_BRAND.name}
            </h1>
            <p className="text-sm sm:text-base text-[#fef3c7] leading-relaxed m-0">
              Pemberitahuan resmi mengenai status operasional sistem lalu lintas ternak nasional iSIKHNAS dan tata cara pelayanan terpadu melalui {SUANGGI_BRAND.name} ({SUANGGI_BRAND.fullName}) di Kabupaten Mimika.
            </p>
          </div>
          <h2>Prosedur Pelayanan Terpadu Melalui {SUANGGI_BRAND.name}</h2>
          <p>
            Dengan semangat <strong>&ldquo;{SUANGGI_BRAND.slogan}&rdquo;</strong> ({SUANGGI_BRAND.motto}), {SUANGGI_BRAND.agency} menyelenggarakan pelayanan dan pencatatan langsung melalui sistem <strong>{SUANGGI_BRAND.name}</strong>:
          </p>
          <ul>
            <li>
              <strong>Pelayanan Rekomendasi Terpadu:</strong> Seluruh permohonan rekomendasi pemasukan dan pengeluaran ditangani secara langsung oleh tim verifikasi veteriner Dinas Peternakan Kabupaten Mimika.
            </li>
            <li>
              <strong>Pencatatan &amp; Pemuktahiran Mandiri di {SUANGGI_BRAND.name}:</strong> Data Pemasukan (hewan/produk masuk), Pengeluaran (hewan/produk keluar), Pemuktahiran status pemeriksaan, serta Monitoring statistik dicatat dan dihitung secara otomatis pada sistem {SUANGGI_BRAND.name}.
            </li>
            <li>
              <strong>Pemeriksaan Fisik Karantina Tetap Wajib:</strong> Petugas pos pengawasan Pomako dan Mozes Kilangin melakukan inspeksi fisik, suhu, dan verifikasi sertifikat kesehatan cetak dari daerah asal.
            </li>
          </ul>

          <h2>Langkah Bagi Pelaku Usaha</h2>
          <ol className="list-decimal pl-6 space-y-3 text-sm sm:text-base text-[#24292f] leading-relaxed">
            <li>Pelaku usaha tidak perlu menunggu aktivasi portal <code>lalin.isikhnas.co.id</code> untuk mengajukan izin.</li>
            <li>Silakan menghubungi petugas pelayanan Dinas Peternakan Mimika via loket kantor atau melalui layanan <strong>WhatsApp Business Resmi {SUANGGI_BRAND.name}</strong>.</li>
            <li>Kirimkan softcopy berkas SKKH dan dokumen pendukung kepada petugas untuk diproses verifikasi dan pemuktahiran datanya.</li>
          </ol>
        </motion.main>
      </div>
    </div>
  );
};
