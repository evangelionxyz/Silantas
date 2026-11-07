import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { DocsSidebar } from '../../components/layout/DocsSidebar';

export const DocsHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Breadcrumbs items={[{ label: 'Tentang SI-LANTAS' }]} />

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-start">
        {/* Left Sidebar (Desktop) */}
        <DocsSidebar className="hidden lg:block" />

        {/* Center Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex-1 py-8 px-0 lg:px-10"
        >
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1f2328] mb-3">
              SI-LANTAS HEWAN MIMIKA
            </h1>
            <p className="text-base sm:text-lg text-[#57606a] leading-relaxed">
              Sistem Informasi Pelayanan Lalu Lintas Hewan, Produk Hewan, dan Olahan Peternakan.
              Layanan resmi Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika, Papua Tengah.
            </p>
          </div>

          {/* Quick Notice Alert */}
          <div className="mb-8 p-4 sm:p-5 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] flex items-start gap-3.5 text-sm sm:text-base leading-relaxed text-[#1f2328] shadow-2xs">
            <svg className="w-6 h-6 text-[#0969da] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-semibold text-[#1f2328]">Pemberitahuan Pelayanan:</span> Seluruh pemasukan dan pengeluaran hewan, bahan asal hewan (BAH), dan hasil bahan asal hewan (HBAH) melalui pintu Pelabuhan Laut Pomako dan Bandara Mozes Kilangin wajib disertai dokumen karantina dan SKKH yang sah.
            </div>
          </div>

          {/* Service Cards Grid - Matching GitHub Docs Landing Cards */}
          <div className="divide-y divide-[#d0d7de] border-y border-[#d0d7de] mb-12">
            {/* Card 1 */}
            <div className="py-6">
              <Link
                to="/persyaratan"
                className="text-lg sm:text-xl font-bold text-[#0969da] hover:underline flex items-center justify-between group"
              >
                <span>Persyaratan Lalu Lintas Hewan & Produk Olahan</span>
                <span className="text-[#57606a] text-sm font-normal group-hover:text-[#0969da] shrink-0 ml-2">Buka panduan &rarr;</span>
              </Link>
              <p className="text-sm sm:text-base text-[#57606a] mt-2 leading-relaxed">
                Daftar lengkap persyaratan dokumen administrasi, izin pemasukan (impor) dan pengeluaran (ekspor) untuk ternak besar, unggas, daging beku, telur, dan produk olahan.
              </p>
            </div>

            {/* Card 2 */}
            <div className="py-6">
              <Link
                to="/pemeriksaan"
                className="text-lg sm:text-xl font-bold text-[#0969da] hover:underline flex items-center justify-between group"
              >
                <span>Pemeriksaan Kesehatan Hewan & Penerbitan SKKH</span>
                <span className="text-[#57606a] text-sm font-normal group-hover:text-[#0969da] shrink-0 ml-2">Buka panduan &rarr;</span>
              </Link>
              <p className="text-sm sm:text-base text-[#57606a] mt-2 leading-relaxed">
                Standar operasional prosedur pemeriksaan klinis, pengujian sampel laboratorium, tindakan karantina di pos pengawasan, dan penerbitan Surat Keterangan Kesehatan Hewan.
              </p>
            </div>

            {/* Card 3 */}
            <div className="py-6">
              <Link
                to="/isikhnas"
                className="text-lg sm:text-xl font-bold text-[#0969da] hover:underline flex items-center justify-between group"
              >
                <span>Status & Prosedur Portal lalin.isikhnas.co.id</span>
                <span className="text-[#57606a] text-sm font-normal group-hover:text-[#0969da] shrink-0 ml-2">Buka status &rarr;</span>
              </Link>
              <p className="text-sm sm:text-base text-[#57606a] mt-2 leading-relaxed">
                Informasi status operasional portal lalu lintas nasional iSIKHNAS serta alur alternatif verifikasi manual oleh petugas karantina Dinas Kabupaten Mimika.
              </p>
            </div>

            {/* Card 4 */}
            <div className="py-6">
              <Link
                to="/konsultasi"
                className="text-lg sm:text-xl font-bold text-[#0969da] hover:underline flex items-center justify-between group"
              >
                <span>Konsultasi & Chatting WhatsApp Business</span>
                <span className="text-[#57606a] text-sm font-normal group-hover:text-[#0969da] shrink-0 ml-2">Buka kontak &rarr;</span>
              </Link>
              <p className="text-sm sm:text-base text-[#57606a] mt-2 leading-relaxed">
                Layanan komunikasi langsung dengan Administrator dan Petugas Verifikasi SI-LANTAS melalui saluran resmi WhatsApp Business untuk bantuan teknis dan konfirmasi berkas.
              </p>
            </div>
          </div>

          {/* Contact / Office Footer */}
          <div className="border border-[#d0d7de] rounded-lg p-5 sm:p-6 bg-[#f6f8fa] shadow-2xs">
            <h3 className="font-bold text-base sm:text-lg text-[#1f2328] mb-2">
              Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika
            </h3>
            <p className="text-sm sm:text-base text-[#57606a] leading-relaxed mb-4">
              Kompleks Perkantoran Pemerintah Daerah Kabupaten Mimika, Jl. Cenderawasih SP 3, Timika, Papua Tengah 99910.
            </p>
            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-[#57606a]">
              <div><strong className="text-[#1f2328]">Pos Pengawasan Pomako:</strong> Dermaga Pelabuhan Laut Pomako</div>
              <div><strong className="text-[#1f2328]">Pos Mozes Kilangin:</strong> Kargo Bandara Mozes Kilangin Timika</div>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};
