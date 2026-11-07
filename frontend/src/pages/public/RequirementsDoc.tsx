import React from 'react';
import { motion } from 'framer-motion';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { TableOfContents, type TocItem } from '../../components/layout/TableOfContents';
import { PUBLIC_COMMODITY_IMAGES, SUANGGI_BRAND } from '../../constants/brand';

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
    <div className="min-h-screen bg-[#f7f6f1] flex flex-col">
      <Breadcrumbs items={[
        { label: `Layanan Publik ${SUANGGI_BRAND.name}`, href: '/' },
        { label: 'Persyaratan Lalu Lintas' }
      ]} />

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex-1">
        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="py-8 sm:py-10 docs-prose min-w-0"
        >
          {/* Colorful Article Header Banner */}
          <div className="not-prose bg-[#14532d] text-white p-6 sm:p-8 mb-8 border border-[#166534] shadow-xs">
            <span className="inline-block px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider bg-[#f59e0b] text-[#1f2328] mb-3">
              Panduan Pemasukan &amp; Pengeluaran &bull; {SUANGGI_BRAND.name}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2.5 leading-tight">
              Persyaratan Lalu Lintas Hewan, Produk Hewan, dan Olahannya
            </h1>
            <p className="text-sm sm:text-base text-[#dcfce7] leading-relaxed m-0">
              Panduan resmi berkas administrasi dan persyaratan teknis veteriner untuk pemasukan (data hewan/produk masuk) dan pengeluaran (data hewan/produk keluar) di wilayah Kabupaten Mimika.
            </p>
          </div>

          {/* Commodity Photo Strip */}
          <div className="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="overflow-hidden border border-[#86efac] bg-white shadow-2xs">
              <div className="aspect-16/10 bg-[#14532d]">
                <img
                  src={PUBLIC_COMMODITY_IMAGES.liveAnimals.url}
                  alt={PUBLIC_COMMODITY_IMAGES.liveAnimals.alt}
                  width={PUBLIC_COMMODITY_IMAGES.liveAnimals.width}
                  height={PUBLIC_COMMODITY_IMAGES.liveAnimals.height}
                  fetchPriority="high"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 bg-[#f0fdf4]">
                <div className="text-xs font-extrabold uppercase text-[#15803d]">Kategori 01</div>
                <div className="font-bold text-sm text-[#1f2328]">Hewan Hidup &amp; Ternak</div>
              </div>
            </div>

            <div className="overflow-hidden border border-[#7dd3fc] bg-white shadow-2xs">
              <div className="aspect-16/10 bg-[#0c4a6e]">
                <img
                  src={PUBLIC_COMMODITY_IMAGES.freshFrozenProducts.url}
                  alt={PUBLIC_COMMODITY_IMAGES.freshFrozenProducts.alt}
                  width={PUBLIC_COMMODITY_IMAGES.freshFrozenProducts.width}
                  height={PUBLIC_COMMODITY_IMAGES.freshFrozenProducts.height}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 bg-[#f0f9ff]">
                <div className="text-xs font-extrabold uppercase text-[#0369a1]">Kategori 02</div>
                <div className="font-bold text-sm text-[#1f2328]">Daging Segar &amp; Rantai Dingin</div>
              </div>
            </div>

            <div className="overflow-hidden border border-[#fcd34d] bg-white shadow-2xs">
              <div className="aspect-16/10 bg-[#78350f]">
                <img
                  src={PUBLIC_COMMODITY_IMAGES.eggsAndProcessed.url}
                  alt={PUBLIC_COMMODITY_IMAGES.eggsAndProcessed.alt}
                  width={PUBLIC_COMMODITY_IMAGES.eggsAndProcessed.width}
                  height={PUBLIC_COMMODITY_IMAGES.eggsAndProcessed.height}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 bg-[#fffbeb]">
                <div className="text-xs font-extrabold uppercase text-[#b45309]">Kategori 03</div>
                <div className="font-bold text-sm text-[#1f2328]">Telur &amp; Produk Olahan</div>
              </div>
            </div>
          </div>

          {/* Section: Ringkasan */}
          <section id="ringkasan" className="mb-10">
            <h2>Ringkasan Ketentuan</h2>
            <p>
              Berdasarkan Undang-Undang No. 18 Tahun 2009 jo. UU No. 41 Tahun 2014 tentang Peternakan dan Kesehatan Hewan, seluruh komoditas hewan, produk hewan, dan olahannya yang melintasi wilayah Kabupaten Mimika wajib memenuhi persyaratan kesehatan veteriner dan tercatat dalam sistem <strong>{SUANGGI_BRAND.name}</strong> ({SUANGGI_BRAND.fullName}).
            </p>
            <div className="p-4 sm:p-5 border-l-4 border-[#15803d] bg-[#f0fdf4] text-sm sm:text-base leading-relaxed text-[#14532d] my-4 shadow-2xs">
              <strong className="text-[#15803d]">Kebijakan Biosekuriti Daerah:</strong> Wilayah Kabupaten Mimika berstatus bebas historis dari penyakit hewan menular strategis tertentu. Pemasukan hewan rentan (sapi, babi, unggas) dari daerah tertular atau zona merah dilarang demi menjaga keamanan hayati peternakan lokal.
            </div>
          </section>

          {/* Section: Hewan Hidup */}
          <section id="hewan-hidup" className="mb-10">
            <h2>1. Pemasukan &amp; Pengeluaran Hewan Hidup</h2>
            <p>
              Komoditas hewan hidup mencakup ternak ruminansia (sapi, kambing, domba), ternak non-ruminansia (babi), unggas (ayam DOC, ayam potong, bebek), serta Hewan Penular Rabies / HPR (anjing, kucing, kera).
            </p>
            <ul>
              <li><strong>Surat Rekomendasi Pemasukan/Pengeluaran:</strong> Diterbitkan oleh Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika sebelum ternak diberangkatkan dari daerah asal.</li>
              <li><strong>Surat Keterangan Kesehatan Hewan (SKKH):</strong> Diterbitkan oleh dokter hewan berwenang di daerah asal yang masih berlaku (maksimal 3 hari sejak diterbitkan).</li>
              <li><strong>Sertifikat Pelepasan Karantina (KH-11):</strong> Diterbitkan oleh Balai Karantina Hewan di pelabuhan/bandara keberangkatan.</li>
              <li><strong>Bukti Uji Laboratorium:</strong> Hasil uji serologis bebas Penyakit Mulut dan Kuku (PMK), Avian Influenza (AI), African Swine Fever (ASF), atau titer antibodi rabies.</li>
              <li><strong>Tindakan Biosekuriti:</strong> Desinfeksi kendaraan angkut dan kandang transit saat tiba di Pos Pomako atau Pos Mozes Kilangin.</li>
            </ul>
          </section>

          {/* Section: Produk Hewan */}
          <section id="produk-hewan" className="mb-10">
            <h2>2. Produk Hewan Segar &amp; Beku</h2>
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
              <li><strong>Dokumen Asal Pengiriman &amp; Faktur:</strong> Menyatakan kuantitas, nomor batch, dan tanggal produksi yang sesuai fisik kargo.</li>
              <li><strong>Pemeriksaan Fisik Kemasan:</strong> Kemasan utuh, kedap udara, tidak kembung, dan lolos uji organoleptik di pos pemeriksaan pelabuhan.</li>
            </ul>
          </section>

          {/* Section: Tabel Matriks Dokumen */}
          <section id="tabel-perbandingan" className="mb-10">
            <h2>Matriks Persyaratan Dokumen</h2>
            <p>
              Tabel perbandingan kewajiban dokumen berdasarkan kategori komoditas dan tipe lalu lintas pada sistem {SUANGGI_BRAND.name}:
            </p>

            <div className="overflow-x-auto my-5 border border-[#14532d] shadow-2xs not-prose">
              <table className="w-full min-w-[650px] text-left text-sm text-[#1f2328] bg-white">
                <thead className="bg-[#14532d] text-white font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Jenis Dokumen Persyaratan</th>
                    <th className="py-3.5 px-4 text-center">Hewan Hidup</th>
                    <th className="py-3.5 px-4 text-center">Produk Segar / Beku</th>
                    <th className="py-3.5 px-4 text-center">Produk Olahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  <tr className="hover:bg-[#f0fdf4]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold">Surat Rekomendasi Pemasukan / Pengeluaran Dinas</td>
                    <td className="py-3 px-4 text-center text-[#15803d] font-bold">&#10003; Wajib</td>
                    <td className="py-3 px-4 text-center text-[#15803d] font-bold">&#10003; Wajib</td>
                    <td className="py-3 px-4 text-center text-[#57606a]">&#10005; Opsional</td>
                  </tr>
                  <tr className="hover:bg-[#f0fdf4]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold">Surat Keterangan Kesehatan Hewan (SKKH)</td>
                    <td className="py-3 px-4 text-center text-[#15803d] font-bold">&#10003; Wajib</td>
                    <td className="py-3 px-4 text-center text-[#57606a]">&#10005; Tidak</td>
                    <td className="py-3 px-4 text-center text-[#57606a]">&#10005; Tidak</td>
                  </tr>
                  <tr className="hover:bg-[#f0fdf4]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold">Sertifikat Pelepasan Karantina (KH-11 / KH-12)</td>
                    <td className="py-3 px-4 text-center text-[#15803d] font-bold">&#10003; Wajib</td>
                    <td className="py-3 px-4 text-center text-[#15803d] font-bold">&#10003; Wajib</td>
                    <td className="py-3 px-4 text-center text-[#57606a]">&#10005; Tidak</td>
                  </tr>
                  <tr className="hover:bg-[#f0fdf4]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold">Sertifikat Uji Bebas Penyakit Menular (PMK / AI / ASF)</td>
                    <td className="py-3 px-4 text-center text-[#15803d] font-bold">&#10003; Wajib</td>
                    <td className="py-3 px-4 text-center text-[#0369a1] font-bold">&#10003; Sesuai Kategori</td>
                    <td className="py-3 px-4 text-center text-[#57606a]">&#10005; Tidak</td>
                  </tr>
                  <tr className="hover:bg-[#f0fdf4]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold">Sertifikat Halal &amp; Nomor Kontrol Veteriner (NKV)</td>
                    <td className="py-3 px-4 text-center text-[#57606a]">&#10005; Tidak</td>
                    <td className="py-3 px-4 text-center text-[#15803d] font-bold">&#10003; Wajib</td>
                    <td className="py-3 px-4 text-center text-[#15803d] font-bold">&#10003; Wajib (Halal)</td>
                  </tr>
                  <tr className="hover:bg-[#f0fdf4]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold">Izin Edar BPOM (MD / ML)</td>
                    <td className="py-3 px-4 text-center text-[#57606a]">&#10005; Tidak</td>
                    <td className="py-3 px-4 text-center text-[#57606a]">&#10005; Tidak</td>
                    <td className="py-3 px-4 text-center text-[#15803d] font-bold">&#10003; Wajib</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section: Alur Pengajuan */}
          <section id="alur-pengajuan" className="mb-10">
            <h2>Alur Pengajuan Rekomendasi</h2>
            <ol className="list-decimal pl-6 space-y-3 text-sm sm:text-base text-[#24292f] leading-relaxed">
              <li>Pelaku usaha atau peternak menyiapkan berkas izin asal dan sertifikat vaksinasi/uji lab.</li>
              <li>Menghubungi petugas {SUANGGI_BRAND.name} via loket pelayanan atau melalui <strong>WhatsApp Business Resmi {SUANGGI_BRAND.name}</strong>.</li>
              <li>Petugas verifikator melakukan penelaahan berkas kesehatan dan kapasitas instalasi karantina tujuan di Mimika.</li>
              <li>Setelah rekomendasi dinas diterbitkan, komoditas dapat diberangkatkan menuju Pelabuhan Pomako atau Bandara Mozes Kilangin untuk inspeksi fisik kedatangan dan pencatatan data terpadu.</li>
            </ol>
          </section>
        </motion.main>

        <TableOfContents items={tocItems} />
      </div>
    </div>
  );
};
