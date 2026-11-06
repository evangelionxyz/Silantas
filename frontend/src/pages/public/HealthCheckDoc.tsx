import React from 'react';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { DocsSidebar } from '../../components/layout/DocsSidebar';
import { TableOfContents, type TocItem } from '../../components/layout/TableOfContents';

const tocItems: TocItem[] = [
  { id: 'tujuan', title: 'Tujuan & Dasar Hukum' },
  { id: 'pos-pemeriksaan', title: 'Pos Pengawasan Resmi' },
  { id: 'tahapan-hewan', title: 'Pemeriksaan Hewan Hidup' },
  { id: 'tahapan-produk', title: 'Pemeriksaan Bahan Asal Hewan' },
  { id: 'tindakan-veteriner', title: 'Status & Tindakan Veteriner' },
  { id: 'skkh', title: 'Penerbitan SKKH' },
];

export const HealthCheckDoc: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Breadcrumbs items={[
        { label: 'Layanan Publik', href: '/' },
        { label: 'Pemeriksaan Kesehatan & SKKH' }
      ]} />

      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex">
        <DocsSidebar className="hidden lg:block" />

        <main className="flex-1 py-8 px-0 lg:px-10 max-w-4xl docs-prose">
          <div className="border-b border-[#d0d7de] pb-6 mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-[#1f2328] mb-2">
              Pemeriksaan Kesehatan Hewan dan Produk Peternakan
            </h1>
            <p className="text-sm text-[#656d76]">
              Prosedur operasional standar inspeksi fisik, klinis, dan laboratorium oleh Dokter Hewan Berwenang sebelum hewan atau produk diizinkan beredar di Kabupaten Mimika.
            </p>
          </div>

          <section id="tujuan" className="mb-10">
            <h2>Tujuan & Dasar Hukum</h2>
            <p>
              Pemeriksaan kesehatan veteriner bertujuan mencegah masuk, tersebar, dan keluarnya Hama dan Penyakit Hewan Menular (HPHM), zoonosis berbahaya (seperti Rabies, Antraks, PMK, dan Flu Burung), serta menjamin produk asal ternak memenuhi kriteria Aman, Sehat, Utuh, dan Halal (ASUH).
            </p>
          </section>

          <section id="pos-pemeriksaan" className="mb-10">
            <h2>Pos Pengawasan Resmi Kabupaten Mimika</h2>
            <p>
              Seluruh inspeksi wajib dilaksanakan di pos pintu gerbang resmi oleh Tim Pengawas Lalu Lintas Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="p-4 rounded-md border border-[#d0d7de] bg-[#f6f8fa]">
                <h4 className="font-semibold text-xs text-[#1f2328] mb-1">Pos Laut Pomako</h4>
                <p className="text-xs text-[#656d76] m-0">
                  Melayani pengawasan kapal barang, peti kemas reefer, kapal tol laut, dan kapal ternak sandar di Pelabuhan Pomako.
                </p>
              </div>
              <div className="p-4 rounded-md border border-[#d0d7de] bg-[#f6f8fa]">
                <h4 className="font-semibold text-xs text-[#1f2328] mb-1">Pos Udara Bandara Mozes Kilangin</h4>
                <p className="text-xs text-[#656d76] m-0">
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
              <li><strong>Pemeriksaan Antemortem & Fisik:</strong> Pengecekan keaktifan, nafsu makan, kondisi pernafasan, leleran hidung/mata, serta membran mukosa.</li>
              <li><strong>Pemeriksaan Suhu Rektal:</strong> Sapi normal (38.0&deg;C - 39.3&deg;C), Kambing (38.5&deg;C - 40.0&deg;C), Babi (38.5&deg;C - 39.5&deg;C).</li>
              <li><strong>Inspeksi Kuku, Mulut, dan Kulit:</strong> Memastikan tidak ada vesikel atau luka lepuh indikasi PMK, ruam eritema ASF pada babi, atau lesi antraks.</li>
              <li><strong>Verifikasi Dokumen Identitas:</strong> Pengecekan ear tag (tanda telinga ternak) yang terdaftar pada sistem pendataan.</li>
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
            <h2>Status & Tindakan Veteriner</h2>
            <div className="border border-[#d0d7de] rounded-md overflow-hidden my-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f8fa] border-b border-[#d0d7de] font-semibold text-[#1f2328]">
                  <tr>
                    <th className="py-2.5 px-3">Status Hasil</th>
                    <th className="py-2.5 px-3">Kondisi Fisik / Berkas</th>
                    <th className="py-2.5 px-3">Tindakan Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-[#1a7f37]">INSPECTED_PASS</td>
                    <td className="py-2 px-3">Sehat klinis, dokumen lengkap, suhu cold chain terjaga.</td>
                    <td className="py-2 px-3">Diterbitkan surat pelepasan dan diperbolehkan masuk/keluar.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-[#9a6700]">PENDING / QUARANTINE</td>
                    <td className="py-2 px-3">Menunjukkan gejala demam ringan atau menunggu konfirmasi lab.</td>
                    <td className="py-2 px-3">Hewan ditahan di instalasi karantina transit selama 3-14 hari pengamatan.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-[#d1242f]">INSPECTED_REJECT</td>
                    <td className="py-2 px-3">Gejala klinis penyakit menular strategis atau daging busuk/ilegal.</td>
                    <td className="py-2 px-3">Penolakan kembali ke daerah asal atau pemusnahan di tempat.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="skkh" className="mb-10">
            <h2>Penerbitan Surat Keterangan Kesehatan Hewan (SKKH)</h2>
            <p>
              SKKH diterbitkan setelah hewan dinyatakan sehat secara sah oleh Dokter Hewan Berwenang Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika. Dokumen ini memuat nomor registrasi, identitas pemilik, jumlah ternak, jenis kelamin, serta riwayat vaksinasi.
            </p>
          </section>
        </main>

        <TableOfContents items={tocItems} />
      </div>
    </div>
  );
};
