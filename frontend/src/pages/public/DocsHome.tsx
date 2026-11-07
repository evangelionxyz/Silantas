import React from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { DocsSidebar } from '../../components/layout/DocsSidebar';

export const DocsHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Breadcrumbs items={[{ label: 'Tentang SI-LANTAS' }]} />

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex">
        {/* Left Sidebar */}
        <DocsSidebar className="hidden lg:block" />

        {/* Center Main Content */}
        <main className="flex-1 py-8 px-0 lg:px-10">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-[#1f2328] mb-2">
              SI-LANTAS HEWAN MIMIKA
            </h1>
            <p className="text-base text-[#656d76] leading-relaxed">
              Sistem Informasi Pelayanan Lalu Lintas Hewan, Produk Hewan, dan Olahan Peternakan.
              Layanan resmi Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika, Papua Tengah.
            </p>
          </div>

          {/* Quick Notice Alert */}
          <div className="mb-8 p-4 rounded-md border border-[#d0d7de] bg-[#f6f8fa] flex items-start gap-3 text-xs leading-relaxed text-[#1f2328]">
            <svg className="w-5 h-5 text-[#0969da] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-semibold text-[#1f2328]">Pemberitahuan Pelayanan:</span> Seluruh pemasukan dan pengeluaran hewan, bahan asal hewan (BAH), dan hasil bahan asal hewan (HBAH) melalui pintu Pelabuhan Laut Pomako dan Bandara Mozes Kilangin wajib disertai dokumen karantina dan SKKH yang sah.
            </div>
          </div>

          {/* Service Cards Grid - Matching GitHub Docs Landing Cards */}
          <div className="divide-y divide-[#d0d7de] border-y border-[#d0d7de] mb-12">
            {/* Card 1 */}
            <div className="py-5">
              <Link
                to="/persyaratan"
                className="text-base font-semibold text-[#0969da] hover:underline flex items-center justify-between group"
              >
                <span>Persyaratan Lalu Lintas Hewan & Produk Olahan</span>
                <span className="text-[#656d76] text-xs font-normal group-hover:text-[#0969da]">Buka panduan &rarr;</span>
              </Link>
              <p className="text-xs text-[#656d76] mt-1 leading-normal">
                Daftar lengkap persyaratan dokumen administrasi, izin pemasukan (impor) dan pengeluaran (ekspor) untuk ternak besar, unggas, daging beku, telur, dan produk olahan.
              </p>
            </div>

            {/* Card 2 */}
            <div className="py-5">
              <Link
                to="/pemeriksaan"
                className="text-base font-semibold text-[#0969da] hover:underline flex items-center justify-between group"
              >
                <span>Pemeriksaan Kesehatan Hewan & Penerbitan SKKH</span>
                <span className="text-[#656d76] text-xs font-normal group-hover:text-[#0969da]">Buka panduan &rarr;</span>
              </Link>
              <p className="text-xs text-[#656d76] mt-1 leading-normal">
                Standar operasional prosedur pemeriksaan klinis, pengujian sampel laboratorium, tindakan karantina di pos pengawasan, dan penerbitan Surat Keterangan Kesehatan Hewan.
              </p>
            </div>

            {/* Card 3 */}
            <div className="py-5">
              <Link
                to="/isikhnas"
                className="text-base font-semibold text-[#0969da] hover:underline flex items-center justify-between group"
              >
                <span>Status & Prosedur Portal lalin.isikhnas.co.id</span>
                <span className="text-[#656d76] text-xs font-normal group-hover:text-[#0969da]">Buka status &rarr;</span>
              </Link>
              <p className="text-xs text-[#656d76] mt-1 leading-normal">
                Informasi status operasional portal lalu lintas nasional iSIKHNAS serta alur alternatif verifikasi manual oleh petugas karantina Dinas Kabupaten Mimika.
              </p>
            </div>

            {/* Card 4 */}
            <div className="py-5">
              <Link
                to="/konsultasi"
                className="text-base font-semibold text-[#0969da] hover:underline flex items-center justify-between group"
              >
                <span>Konsultasi & Chatting WhatsApp Business</span>
                <span className="text-[#656d76] text-xs font-normal group-hover:text-[#0969da]">Buka kontak &rarr;</span>
              </Link>
              <p className="text-xs text-[#656d76] mt-1 leading-normal">
                Layanan komunikasi langsung dengan Administrator dan Petugas Verifikasi SI-LANTAS melalui saluran resmi WhatsApp Business untuk bantuan teknis dan konfirmasi berkas.
              </p>
            </div>
          </div>

          {/* Contact / Office Footer */}
          <div className="border border-[#d0d7de] rounded-md p-5 bg-[#f6f8fa]">
            <h3 className="font-semibold text-sm text-[#1f2328] mb-2">
              Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika
            </h3>
            <p className="text-xs text-[#656d76] leading-relaxed mb-3">
              Kompleks Perkantoran Pemerintah Daerah Kabupaten Mimika, Jl. Cenderawasih SP 3, Timika, Papua Tengah 99910.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-[#656d76]">
              <div><strong>Pos Pengawasan Pomako:</strong> Dermaga Pelabuhan Laut Pomako</div>
              <div><strong>Pos Mozes Kilangin:</strong> Kargo Bandara Mozes Kilangin Timika</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
