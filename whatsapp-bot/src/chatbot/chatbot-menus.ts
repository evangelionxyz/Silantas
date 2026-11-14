export const CHATBOT_MENUS = {
  GREETING_HEADER: (name?: string) =>
    `🐾 *LAYANAN INFORMASI LALU LINTAS HEWAN & TERNAK*\n` +
    `*Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika*\n` +
    `*(SUANGGI CARI KO)*\n\n` +
    `Halo ${name ? `*${name}*` : 'Bapak/Ibu'}! Selamat datang di layanan informasi & konsultasi digital lalu lintas hewan, produk hewan, dan olahannya.\n\n` +
    `Silakan balas dengan *ANGKA (1 - 5)* sesuai informasi yang Anda butuhkan:\n\n` +
    `1 *Persyaratan Pemasukan Hewan & Produk Masuk*\n` +
    `   (Izin masuk ternak sapi, kambing, babi, unggas, daging beku, DOC, telur ke Mimika)\n\n` +
    `2 *Pengeluaran Hewan & Penerbitan SKKH*\n` +
    `   (Pemeriksaan fisik hewan oleh dokter hewan & surat rekomendasi keluar daerah)\n\n` +
    `3 *Ketentuan Produk Olahan & Rantai Dingin*\n` +
    `   (Standar NKV, Sertifikat Halal, pengawasan Pelabuhan Pomako & Bandara Mozes Kilangin)\n\n` +
    `4 *Cek Status Permohonan / Rekomendasi*\n` +
    `   (Pengecekan nomor berkas permohonan lalu lintas)\n\n` +
    `5 *Hubungi Petugas / Lapor Bantuan Medis Ternak*\n` +
    `   (Konsultasi langsung dengan petugas/dokter hewan posko)\n\n` +
    `\n` +
    `ℹ️ Ketik *0*, *MENU*, atau *#MENU* kapan saja untuk kembali ke menu utama.`,

  SUBMENU_1_PEMASUKAN:
    `📋 *PERSYARATAN PEMASUKAN HEWAN & PRODUK (ARUS MASUK)*\n\n` +
    `Untuk memasukkan ternak/hewan hidup atau bahan pangan asal hewan ke wilayah Kabupaten Mimika, pemohon wajib melengkapi berkas:\n\n` +
    `*A. Hewan Hidup / Ternak Potong & Bibit:*\n` +
    `• KTP / Identitas & NIB Pemohon/Perusahaan.\n` +
    `• Surat Permohonan Rekomendasi Pemasukan kepada Kepala Dinas Peternakan & Keswan Kab. Mimika.\n` +
    `• Sertifikat Veteriner (SV) / SKKH dari Otoritas Veteriner daerah asal (berlaku maks. 7 hari).\n` +
    `• Hasil Uji Laboratorium bebas penyakit strategis (PMK untuk ruminansia, ASF untuk babi, AI/Flu Burung untuk unggas, Rabies untuk HPR).\n` +
    `• Surat Rekomendasi Pengeluaran dari Dinas Peternakan provinsi/kabupaten asal.\n\n` +
    `*B. Daging Beku & Telur Konsumsi:*\n` +
    `• Sertifikat Nomor Kontrol Veteriner (NKV) RPH/Unit Usaha asal.\n` +
    `• Sertifikat Halal (untuk produk daging yang dipersyaratkan).\n` +
    `• Surat Keterangan Sanitasi Produk Hewan & Sertifikat Karantina (KH-12 / pelepasan).\n\n` +
    `*Titik Pemeriksaan Pintu Masuk:*\n` +
    `Pelabuhan Laut Pomako & Bandara Mozes Kilangin Timika.\n\n` +
    `\n` +
    `Ketik *0* untuk kembali ke Menu Utama, atau *5* untuk terhubung dengan petugas.`,

  SUBMENU_2_PENGELUARAN:
    `📋 *PENGELUARAN HEWAN & PENERBITAN SKKH (ARUS KELUAR)*\n\n` +
    `Surat Keterangan Kesehatan Hewan (SKKH) dan Rekomendasi Pengeluaran diterbitkan setelah pemeriksaan fisik dan administrasi:\n\n` +
    `*Prosedur Pengajuan:*\n` +
    `1. Mengajukan surat permohonan pemeriksaan ke Dinas Peternakan & Keswan Kab. Mimika.\n` +
    `2. Melampirkan identitas pemilik (KTP) dan data ternak (jumlah, jenis, jenis kelamin, umur, nomor ear-tag/tanda pengenal jika ada).\n` +
    `3. Petugas medik/paramedik veteriner dinas akan melakukan pemeriksaan klinis langsung di kandang/lokasi penampungan.\n` +
    `4. Apabila hewan dinyatakan sehat dan memenuhi persyaratan teknis, SKKH dan Rekomendasi Pengeluaran diterbitkan (1–2 hari kerja).\n` +
    `5. Masa berlaku SKKH pengeluaran adalah 7 (tujuh) hari kerja sejak tanggal diterbitkan.\n\n` +
    `\n` +
    `Ketik *0* untuk kembali ke Menu Utama, atau *5* untuk konsultasi dengan dokter hewan.`,

  SUBMENU_3_RANTAI_DINGIN:
    `❄️ *PENGAWASAN PRODUK OLAHAN & RANTAI DINGIN*\n\n` +
    `Pengawasan mutu keamanan pangan asal hewan (ASUH: Aman, Sehat, Utuh, dan Halal) di Kabupaten Mimika:\n\n` +
    `• *Standar Suhu Rantai Dingin:*\n` +
    `  - Daging & jeroan beku wajib disimpan dan diangkut pada suhu minimal -18°C.\n` +
    `  - Daging segar/dingin (*chilled*) wajib pada suhu 0°C s/d 4°C.\n` +
    `• *Kelengkapan Pengiriman:*\n` +
    `  - Menggunakan kontainer reefer berpendingin dengan pengukur suhu otomatis (*data logger*).\n` +
    `  - Memiliki Sertifikat Sanitasi Produk Hewan dari daerah asal.\n` +
    `• *Posko Pengawasan Lapangan:*\n` +
    `  Petugas melakukan inspeksi fisik kontainer dan uji organoleptik saat pembongkaran di Pelabuhan Pomako.\n\n` +
    `\n` +
    `Ketik *0* untuk kembali ke Menu Utama, atau *5* untuk terhubung dengan petugas pengawas.`,

  SUBMENU_4_CEK_STATUS:
    `🔍 *CEK STATUS PERMOHONAN REKOMENDASI*\n\n` +
    `Silakan ketik *NOMOR PERMOHONAN* Anda (contoh: *TRF-2026-001* atau *REC-001*) untuk mengecek status permohonan rekomendasi lalu lintas ternak.\n\n` +
    `Atau kunjungi portal web pelayanan kami di:\n` +
    `🌐 https://silantas.vercel.app\n\n` +
    `\n` +
    `Ketik *0* untuk kembali ke Menu Utama.`,

  SUBMENU_5_HUBUNGI_PETUGAS:
    `👨‍⚕️ *LAYANAN PETUGAS & BANTUAN MEDIS TERNAK*\n\n` +
    `Terima kasih. Permintaan konsultasi/pelaporan Anda telah dicatat oleh sistem SUANGGI.\n\n` +
    `Petugas Verifikator atau Dokter Hewan Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika akan segera membalas langsung di chat ini.\n\n` +
    `⏰ *Jam Operasional Pelayanan:*\n` +
    `Senin - Jumat: 08.00 - 16.00 WIT\n` +
    `(Laporan darurat/wabah penyakit ternak tetap dimonitor tim posko lapangan)\n\n` +
    `_Silakan langsung ketik pesan, pertanyaan, atau keluhan Anda di bawah ini. Chatbot otomatis dinonaktifkan sementara agar Anda dapat berkomunikasi lancar dengan petugas._\n\n` +
    `_Ketik *MENU*, *#MENU*, atau *0* kapan saja jika ingin mengaktifkan kembali menu pilihan bot._`,

  INVALID_OPTION_HINT:
    `Mohon maaf, pilihan tidak dikenali.\n` +
    `Silakan balas dengan angka *1, 2, 3, 4, atau 5* sesuai menu, atau ketik *0* untuk menampilkan kembali Menu Utama.`,

  INVALID_LIMIT_REACHED:
    `Pesan Anda telah kami teruskan ke petugas kami. Petugas Dinas Peternakan akan segera membalas pesan Anda pada jam operasional. Terima kasih telah menghubungi kami.`,
};
