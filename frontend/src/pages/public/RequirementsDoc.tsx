import React from 'react';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { DocsSidebar } from '../../components/layout/DocsSidebar';
import { TableOfContents, type TocItem } from '../../components/layout/TableOfContents';

const tocItems: TocItem[] = [
  { id: 'ringkasan', title: 'Ringkasan Ketentuan' },
  { id: 'hewan-hidup', title: '1. Hewan Hidup' },
  { id: 'produk-hewan', title: '2. Produk Hewan Segar & Beku' },
  { id: 'produk-olahan', title: '3. Produk Olahan Hasil Peternakan' },
  { id: 'tabel-perbandingan', title: 'Matriks Persyaratan Dokumen' },
  { id: 'alur-pengajuan', title: 'Alur Pengajuan Rekomendasi' },
];

export const RequirementsDoc: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Breadcrumbs items={[
        { label: 'Layanan Publik', href: '/' },
        { label: 'Persyaratan Lalu Lintas' }
      ]} />

      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex">
        <DocsSidebar className="hidden lg:block" />

        <main className="flex-1 py-8 px-0 lg:px-10 max-w-4xl docs-prose">
          {/* Article Header */}
          <div className="border-b border-[#d0d7de] pb-6 mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-[#1f2328] mb-2">
              Persyaratan Lalu Lintas Hewan, Produk Hewan, dan Olahannya
            </h1>
            <p className="text-sm text-[#656d76]">
              Panduan lengkap berkas administrasi dan persyaratan teknis veteriner untuk pengeluaran (ekspor) dan pemasukan (impor) komoditas peternakan di Kabupaten Mimika.
            </p>
          </div>

          {/* Section: Ringkasan */}
          <section id="ringkasan" className="mb-10">
            <h2>Ringkasan Ketentuan</h2>
            <p>
              Berdasarkan Undang-Undang No. 18 Tahun 2009 jo. UU No. 41 Tahun 2014 tentang Peternakan dan Kesehatan Hewan, seluruh komoditas hewan, produk hewan, dan olahannya yang melintasi wilayah Kabupaten Mimika wajib memenuhi persyaratan kesehatan veteriner dan dilengkapi dokumen resmi dari dinas berwenang serta karantina pertanian.
            </p>
            <div className="p-4 rounded-md border-l-4 border-[#0969da] bg-[#f6f8fa] text-xs leading-relaxed text-[#1f2328] my-4">
              <strong>Penting:</strong> Wilayah Kabupaten Mimika berstatus bebas historis dari penyakit hewan menular strategis tertentu. Pemasukan hewan rentan (sapi, babi, unggas) dari daerah tertular atau zona merah dilarang demi menjaga status biosekuriti daerah.
            </div>
          </section>

          {/* Section: Hewan Hidup */}
          <section id="hewan-hidup" className="mb-10">
            <h2>1. Pemasukan & Pengeluaran Hewan Hidup</h2>
            <p>
              Komoditas hewan hidup mencakup ternak ruminansia (sapi, kambing, domba), ternak non-ruminansia (babi), unggas (ayam DOC, ayam potong, bebek), serta Hewan Penular Rabies / HPR (anjing, kucing, kera).
            </p>
            <ul>
              <li><strong>Surat Rekomendasi Pemasukan:</strong> Diterbitkan oleh Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika sebelum ternak diberangkatkan dari daerah asal.</li>
              <li><strong>Surat Keterangan Kesehatan Hewan (SKKH):</strong> Diterbitkan oleh dokter hewan berwenang di daerah asal yang masih berlaku (maksimal 3 hari sejak diterbitkan).</li>
              <li><strong>Sertifikat Pelepasan Karantina (KH-11):</strong> Diterbitkan oleh Balai Karantina Hewan di pelabuhan/bandara keberangkatan.</li>
              <li><strong>Bukti Uji Laboratorium:</strong> Hasil uji serologis bebas Penyakit Mulut dan Kuku (PMK), Avian Influenza (AI), African Swine Fever (ASF), atau titer antibodi rabies.</li>
              <li><strong>Tindakan Biosekuriti:</strong> Desinfeksi kendaraan angkut dan kandang transit saat tiba di Pos Pomako atau Pos Mozes Kilangin.</li>
            </ul>
          </section>

          {/* Section: Produk Hewan */}
          <section id="produk-hewan" className="mb-10">
            <h2>2. Produk Hewan Segar & Beku</h2>
            <p>
              Mencakup bahan asal hewan (BAH) seperti daging sapi beku, daging ayam beku, telur ayam ras/konsumsi, dan susu segar.
            </p>
            <ul>
              <li><strong>Surat Rekomendasi Pemasukan Produk Hewan:</strong> Diajukan oleh pelaku usaha distributor sebelum pengiriman kargo.</li>
              <li><strong>Sertifikat Sanitasi Produk Hewan (KH-12):</strong> Dari Balai Karantina Pertanian daerah pengirim.</li>
              <li><strong>Sertifikat Nomor Kontrol Veteriner (NKV):</strong> Bukti bahwa Rumah Potong Hewan (RPH) atau unit usaha asal telah memenuhi syarat higiene dan sanitasi higienis.</li>
              <li><strong>Sertifikat Halal:</strong> Wajib untuk seluruh produk daging potong dan karkas unggas konsumsi.</li>
              <li><strong>Kepatuhan Cold Chain:</strong> Suhu kontainer reefer terjaga maksimal -18&deg;C untuk daging beku dan 4&deg;C - 10&deg;C untuk produk dingin selama pelayaran.</li>
            </ul>
          </section>

          {/* Section: Produk Olahan */}
          <section id="produk-olahan" className="mb-10">
            <h2>3. Produk Olahan Hasil Peternakan</h2>
            <p>
              Mencakup hasil bahan asal hewan (HBAH) olahan seperti sosis, nugget, bakso, kornet kemasan kaleng, keju, serta olahan pakan/bulu hewan.
            </p>
            <ul>
              <li><strong>Izin Edar BPOM (MD / ML):</strong> Produk kemasan wajib terdaftar resmi dan memiliki masa kedaluwarsa yang aman.</li>
              <li><strong>Dokumen Asal Pengiriman & Faktur:</strong> Menyatakan kuantitas, nomor batch, dan tanggal produksi yang sesuai fisik kargo.</li>
              <li><strong>Pemeriksaan Fisik Kemasan:</strong> Kemasan utuh, kedap udara, tidak kembung, dan lolos uji organoleptik di pos pemeriksaan pelabuhan.</li>
            </ul>
          </section>

          {/* Section: Tabel Matriks Dokumen - Matching screenshot 2 */}
          <section id="tabel-perbandingan" className="mb-10">
            <h2>Matriks Persyaratan Dokumen</h2>
            <p>
              Tabel perbandingan kewajiban dokumen berdasarkan kategori komoditas dan tipe lalu lintas:
            </p>

            <div className="overflow-x-auto my-4 border border-[#d0d7de] rounded-md">
              <table className="w-full text-left text-xs text-[#1f2328]">
                <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] font-semibold text-[#1f2328]">
                  <tr>
                    <th className="py-2.5 px-3">Jenis Dokumen Persyaratan</th>
                    <th className="py-2.5 px-3 text-center">Hewan Hidup</th>
                    <th className="py-2.5 px-3 text-center">Produk Segar / Beku</th>
                    <th className="py-2.5 px-3 text-center">Produk Olahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  <tr className="hover:bg-[#f6f8fa]/50">
                    <td className="py-2 px-3 font-medium">Surat Rekomendasi Pemasukan / Pengeluaran Dinas</td>
                    <td className="py-2 px-3 text-center text-[#1a7f37] font-bold">&#10003; Wajib</td>
                    <td className="py-2 px-3 text-center text-[#1a7f37] font-bold">&#10003; Wajib</td>
                    <td className="py-2 px-3 text-center text-[#656d76]">&#10005; Opsional</td>
                  </tr>
                  <tr className="hover:bg-[#f6f8fa]/50">
                    <td className="py-2 px-3 font-medium">Surat Keterangan Kesehatan Hewan (SKKH)</td>
                    <td className="py-2 px-3 text-center text-[#1a7f37] font-bold">&#10003; Wajib</td>
                    <td className="py-2 px-3 text-center text-[#656d76]">&#10005; Tidak</td>
                    <td className="py-2 px-3 text-center text-[#656d76]">&#10005; Tidak</td>
                  </tr>
                  <tr className="hover:bg-[#f6f8fa]/50">
                    <td className="py-2 px-3 font-medium">Sertifikat Pelepasan Karantina (KH-11 / KH-12)</td>
                    <td className="py-2 px-3 text-center text-[#1a7f37] font-bold">&#10003; Wajib</td>
                    <td className="py-2 px-3 text-center text-[#1a7f37] font-bold">&#10003; Wajib</td>
                    <td className="py-2 px-3 text-center text-[#656d76]">&#10005; Tidak</td>
                  </tr>
                  <tr className="hover:bg-[#f6f8fa]/50">
                    <td className="py-2 px-3 font-medium">Sertifikat Uji Bebas Penyakit Menular (PMK / AI / ASF)</td>
                    <td className="py-2 px-3 text-center text-[#1a7f37] font-bold">&#10003; Wajib</td>
                    <td className="py-2 px-3 text-center text-[#1a7f37] font-bold">&#10003; Sesuai Kategori</td>
                    <td className="py-2 px-3 text-center text-[#656d76]">&#10005; Tidak</td>
                  </tr>
                  <tr className="hover:bg-[#f6f8fa]/50">
                    <td className="py-2 px-3 font-medium">Sertifikat Halal & Nomor Kontrol Veteriner (NKV)</td>
                    <td className="py-2 px-3 text-center text-[#656d76]">&#10005; Tidak</td>
                    <td className="py-2 px-3 text-center text-[#1a7f37] font-bold">&#10003; Wajib</td>
                    <td className="py-2 px-3 text-center text-[#1a7f37] font-bold">&#10003; Wajib (Halal)</td>
                  </tr>
                  <tr className="hover:bg-[#f6f8fa]/50">
                    <td className="py-2 px-3 font-medium">Izin Edar BPOM (MD / ML)</td>
                    <td className="py-2 px-3 text-center text-[#656d76]">&#10005; Tidak</td>
                    <td className="py-2 px-3 text-center text-[#656d76]">&#10005; Tidak</td>
                    <td className="py-2 px-3 text-center text-[#1a7f37] font-bold">&#10003; Wajib</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section: Alur Pengajuan */}
          <section id="alur-pengajuan" className="mb-10">
            <h2>Alur Pengajuan Rekomendasi</h2>
            <ol className="list-decimal pl-5 space-y-2 text-xs text-[#31373d]">
              <li>Pelaku usaha atau peternak menyiapkan berkas izin asal dan sertifikat vaksinasi/uji lab.</li>
              <li>Menghubungi petugas SI-LANTAS via loket pelayanan atau melalui <strong>WhatsApp Business Resmi</strong>.</li>
              <li>Petugas verifikator melakukan penelaahan berkas kesehatan dan kapasitas instalasi karantina tujuan di Mimika.</li>
              <li>Setelah rekomendasi dinas diterbitkan, komoditas dapat diberangkatkan menuju Pelabuhan Pomako atau Bandara Mozes Kilangin untuk inspeksi fisik kedatangan.</li>
            </ol>
          </section>
        </main>

        <TableOfContents items={tocItems} />
      </div>
    </div>
  );
};
