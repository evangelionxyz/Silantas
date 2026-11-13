import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { TableOfContents, type TocItem } from '../../components/layout/TableOfContents';
import { SUANGGI_BRAND } from '../../constants/brand';

const profileTocItems: TocItem[] = [
  { id: 'tentang-sistem', title: 'Tentang SUANGGI CARI KO' },
  { id: 'makna-filosofi', title: 'Makna & Akronim SUANGGI' },
  { id: 'tujuan-sistem', title: 'Tujuan & Manfaat Utama' },
  { id: 'pilar-operasional', title: '4 Pilar Operasional' },
  { id: 'tata-kelola-dokumen', title: 'Tertib Dokumen: SV & SKKH' },
  { id: 'landasan-hukum', title: 'Landasan Hukum & Instansi' },
  { id: 'layanan-kontak', title: 'Saluran Layanan Publik' },
];

const acronymBreakdown = [
  {
    letter: 'S',
    word: 'Sistem',
    desc: 'Platform digital terpadu dan terpusat untuk tata kelola data lalu lintas komoditas hewan.',
    highlight: true,
  },
  {
    letter: 'U',
    word: 'Updating',
    desc: 'Pemutakhiran berkala dan pencatatan data secara seketika (real-time) di setiap pos pelayanan.',
    highlight: true,
  },
  {
    letter: 'A',
    word: 'Arus',
    desc: 'Pemantauan alur perpindahan komoditas baik pemasukan (masuk) maupun pengeluaran (keluar).',
    highlight: true,
  },
  {
    letter: 'N',
    word: 'Niaga',
    desc: 'Aktivitas perdagangan, pasokan logistik pangan hewani, dan distribusi ekonomi peternakan.',
    highlight: true,
  },
  {
    letter: 'G',
    word: 'Gerak',
    desc: 'Mobilitas fisik hewan ternak hidup yang berpotensi membawa risiko kesehatan veteriner.',
    highlight: true,
  },
  {
    letter: 'G & I',
    word: 'Hewan & Olahan',
    desc: 'Mencakup hewan hidup, bahan asal hewan (daging/telur), serta produk olahan turunan.',
    highlight: true,
  },
];

const cariKoBreakdown = [
  {
    letter: 'CA',
    word: 'Catatan Arus',
    desc: 'Pencatatan tertib volume, tanggal, moda transportasi darat, laut, dan udara.',
  },
  {
    letter: 'R - I',
    word: 'Rekapitulasi & Informasi',
    desc: 'Kalkulasi otomatis statistik data lalu lintas dan transparansi informasi bagi publik.',
  },
  {
    letter: 'KO',
    word: 'KOmoditas',
    desc: 'Fokus komprehensif pada perlindungan seluruh komoditas peternakan dan kesehatan masyarakat.',
  },
];

export const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Breadcrumbs
        items={[
          { label: `Layanan Publik ${SUANGGI_BRAND.name}`, href: '/' },
          { label: 'Profil dan Tentang Sistem' },
        ]}
      />

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex-1 flex items-start gap-8">
        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex-1 py-8 sm:py-10 docs-prose min-w-0"
        >
          {/* Article Hero Banner */}
          <section className="not-prose bg-[#14532d] text-white p-6 sm:p-8 lg:p-10 mb-10 border border-[#166534] shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider bg-[#f59e0b] text-[#1f2328]">
                Profil &amp; Filosofi Sistem
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-[#166534] text-[#bbf7d0]">
                {SUANGGI_BRAND.agencyShort}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3 leading-tight">
              Mengenal {SUANGGI_BRAND.name}
            </h1>
            <p className="text-base sm:text-xl font-bold text-[#bbf7d0] mb-4 leading-snug">
              {SUANGGI_BRAND.fullName}
            </p>

            <div className="p-3.5 bg-[#0f3923] border-l-4 border-[#f59e0b] text-sm sm:text-base font-semibold text-[#fef3c7] mb-6">
              &ldquo;{SUANGGI_BRAND.slogan}&rdquo;
            </div>

            <p className="text-sm sm:text-base text-[#dcfce7] leading-relaxed max-w-3xl m-0">
              Sistem informasi manajemen terpadu yang dibangun oleh {SUANGGI_BRAND.agency} untuk
              mengawal biosekuriti daerah, mewujudkan Satu Data Peternakan yang akurat, serta memodernisasi
              pengawasan arus niaga komoditas peternakan di pintu-pintu masuk dan keluar Kabupaten Mimika,
              Papua Tengah.
            </p>
          </section>

          {/* Section 1: Tentang Sistem */}
          <section id="tentang-sistem" className="mb-12">
            <h2>1. Tentang Sistem SUANGGI CARI KO</h2>
            <p>
              Kabupaten Mimika memiliki posisi strategis sebagai pintu gerbang logistik utama di wilayah
              Papua Tengah melalui <strong>Pelabuhan Pomako</strong> dan <strong>Bandara Internasional Mozes Kilangin</strong>.
              Tingginya volume mobilitas orang dan barang, terutama komoditas hewan hidup, bahan asal hewan (BAH)
              seperti daging beku dan telur, serta hasil bahan asal hewan (HBAH), menuntut pengawasan
              kesehatan veteriner yang tangguh, cepat, dan terdokumentasi rapi.
            </p>
            <p>
              <strong>{SUANGGI_BRAND.name}</strong> hadir sebagai solusi transformasi digital pelayanan
              pemerintah daerah. Sistem ini menghubungkan petugas teknis lapangan, dokter hewan berwenang,
              pelaku usaha ternak, hingga pengambil kebijakan pimpinan dinas dalam satu ekosistem data yang
              terbuka, transparan, dan dapat dipertanggungjawabkan (auditable).
            </p>

            <div className="not-prose my-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#f0fdf4] border border-[#86efac]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#15803d]">Pilar I</div>
                <div className="text-base font-extrabold text-[#14532d] mt-1">Data Terpadu</div>
                <p className="text-xs text-[#374151] mt-1 mb-0 leading-relaxed">
                  Menyatukan seluruh pos pengawasan (Pomako, Mozes Kilangin, antardistrik) dalam satu basis data terpusat.
                </p>
              </div>
              <div className="p-4 bg-[#eff6ff] border border-[#93c5fd]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1d4ed8]">Pilar II</div>
                <div className="text-base font-extrabold text-[#1e3a8a] mt-1">Data Akurat</div>
                <p className="text-xs text-[#374151] mt-1 mb-0 leading-relaxed">
                  Validasi berkas veteriner resmi (SV &amp; SKKH) dan verifikasi klinis langsung oleh tenaga profesional.
                </p>
              </div>
              <div className="p-4 bg-[#fffbeb] border border-[#fde68a]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#b45309]">Pilar III</div>
                <div className="text-base font-extrabold text-[#78350f] mt-1">Data Terkini</div>
                <p className="text-xs text-[#374151] mt-1 mb-0 leading-relaxed">
                  Pencatatan seketika saat kapal sandar atau pesawat tiba, memudahkan peringatan dini penyebaran penyakit.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Makna & Akronim SUANGGI CARI KO */}
          <section id="makna-filosofi" className="mb-12">
            <h2>2. Makna &amp; Filosofi Akronim SUANGGI CARI KO</h2>
            <p>
              Nama <strong>SUANGGI CARI KO</strong> dirancang dengan mengangkat khazanah kearifan lokal
              Papua yang bermetamorfosis menjadi simbol pengawasan modern, penuh dedikasi, dan bersahabat
              dengan masyarakat:
            </p>

            {/* Visual Callout for Akronim SUANGGI */}
            <div className="not-prose bg-[#fdf8e8] border border-[#e5cf7b] p-5 sm:p-6 mb-6">
              <div className="text-xs font-extrabold uppercase tracking-widest text-[#8a5d00] mb-1">
                Uraian Akronim Bagian Pertama
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1b261d] tracking-tight mb-4">
                S - U - A - N - G - G - I
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {acronymBreakdown.map((item) => (
                  <div
                    key={item.letter}
                    className="flex items-start gap-3 bg-white p-3 border border-[#d4cb9f]"
                  >
                    <div className="w-10 h-10 shrink-0 bg-[#174b2b] text-white font-extrabold text-base flex items-center justify-center">
                      {item.letter}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#14532d]">{item.word}</div>
                      <div className="text-xs text-[#4b5563] mt-0.5 leading-snug">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[#d4cb9f]/70 text-xs sm:text-sm font-semibold text-[#174b2b]">
                &rarr; <strong>SUANGGI</strong>: Sistem Updating Arus Niaga dan Gerak Hewan, produk hewan, dan olahannya.
              </div>
            </div>

            {/* Visual Callout for Akronim CARI KO */}
            <div className="not-prose bg-[#f0fdf4] border border-[#86efac] p-5 sm:p-6 mb-6">
              <div className="text-xs font-extrabold uppercase tracking-widest text-[#15803d] mb-1">
                Uraian Akronim Bagian Kedua
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#14532d] tracking-tight mb-4">
                CARI KO
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cariKoBreakdown.map((item) => (
                  <div
                    key={item.letter}
                    className="bg-white p-3.5 border border-[#a7f3d0] flex flex-col justify-between"
                  >
                    <div className="w-8 h-8 bg-[#15803d] text-white font-black text-xs flex items-center justify-center mb-2">
                      {item.letter}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#14532d]">{item.word}</div>
                      <div className="text-xs text-[#4b5563] mt-1 leading-snug">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[#a7f3d0] text-xs sm:text-sm font-semibold text-[#15803d]">
                &rarr; <strong>CARI KO</strong>: Catatan Arus, Rekapitulasi, dan Informasi KOmoditas.
              </div>
            </div>

            <div className="bg-[#f9fafb] p-4 border-l-4 border-[#14532d] text-sm text-[#374151]">
              <strong className="text-[#14532d]">Filosofi Sosio-Kultural:</strong> Dalam cerita tutur masyarakat
              Tanah Papua, figur &ldquo;Suanggi&rdquo; dikenal memiliki indra penglihatan yang tajam dan mampu
              mengetahui gerak-gerik di sekelilingnya tanpa ada yang luput. Dalam sistem ini, makna tersebut
              direfleksikan secara positif sebagai <em>daya awas, kehati-hatian tinggi, dan perlindungan tanpa celah</em>{' '}
              terhadap masuknya wabah penyakit hewan. Sedangkan frasa &ldquo;CARI KO&rdquo; menggunakan dialek Papua
              sehari-hari yang komunikatif, melambangkan dinas yang selalu proaktif menjemput bola, melayani,
              dan mendampingi peternak maupun pelaku niaga.
            </div>
          </section>

          {/* Section 3: Tujuan & Manfaat Utama */}
          <section id="tujuan-sistem" className="mb-12">
            <h2>3. Tujuan &amp; Manfaat Sistem</h2>
            <p>
              Penerapan sistem ini memiliki sasaran strategis bagi ketahanan pangan, perlindungan ekonomi
              peternak lokal, dan kesehatan masyarakat:
            </p>

            <div className="not-prose space-y-4 my-6">
              <div className="flex gap-4 p-4 border border-[#d1d5db] bg-white">
                <div className="w-9 h-9 shrink-0 bg-[#dcfce7] text-[#15803d] font-bold text-sm flex items-center justify-center">
                  01
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-[#111827] m-0">
                    Benteng Biosekuriti &amp; Pencegahan Penyakit Hewan Menular (PHMS)
                  </h4>
                  <p className="text-xs sm:text-sm text-[#4b5563] mt-1 mb-0 leading-relaxed">
                    Menjaga Mimika dari bahaya penyakit hewan berbahaya seperti Penyakit Mulut dan Kuku (PMK),
                    Demam Babi Afrika (African Swine Fever / ASF), Flu Burung (Avian Influenza), dan Rabies.
                    Setiap komoditas yang masuk wajib disertai dokumen kesehatan resmi dari daerah asal.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 border border-[#d1d5db] bg-white">
                <div className="w-9 h-9 shrink-0 bg-[#e0f2fe] text-[#0369a1] font-bold text-sm flex items-center justify-center">
                  02
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-[#111827] m-0">
                    Jaminan Keamanan Produk Pangan Asal Ternak (Kesmavet)
                  </h4>
                  <p className="text-xs sm:text-sm text-[#4b5563] mt-1 mb-0 leading-relaxed">
                    Memastikan daging beku, karkas, susu, telur, dan olahannya yang beredar di Mimika memenuhi
                    standar <strong>ASUH (Aman, Sehat, Utuh, dan Halal)</strong> serta terjaga dalam rantai dingin
                    (cold chain) selama pengiriman.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 border border-[#d1d5db] bg-white">
                <div className="w-9 h-9 shrink-0 bg-[#fef3c7] text-[#b45309] font-bold text-sm flex items-center justify-center">
                  03
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-[#111827] m-0">
                    Kalkulasi Otomatis Neraca Pangan Peternakan Daerah
                  </h4>
                  <p className="text-xs sm:text-sm text-[#4b5563] mt-1 mb-0 leading-relaxed">
                    Menghitung secara langsung total volume masuk, keluar, dan ketersediaan pasokan ternak di Mimika
                    untuk mendukung pengambilan kebijakan stabilisasi pasokan dan harga daging menjelang hari raya.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 border border-[#d1d5db] bg-white">
                <div className="w-9 h-9 shrink-0 bg-[#ccfbf1] text-[#0f766e] font-bold text-sm flex items-center justify-center">
                  04
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-[#111827] m-0">
                    Transparansi Pelayanan &amp; Respon Cepat Aspirasi Warga
                  </h4>
                  <p className="text-xs sm:text-sm text-[#4b5563] mt-1 mb-0 leading-relaxed">
                    Memangkas birokrasi berbelit. Masyarakat dan peternak dapat berkonsultasi, mengajukan informasi,
                    atau melaporkan keluhan melalui posko WhatsApp pelayanan yang terhubung langsung dengan petugas piket.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: 4 Pilar Operasional */}
          <section id="pilar-operasional" className="mb-12">
            <h2>4. Empat Pilar Operasional SUANGGI</h2>
            <p>
              Operasional sistem dijalankan melalui empat modul fungsional yang saling terintegrasi:
            </p>

            <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="p-4 bg-white border border-[#d1d5db] shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-xs uppercase px-2 py-0.5 bg-[#edf1e7] text-[#174b2b] border border-[#a6b39e]">
                    Pilar 1: Pemasukan
                  </span>
                  <span className="text-[11px] font-semibold text-[#57606a]">Impor Daerah</span>
                </div>
                <h4 className="font-bold text-base text-[#1f2328] m-0">Pencatatan Arus Masuk</h4>
                <p className="text-xs text-[#57606a] mt-2 mb-0 leading-relaxed">
                  Pencatatan komoditas hewan hidup, daging, dan produk olahan yang didatangkan dari luar Papua
                  (misalnya Surabaya, Makassar, Denpasar). Wajib melampirkan <strong>Sertifikat Veteriner (SV) Asal</strong>.
                </p>
              </div>

              <div className="p-4 bg-white border border-[#d1d5db] shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-xs uppercase px-2 py-0.5 bg-[#f1f1e8] text-[#526b3d] border border-[#b9bd9d]">
                    Pilar 2: Pengeluaran
                  </span>
                  <span className="text-[11px] font-semibold text-[#57606a]">Ekspor Daerah</span>
                </div>
                <h4 className="font-bold text-base text-[#1f2328] m-0">Pencatatan Arus Keluar</h4>
                <p className="text-xs text-[#57606a] mt-2 mb-0 leading-relaxed">
                  Pengawasan ternak dan produk hewan yang dikirim keluar wilayah Mimika ke kabupaten pedalaman
                  (seperti Asmat, Nduga, Puncak, Yahukimo). Wajib menerbitkan dan mengunggah berkas <strong>SKKH / SKKHP</strong>.
                </p>
              </div>

              <div className="p-4 bg-white border border-[#d1d5db] shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-xs uppercase px-2 py-0.5 bg-[#f8f0d8] text-[#805500] border border-[#d4bb71]">
                    Pilar 3: Pemutakhiran
                  </span>
                  <span className="text-[11px] font-semibold text-[#57606a]">Verifikasi Klinis</span>
                </div>
                <h4 className="font-bold text-base text-[#1f2328] m-0">Validasi &amp; Rekam Medis</h4>
                <p className="text-xs text-[#57606a] mt-2 mb-0 leading-relaxed">
                  Pemeriksaan fisik hewan dan sertifikat kesehatan oleh dokter hewan berwenang serta petugas
                  karantina untuk menentukan status lulus uji (PASS) atau karantina/ditolak (REJECT).
                </p>
              </div>

              <div className="p-4 bg-white border border-[#d1d5db] shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-xs uppercase px-2 py-0.5 bg-[#eaf0e7] text-[#36583c] border border-[#a8b8a5]">
                    Pilar 4: Monitoring
                  </span>
                  <span className="text-[11px] font-semibold text-[#57606a]">Statistik &amp; Neraca</span>
                </div>
                <h4 className="font-bold text-base text-[#1f2328] m-0">Kalkulasi &amp; Audit Trail</h4>
                <p className="text-xs text-[#57606a] mt-2 mb-0 leading-relaxed">
                  Visualisasi grafik arus lalu lintas, pemetaan rute angkutan (Pomako &amp; Mozes Kilangin),
                  rekapitulasi kuantitas kustom (ekor, ton, karton), serta jejak audit perubahan data.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Tata Kelola Dokumen SV vs SKKH */}
          <section id="tata-kelola-dokumen" className="mb-12">
            <h2>5. Tata Kelola Dokumen: Sertifikat Veteriner (SV) &amp; SKKH</h2>
            <p>
              Untuk memastikan efisiensi administrasi tanpa mengorbankan keamanan veteriner, SUANGGI CARI KO
              menerapkan ketentuan dokumen yang tegas dan lugas:
            </p>

            <div className="not-prose overflow-x-auto my-6 border border-[#d0d7de]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f6f8fa] text-xs font-bold uppercase text-[#57606a] border-b border-[#d0d7de]">
                  <tr>
                    <th className="py-3 px-4">Kategori Alur</th>
                    <th className="py-3 px-4">Dokumen Utama Wajib</th>
                    <th className="py-3 px-4">Ketentuan SKKH</th>
                    <th className="py-3 px-4">Kewenangan Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  <tr className="bg-[#f0fdf4]/40">
                    <td className="py-3 px-4 font-bold text-[#14532d]">
                      Pemasukan (Masuk ke Mimika)
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1f2328]">
                      Sertifikat Veteriner (SV) dari Daerah Asal &amp; Sertifikat Pelepasan Karantina
                    </td>
                    <td className="py-3 px-4 text-[#57606a]">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-[#e5e7eb] text-[#374151]">
                        SKKH Tidak Diperlukan
                      </span>
                      <div className="text-[11px] mt-1 text-[#6b7280]">
                        Cukup melampirkan berkas SV asal resmi yang sah.
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#14532d]">
                      Petugas Pos &amp; Administrator Dinas
                    </td>
                  </tr>
                  <tr className="bg-[#fffbeb]/40">
                    <td className="py-3 px-4 font-bold text-[#b45309]">
                      Pengeluaran (Keluar dari Mimika)
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1f2328]">
                      SKKH (Hewan Hidup) atau SKKHP (Produk Hewan) Resmi Kab. Mimika
                    </td>
                    <td className="py-3 px-4 text-[#cf222e]">
                      <span className="inline-block px-2 py-0.5 text-xs font-extrabold bg-[#ffebe9] text-[#cf222e] border border-[#ff8182]/50">
                        Wajib Diunggah (Mandatory)
                      </span>
                      <div className="text-[11px] mt-1 text-[#4b5563]">
                        Berkas pindaian/foto SKKH resmi harus tersimpan di sistem.
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-[#b45309]">
                      Dokter Hewan Berwenang &amp; Petugas Pelayanan
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6: Landasan Hukum */}
          <section id="landasan-hukum" className="mb-12">
            <h2>6. Landasan Hukum &amp; Kelembagaan</h2>
            <p>
              Operasionalisasi {SUANGGI_BRAND.name} berpedoman pada peraturan perundang-undangan peternakan
              dan kesehatan hewan yang berlaku di Republik Indonesia:
            </p>
            <ul>
              <li>
                <strong>Undang-Undang Nomor 18 Tahun 2009</strong> tentang Peternakan dan Kesehatan Hewan
                sebagaimana telah diubah dengan <strong>Undang-Undang Nomor 41 Tahun 2014</strong>.
              </li>
              <li>
                <strong>Undang-Undang Nomor 21 Tahun 2019</strong> tentang Karantina Hewan, Ikan, dan Tumbuhan.
              </li>
              <li>
                <strong>Peraturan Pemerintah Nomor 47 Tahun 2014</strong> tentang Pengendalian dan Penanggulangan
                Penyakit Hewan.
              </li>
              <li>
                <strong>Peraturan Pemerintah Nomor 95 Tahun 2012</strong> tentang Kesehatan Masyarakat Veteriner
                dan Kesejahteraan Hewan.
              </li>
              <li>
                Keputusan dan Peraturan Daerah Kabupaten Mimika terkait Pengawasan Lalu Lintas Hewan dan Produk Hewan.
              </li>
            </ul>

            <div className="not-prose my-6 p-4 sm:p-5 bg-[#f6f8fa] border border-[#d0d7de] flex items-center gap-4">
              <div className="w-12 h-12 bg-[#174b2b] text-white flex items-center justify-center font-extrabold text-lg shrink-0">
                {SUANGGI_BRAND.initials}
              </div>
              <div className="text-xs sm:text-sm">
                <div className="font-extrabold text-[#1f2328]">{SUANGGI_BRAND.agency}</div>
                <div className="text-[#57606a]">
                  Kompleks Perkantoran Pemerintah Daerah Kabupaten Mimika, Jl. Cenderawasih SP 3, Timika - Papua Tengah 99910
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Saluran Layanan Publik */}
          <section id="layanan-kontak" className="mb-12">
            <h2>7. Saluran Konsultasi &amp; Rekapan WhatsApp</h2>
            <p>
              Bagi peternak, pedagang, dan masyarakat umum yang membutuhkan informasi persyaratan lalu lintas,
              prosedur pengajuan SKKH, atau melaporkan aduan terkait kesehatan ternak:
            </p>

            <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <Link
                to="/persyaratan"
                className="p-4 bg-white border border-[#d0d7de] hover:border-[#15803d] transition-all group flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold uppercase text-[#15803d]">Panduan Resmi</span>
                  <div className="font-bold text-sm sm:text-base text-[#1f2328] group-hover:text-[#15803d] mt-1">
                    Panduan Persyaratan Dokumen &rarr;
                  </div>
                  <p className="text-xs text-[#57606a] mt-1 mb-0 leading-relaxed">
                    Syarat teknis hewan hidup, daging segar, beku, dan produk olahan peternakan.
                  </p>
                </div>
              </Link>

              <Link
                to="/konsultasi"
                className="p-4 bg-[#f0fdf4] border border-[#86efac] hover:border-[#15803d] transition-all group flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold uppercase text-[#15803d]">Hubungi Petugas</span>
                  <div className="font-bold text-sm sm:text-base text-[#14532d] group-hover:underline mt-1">
                    Konsultasi &amp; Aduan WhatsApp &rarr;
                  </div>
                  <p className="text-xs text-[#4b5563] mt-1 mb-0 leading-relaxed">
                    Kirim pesan langsung ke petugas piket Dinas Peternakan dan Kesehatan Hewan Mimika.
                  </p>
                </div>
              </Link>
            </div>
          </section>
        </motion.main>

        {/* Right Sticky Table of Contents */}
        <TableOfContents items={profileTocItems} />
      </div>
    </div>
  );
};
