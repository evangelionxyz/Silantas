import React from 'react';
import { motion } from 'framer-motion';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { TableOfContents, type TocItem } from '../../components/layout/TableOfContents';
import { LOGIN_IMAGE, SUANGGI_BRAND } from '../../constants/brand';

const tocItems: TocItem[] = [
  { id: 'tujuan', title: 'Tujuan & Dasar Hukum' },
  { id: 'pos-pemeriksaan', title: 'Pos Pengawasan Resmi' },
  { id: 'tahapan-hewan', title: 'Pemeriksaan Hewan Hidup' },
  { id: 'tahapan-produk', title: 'Pemeriksaan Bahan Asal Hewan' },
  { id: 'tindakan-veteriner', title: 'Status & Tindakan Veteriner' },
  { id: 'skkh', title: 'Penerbitan SKKH' },
];

export const HealthCheckDoc: React.FC = () => {
  const vetImage = LOGIN_IMAGE;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Breadcrumbs items={[
        { label: `Layanan Publik ${SUANGGI_BRAND.name}`, href: '/' },
        { label: 'Pemeriksaan Kesehatan & SKKH' }
      ]} />

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex-1 flex items-start gap-8">
        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex-1 py-8 sm:py-10 docs-prose min-w-0"
        >
          <div className="not-prose bg-[#0c4a6e] text-white p-6 sm:p-8 mb-8 border border-[#0369a1] shadow-xs">
            <span className="inline-block px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider bg-[#38bdf8] text-[#082f49] mb-3">
              Inspeksi Veteriner &amp; Pemuktahiran Data &bull; {SUANGGI_BRAND.name}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2.5 leading-tight">
              Pemeriksaan Kesehatan Hewan dan Produk Peternakan
            </h1>
            <p className="text-sm sm:text-base text-[#e0f2fe] leading-relaxed m-0">
              Prosedur operasional standar inspeksi fisik, klinis, dan laboratorium oleh Dokter Hewan Berwenang sebelum hewan atau produk diizinkan beredar dan dimutakhirkan pada sistem {SUANGGI_BRAND.name}.
            </p>
          </div>

          {/* Veterinary Inspection Photo Showcase */}
          <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="overflow-hidden border border-[#7dd3fc] bg-white shadow-2xs flex flex-col">
              <div className="aspect-16/9 overflow-hidden bg-[#0c4a6e]">
                <img
                  src={vetImage.url}
                  alt={vetImage.alt}
                  width={vetImage.width}
                  height={vetImage.height}
                  fetchPriority="high"
                  className="w-full h-full object-cover object-[50%_58%]"
                />
              </div>
              <div className="p-3.5 bg-[#f0f9ff] flex-1">
                <div className="text-xs font-extrabold uppercase text-[#0369a1]">Inspeksi Klinis</div>
                <div className="font-bold text-sm text-[#1f2328]">
                  Pemeriksaan Fisik, Suhu Rektal &amp; Penanda Ear-Tag Ternak
                </div>
              </div>
            </div>

            <div className="overflow-hidden border border-[#86efac] bg-white shadow-2xs flex flex-col">
              <div className="aspect-16/9 overflow-hidden bg-[#14532d]">
                <img
                  src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80"
                  alt="Pengawasan kesehatan komoditas ternak sapi sehat di padang penggembalaan"
                  width={800}
                  height={450}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3.5 bg-[#f0fdf4] flex-1">
                <div className="text-xs font-extrabold uppercase text-[#15803d]">Biosekuriti Karantina</div>
                <div className="font-bold text-sm text-[#1f2328]">
                  Pengawasan Kesehatan Komoditas Ternak Sehat (ASUH)
                </div>
              </div>
            </div>
          </div>

          <section id="tujuan" className="mb-10">
            <h2>Tujuan &amp; Dasar Hukum</h2>
            <p>
              Pemeriksaan kesehatan veteriner pada sistem <strong>{SUANGGI_BRAND.name}</strong> bertujuan mencegah masuk, tersebar, dan keluarnya Hama dan Penyakit Hewan Menular (HPHM), zoonosis berbahaya (seperti Rabies, Antraks, PMK, dan Flu Burung), serta menjamin produk asal ternak memenuhi kriteria Aman, Sehat, Utuh, dan Halal (ASUH).
            </p>
          </section>

          <section id="pos-pemeriksaan" className="mb-10">
            <h2>Pos Pengawasan Resmi Kabupaten Mimika</h2>
            <p>
              Seluruh inspeksi wajib dilaksanakan di pos pintu gerbang resmi oleh Tim Pengawas Lalu Lintas {SUANGGI_BRAND.agency}:
            </p>
            <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="p-5 border border-[#7dd3fc] bg-[#f0f9ff] shadow-2xs">
                <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase bg-[#0369a1] text-white mb-2">
                  Jalur Maritim
                </span>
                <h4 className="font-extrabold text-base text-[#0c4a6e] mb-1.5">Pos Laut Pomako</h4>
                <p className="text-sm text-[#374151] m-0 leading-relaxed">
                  Melayani pengawasan kapal barang, peti kemas reefer, kapal tol laut, dan kapal ternak sandar di Pelabuhan Pomako.
                </p>
              </div>
              <div className="p-5 border border-[#86efac] bg-[#f0fdf4] shadow-2xs">
                <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase bg-[#15803d] text-white mb-2">
                  Jalur Dirgantara
                </span>
                <h4 className="font-extrabold text-base text-[#14532d] mb-1.5">Pos Udara Bandara Mozes Kilangin</h4>
                <p className="text-sm text-[#374151] m-0 leading-relaxed">
                  Melayani pengawasan kargo udara, DOC unggas komersial, sampel biologis, serta hewan peliharaan (HPR) yang diangkut maskapai.
                </p>
              </div>
            </div>
          </section>

          <section id="tahapan-hewan" className="mb-10">
            <h2>Pemeriksaan Hewan Hidup</h2>
            <p>
              Inspeksi hewan hidup dilakukan oleh Dokter Hewan atau Paramedik Veteriner meliputi tahapan sistematis:
            </p>
            <ul>
              <li><strong>Pemeriksaan Antemortem &amp; Fisik:</strong> Pengecekan keaktifan, nafsu makan, kondisi pernafasan, leleran hidung/mata, serta membran mukosa.</li>
              <li><strong>Pemeriksaan Suhu Rektal:</strong> Sapi normal (38.0&deg;C - 39.3&deg;C), Kambing (38.5&deg;C - 40.0&deg;C), Babi (38.5&deg;C - 39.5&deg;C).</li>
              <li><strong>Inspeksi Kuku, Mulut, dan Kulit:</strong> Memastikan tidak ada vesikel atau luka lepuh indikasi PMK, ruam eritema ASF pada babi, atau lesi antraks.</li>
              <li><strong>Verifikasi Dokumen Identitas:</strong> Pengecekan ear tag (tanda telinga ternak) yang terdaftar dan dimutakhirkan pada sistem {SUANGGI_BRAND.name}.</li>
            </ul>
          </section>

          <section id="tahapan-produk" className="mb-10">
            <h2>Pemeriksaan Bahan Asal Hewan</h2>
            <p>
              Untuk daging segar, daging beku, dan telur konsumsi:
            </p>
            <ul>
              <li><strong>Uji Organoleptik:</strong> Pemeriksaan warna daging, bau khas daging segar (tidak asam/busuk), dan konsistensi kekenyalan elastis.</li>
              <li><strong>Pemeriksaan Cangkang Telur:</strong> Cangkang bersih dari kotoran feses, tidak retak, dan tidak berbau busuk.</li>
              <li><strong>Verifikasi Suhu Rantai Dingin (Cold Chain):</strong> Pengecekan thermologger kontainer kontinyu untuk memastikan tidak terjadi pelelehan (thawing) daging beku selama perjalanan.</li>
            </ul>
          </section>

          <section id="tindakan-veteriner" className="mb-10">
            <h2>Status &amp; Tindakan Veteriner</h2>
            <div className="not-prose border border-[#0c4a6e] overflow-hidden my-5 shadow-2xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm text-[#1f2328]">
                  <thead className="bg-[#0c4a6e] text-white font-bold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Status Hasil ({SUANGGI_BRAND.name})</th>
                      <th className="py-3.5 px-4">Kondisi Fisik / Berkas</th>
                      <th className="py-3.5 px-4">Tindakan Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d0d7de]">
                    <tr className="hover:bg-[#f0fdf4]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-xs text-[#15803d]">INSPECTED_PASS (Lolos)</td>
                      <td className="py-3 px-4">Sehat klinis, dokumen lengkap, suhu cold chain terjaga.</td>
                      <td className="py-3 px-4">Diterbitkan surat pelepasan dan dicatat pada data Pemasukan/Pengeluaran.</td>
                    </tr>
                    <tr className="hover:bg-[#fffbeb]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-xs text-[#b45309]">PENDING / QUARANTINE</td>
                      <td className="py-3 px-4">Menunjukkan gejala demam ringan atau menunggu konfirmasi lab.</td>
                      <td className="py-3 px-4">Hewan ditahan di instalasi karantina transit selama 3-14 hari pengamatan.</td>
                    </tr>
                    <tr className="hover:bg-[#fef2f2]/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-xs text-[#cf222e]">INSPECTED_REJECT (Ditolak)</td>
                      <td className="py-3 px-4">Gejala klinis penyakit menular strategis atau daging busuk/ilegal.</td>
                      <td className="py-3 px-4">Penolakan kembali ke daerah asal atau pemusnahan sesuai prosedur.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="skkh" className="mb-10">
            <h2>Penerbitan Surat Keterangan Kesehatan Hewan (SKKH)</h2>
            <p>
              SKKH diterbitkan setelah hewan dinyatakan sehat secara sah oleh Dokter Hewan Berwenang {SUANGGI_BRAND.agency}. Dokumen ini memuat nomor registrasi {SUANGGI_BRAND.name}, identitas pemilik, jumlah ternak, jenis kelamin, serta riwayat vaksinasi.
            </p>
          </section>
        </motion.main>

        <TableOfContents items={tocItems} />
      </div>
    </div>
  );
};
