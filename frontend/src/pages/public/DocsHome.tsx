import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import {
  LIVESTOCK_HERO_IMAGE,
  PUBLIC_COMMODITY_IMAGES,
  SUANGGI_BRAND,
  SUANGGI_CORE_FEATURES,
} from '../../constants/brand';

export const DocsHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Breadcrumbs items={[{ label: `Tentang ${SUANGGI_BRAND.name}` }]} />

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex-1">
        {/* Center Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="py-7 sm:py-10 min-w-0"
        >
          {/* Colorful Hero Banner with Livestock Photography */}
          <section className="overflow-hidden bg-[#173d22] text-white border border-[#173d22] shadow-sm mb-10">
            <div className="grid grid-cols-1 xl:grid-cols-12">
              {/* Left Text Column */}
              <div className="xl:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {SUANGGI_BRAND.mottoParts.map((part) => (
                      <span
                        key={part}
                        className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider bg-[#f59e0b] text-[#1f2328]"
                      >
                        {part}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                    {SUANGGI_BRAND.name}
                  </h1>
                  <p className="text-base sm:text-xl font-bold text-[#bbf7d0] mt-1.5 tracking-wide">
                    {SUANGGI_BRAND.fullName}
                  </p>

                  <blockquote className="mt-4 p-3.5 bg-[#0f3923] border-l-4 border-[#f59e0b] text-sm sm:text-base font-semibold text-[#fef3c7]">
                    &ldquo;{SUANGGI_BRAND.slogan}&rdquo;
                  </blockquote>

                  <p className="text-sm sm:text-base text-[#dcfce7] leading-relaxed mt-4">
                    Portal informasi dan pengawasan terpadu lalu lintas hewan hidup, bahan asal hewan (BAH), serta hasil bahan asal hewan (HBAH) pada pintu pemasukan dan pengeluaran resmi {SUANGGI_BRAND.agency}.
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-[#166534] flex flex-wrap items-center gap-3">
                  <Link
                    to="/persyaratan"
                    className="px-4 py-2.5 text-sm font-bold bg-[#f59e0b] hover:bg-[#d97706] text-[#1f2328] transition-colors shadow-xs"
                  >
                    Panduan Persyaratan Dokumen
                  </Link>
                  <Link
                    to="/pemeriksaan"
                    className="px-4 py-2.5 text-sm font-semibold bg-[#166534] hover:bg-[#15803d] text-white border border-[#4ade80]/40 transition-colors"
                  >
                    Prosedur Pemeriksaan &amp; SKKH
                  </Link>
                  <Link
                    to="/konsultasi"
                    className="px-4 py-2.5 text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    Konsultasi WhatsApp Petugas
                  </Link>
                </div>
              </div>

              {/* Right Hero Image Column */}
              <div className="xl:col-span-5 bg-[#173d22] flex flex-col justify-between p-0 sm:p-5 gap-3">
                <div className="relative overflow-hidden bg-[#14532d] aspect-16/10">
                  <img
                    src={LIVESTOCK_HERO_IMAGE.url}
                    alt={LIVESTOCK_HERO_IMAGE.alt}
                    width={LIVESTOCK_HERO_IMAGE.width}
                    height={LIVESTOCK_HERO_IMAGE.height}
                    fetchPriority="high"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 px-3.5 py-2 text-xs text-white flex items-center justify-between">
                    <span className="font-semibold truncate">{LIVESTOCK_HERO_IMAGE.caption}</span>
                    <span className="px-2 py-0.5 bg-[#15803d] text-[10px] font-bold uppercase shrink-0 ml-2">
                      {LIVESTOCK_HERO_IMAGE.categoryLabel}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:grid grid-cols-2 gap-3">
                  <div className="overflow-hidden border border-[#55704c] bg-[#14532d] relative aspect-16/10">
                    <img
                      src={PUBLIC_COMMODITY_IMAGES.liveAnimals.url}
                      alt={PUBLIC_COMMODITY_IMAGES.liveAnimals.alt}
                      width={PUBLIC_COMMODITY_IMAGES.liveAnimals.width}
                      height={PUBLIC_COMMODITY_IMAGES.liveAnimals.height}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white truncate">
                      Karantina Ternak Hidup
                    </div>
                  </div>
                  <div className="overflow-hidden border border-[#55704c] bg-[#14532d] relative aspect-16/10">
                    <img
                      src={PUBLIC_COMMODITY_IMAGES.eggsAndProcessed.url}
                      alt={PUBLIC_COMMODITY_IMAGES.eggsAndProcessed.alt}
                      width={PUBLIC_COMMODITY_IMAGES.eggsAndProcessed.width}
                      height={PUBLIC_COMMODITY_IMAGES.eggsAndProcessed.height}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white truncate">
                      Produk Hewan &amp; Telur ASUH
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4 Fitur Utama SUANGGI Section */}
          <section id="fitur-utama" className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
                  Pilar Sistem Informasi Terpadu
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#4b5563]">
                {SUANGGI_BRAND.motto} &bull; Kab. Mimika
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {SUANGGI_CORE_FEATURES.map((feature) => (
                <div
                  key={feature.id}
                  className="border overflow-hidden shadow-sm flex flex-col sm:flex-row bg-white transition-shadow hover:shadow-md"
                  style={{ borderColor: feature.borderColor }}
                >
                  <div className="sm:w-44 w-77 bg-[#14532d]">
                    <img
                      src={feature.imageUrl}
                      alt={feature.imageAlt}
                      width={400}
                      height={300}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className="p-4 sm:p-5 flex-1 flex flex-col justify-between"
                    style={{ backgroundColor: feature.bgLight }}
                  >
                    <div>
                      <span
                        className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 text-white mb-2"
                        style={{ backgroundColor: feature.accentColor }}
                      >
                        {feature.badge}
                      </span>
                      <h3 className="text-lg sm:text-xl font-extrabold text-[#1f2328]">
                        {feature.title}
                      </h3>
                      <p className="text-sm sm:text-base font-medium text-[#374151] mt-1 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-black/10 text-xs font-semibold text-[#4b5563]">
                      Terintegrasi pada Pos Pomako &amp; Bandara Mozes Kilangin
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Quarantine Notice Alert */}
          <div className="mb-10 p-4 sm:p-5 border border-[#fcd34d] bg-[#fffbeb] flex items-start gap-3.5 text-sm sm:text-base leading-relaxed text-[#78350f] shadow-2xs">
            <svg
              className="w-6 h-6 text-[#b45309] shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <span className="font-extrabold text-[#78350f]">Pemberitahuan Pelayanan {SUANGGI_BRAND.name}:</span>{' '}
              Seluruh pemasukan dan pengeluaran hewan, bahan asal hewan (BAH), dan hasil bahan asal hewan (HBAH) melalui pintu Pelabuhan Laut Pomako dan Bandara Mozes Kilangin wajib disertai dokumen karantina dan SKKH yang sah.
            </div>
          </div>

          {/* Colorful Service Guide Cards */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1f2328] mb-4">
              Panduan Layanan Masyarakat &amp; Pelaku Usaha
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1 */}
              <Link
                to="/persyaratan"
                className="group border border-[#86efac] bg-white hover:bg-[#f0fdf4]/60 p-5 transition-colors flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-[#dcfce7] text-[#14532d]">
                      Panduan 01 &bull; Administrasi
                    </span>
                    <span className="text-xs font-bold text-[#15803d] group-hover:underline">
                      Buka panduan
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#14532d] group-hover:text-[#15803d]">
                    Persyaratan Lalu Lintas Hewan &amp; Produk Olahan
                  </h3>
                  <p className="text-sm text-[#4b5563] mt-2 leading-relaxed">
                    Daftar lengkap dokumen administrasi, izin pemasukan (impor) dan pengeluaran (ekspor) untuk ternak besar, unggas, daging beku, telur, dan produk olahan.
                  </p>
                </div>
              </Link>

              {/* Card 2 */}
              <Link
                to="/pemeriksaan"
                className="group border border-[#7dd3fc] bg-white hover:bg-[#f0f9ff]/60 p-5 transition-colors flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-[#e0f2fe] text-[#0369a1]">
                      Panduan 02 &bull; Veteriner
                    </span>
                    <span className="text-xs font-bold text-[#0369a1] group-hover:underline">
                      Buka panduan
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0c4a6e] group-hover:text-[#0369a1]">
                    Pemeriksaan Kesehatan Hewan &amp; Penerbitan SKKH
                  </h3>
                  <p className="text-sm text-[#4b5563] mt-2 leading-relaxed">
                    Standar operasional prosedur pemeriksaan klinis, pengujian sampel laboratorium, tindakan karantina di pos pengawasan, dan penerbitan Surat Keterangan Kesehatan Hewan.
                  </p>
                </div>
              </Link>

              {/* Card 3 */}
              <Link
                to="/isikhnas"
                className="group border border-[#fcd34d] bg-white hover:bg-[#fffbeb]/60 p-5 transition-colors flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-[#fef3c7] text-[#92400e]">
                      Panduan 03 &bull; Integrasi Data
                    </span>
                    <span className="text-xs font-bold text-[#b45309] group-hover:underline">
                      Buka status
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#78350f] group-hover:text-[#b45309]">
                    Status Portal Nasional &amp; Pencatatan Mandiri {SUANGGI_BRAND.name}
                  </h3>
                  <p className="text-sm text-[#4b5563] mt-2 leading-relaxed">
                    Informasi status operasional portal lalu lintas nasional iSIKHNAS serta alur verifikasi dan pemuktahiran data melalui sistem {SUANGGI_BRAND.name} Kabupaten Mimika.
                  </p>
                </div>
              </Link>

              {/* Card 4 */}
              <Link
                to="/konsultasi"
                className="group border border-[#5eead4] bg-white hover:bg-[#f0fdfa]/60 p-5 transition-colors flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-[#ccfbf1] text-[#115e59]">
                      Panduan 04 &bull; Layanan Cepat
                    </span>
                    <span className="text-xs font-bold text-[#0f766e] group-hover:underline">
                      Buka kontak
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#134e4a] group-hover:text-[#0f766e]">
                    Konsultasi &amp; Chatting WhatsApp Business {SUANGGI_BRAND.name}
                  </h3>
                  <p className="text-sm text-[#4b5563] mt-2 leading-relaxed">
                    Layanan komunikasi langsung dengan Administrator dan Petugas Verifikasi {SUANGGI_BRAND.name} melalui saluran resmi WhatsApp Business untuk bantuan teknis dan konfirmasi berkas.
                  </p>
                </div>
              </Link>
            </div>
          </section>

          {/* Contact / Office Footer */}
          <div className="bg-white p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 mb-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
                  Instansi Penyelenggara Resmi
                </span>
                <h3 className="font-extrabold text-lg sm:text-xl text-[#14532d] mt-0.5">
                  {SUANGGI_BRAND.agency}
                </h3>
                <p className="text-sm text-[#374151] mt-1">
                  Kompleks Perkantoran Pemerintah Daerah Kabupaten Mimika, Jl. Cenderawasih SP 3, Timika, Papua Tengah 99910.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
              <div>
                <div className="text-xs font-extrabold uppercase text-[#0369a1] mb-0.5">
                  Pos Pengawasan Laut Pomako
                </div>
                <div className="font-semibold text-[#1f2328]">
                  Dermaga Pelabuhan Laut Pomako, Distrik Mimika Timur Jauh
                </div>
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase text-[#15803d] mb-0.5">
                  Pos Pengawasan Udara Mozes Kilangin
                </div>
                <div className="font-semibold text-[#1f2328]">
                  Terminal Kargo Bandara Mozes Kilangin Timika
                </div>
              </div>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};
