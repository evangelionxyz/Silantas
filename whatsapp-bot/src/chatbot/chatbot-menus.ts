export const CHATBOT_MENUS = {
  GREETING_HEADER: (name?: string, webUrl?: string) => {
    const cleanUrl = (webUrl || process.env.FRONTEND_WEB_URL || 'https://silantas.vercel.app').replace(/\/+$/, '');
    const cleanName = name && name.trim() !== '.' ? name.trim() : '';
    return (
      `*LAYANAN INFORMASI LALU LINTAS HEWAN & TERNAK*\n` +
      `*Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika*\n` +
      `*(SUANGGI CARI KO)*\n\n` +
      `Halo ${cleanName ? `*${cleanName}*` : 'Bapak/Ibu'}, selamat datang di layanan informasi dan pengaduan lalu lintas hewan serta produk olahannya.\n\n` +
      `Silakan balas dengan *ANGKA (1 - 4)* sesuai layanan yang Anda butuhkan:\n\n` +
      `1. *Persyaratan Pemasukan Hewan & Produk Masuk*\n` +
      `   (Izin masuk sapi, kambing, babi, unggas, daging beku, telur ke Mimika)\n\n` +
      `2. *Pengeluaran Hewan & Penerbitan SKKH*\n` +
      `   (Pemeriksaan kesehatan fisik ternak & rekomendasi pengeluaran)\n\n` +
      `3. *Ketentuan Produk Olahan & Rantai Dingin*\n` +
      `   (Standar NKV, sertifikasi halal, pengawasan Pelabuhan Pomako & Bandara Mozes Kilangin)\n\n` +
      `4. *Lapor Keluhan / Aduan Masyarakat & Penyakit Ternak*\n` +
      `   (Pencatatan resmi aduan kendala pelayanan atau laporan ternak sakit ke dashboard)\n\n` +
      `Portal Informasi: ${cleanUrl}\n` +
      `──────────────────────\n` +
      `Ketik *0*, *MENU*, atau *#MENU* kapan saja untuk kembali ke menu utama.`
    );
  },

  SUBMENU_1_PEMASUKAN:
    `*PERSYARATAN PEMASUKAN HEWAN & PRODUK (ARUS MASUK)*\n\n` +
    `Untuk memasukkan hewan/ternak hidup atau bahan pangan asal hewan ke wilayah Kabupaten Mimika, pemohon wajib melengkapi berkas:\n\n` +
    `*A. Hewan Hidup / Ternak Potong & Bibit:*\n` +
    `- KTP / NIB Pemohon atau Perusahaan.\n` +
    `- Surat Permohonan Rekomendasi Pemasukan ke Kepala Dinas Peternakan & Keswan Kab. Mimika.\n` +
    `- Sertifikat Veteriner (SV) / SKKH dari Otoritas Veteriner daerah asal (berlaku maks. 7 hari).\n` +
    `- Hasil Uji Laboratorium bebas penyakit strategis (PMK untuk ruminansia, ASF untuk babi, Avian Influenza untuk unggas, Rabies untuk HPR).\n` +
    `- Surat Rekomendasi Pengeluaran dari dinas peternakan daerah asal.\n\n` +
    `*B. Daging Beku & Telur Konsumsi:*\n` +
    `- Sertifikat Nomor Kontrol Veteriner (NKV) dari unit usaha/RPH asal.\n` +
    `- Sertifikat Halal (untuk produk daging yang dipersyaratkan).\n` +
    `- Sertifikat Sanitasi Produk Hewan & Sertifikat Pelepasan Karantina.\n\n` +
    `*Titik Pemeriksaan Pintu Masuk:*\n` +
    `Pelabuhan Laut Pomako & Bandara Mozes Kilangin Timika.\n\n` +
    `──────────────────────\n` +
    `Ketik *0* untuk kembali ke Menu Utama, atau *4* untuk menyampaikan keluhan.`,

  SUBMENU_2_PENGELUARAN:
    `*PENGELUARAN HEWAN & PENERBITAN SKKH (ARUS KELUAR)*\n\n` +
    `Prosedur permohonan Surat Keterangan Kesehatan Hewan (SKKH) dan Rekomendasi Pengeluaran:\n\n` +
    `1. Mengajukan surat permohonan pemeriksaan ke Dinas Peternakan & Keswan Kab. Mimika.\n` +
    `2. Melampirkan identitas pemilik (KTP) dan data ternak (jumlah, jenis, jenis kelamin, umur, tanda pengenal/ear-tag jika ada).\n` +
    `3. Petugas medik/paramedik veteriner dinas akan melakukan pemeriksaan klinis langsung di kandang/lokasi penampungan.\n` +
    `4. Apabila hewan dinyatakan sehat dan memenuhi persyaratan teknis, SKKH dan Rekomendasi Pengeluaran diterbitkan (1–2 hari kerja).\n` +
    `5. Masa berlaku SKKH pengeluaran adalah 7 (tujuh) hari kerja sejak tanggal diterbitkan.\n\n` +
    `──────────────────────\n` +
    `Ketik *0* untuk kembali ke Menu Utama, atau *4* untuk menyampaikan keluhan.`,

  SUBMENU_3_RANTAI_DINGIN:
    `*PENGAWASAN PRODUK OLAHAN & RANTAI DINGIN*\n\n` +
    `Standar keamanan pangan asal hewan (Aman, Sehat, Utuh, dan Halal) di Kabupaten Mimika:\n\n` +
    `- Standar Suhu Rantai Dingin:\n` +
    `  * Daging & jeroan beku wajib disimpan pada suhu minimal -18°C.\n` +
    `  * Daging segar/dingin (chilled) pada suhu 0°C sampai 4°C.\n` +
    `- Kelengkapan Pengiriman:\n` +
    `  * Kontainer reefer berpendingin dengan pengukur suhu otomatis (data logger).\n` +
    `  * Memiliki Sertifikat Sanitasi Produk Hewan dari daerah asal.\n` +
    `- Posko Pengawasan Lapangan:\n` +
    `  Petugas melakukan inspeksi fisik kontainer dan uji organoleptik saat pembongkaran di Pelabuhan Pomako.\n\n` +
    `──────────────────────\n` +
    `Ketik *0* untuk kembali ke Menu Utama, atau *4* untuk menyampaikan keluhan.`,

  COMPLAINT_STEP_1_NAME:
    `*LAYANAN ADUAN & KELUHAN MASYARAKAT*\n` +
    `*Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika*\n\n` +
    `Layanan ini untuk menyampaikan kendala pelayanan, keluhan perizinan lalu lintas ternak, atau laporan darurat penyakit hewan.\n\n` +
    `*Langkah 1 dari 3:*\n` +
    `Silakan ketik *Nama Lengkap Anda* (wajib):\n\n` +
    `──────────────────────\n` +
    `Ketik *0* untuk membatalkan dan kembali ke Menu Utama.`,

  COMPLAINT_STEP_2_PHONE: (name: string, detectedPhone?: string) => {
    const hint = detectedPhone
      ? `\n(Ketik *OK* untuk menggunakan nomor WhatsApp ini: *${detectedPhone}*)`
      : `\n(Contoh: 081240000000)`;
    return (
      `Halo Bapak/Ibu *${name}*.\n\n` +
      `*Langkah 2 dari 3:*\n` +
      `Silakan masukkan *Nomor Telepon / WhatsApp Aktif* yang dapat dihubungi oleh petugas:\n` +
      `(Bisa nomor pribadi Anda atau nomor penanggung jawab di lokasi)${hint}\n\n` +
      `──────────────────────\n` +
      `Ketik *0* untuk membatalkan.`
    );
  },

  COMPLAINT_STEP_3_DESC: (phone: string) =>
    `Nomor kontak tersimpan: *${phone}*\n\n` +
    `*Langkah 3 dari 3:*\n` +
    `Silakan ketik *Isi Aduan atau Keluhan Anda* secara jelas:\n` +
    `(Jelaskan lokasi distrik/kampung, jenis ternak, atau kendala pelayanan yang dialami)\n\n` +
    `──────────────────────\n` +
    `Ketik *0* untuk membatalkan.`,

  COMPLAINT_INVALID_NAME:
    `Nama yang dimasukkan tidak valid atau terlalu singkat.\n` +
    `Silakan ketik Nama Lengkap Anda (minimal 2 huruf):`,

  COMPLAINT_INVALID_PHONE:
    `Nomor telepon tidak valid.\n` +
    `Silakan masukkan nomor HP/WhatsApp yang benar (minimal 8 angka, contoh: 081240000000):`,

  COMPLAINT_CONFIRMATION: (ticketNo: string, reporterName: string, phone: string) =>
    `*BUKTI PENCATATAN ADUAN MASYARAKAT*\n\n` +
    `Nomor Tiket: *${ticketNo}*` +
    `\nNama Pelapor: *${reporterName}*` +
    `\nNomor Kontak: *${phone}*` +
    `\nWilayah: *Kabupaten Mimika*` +
    `\nStatus: *BARU (Menunggu Tindak Lanjut Petugas)*\n\n` +
    `Laporan Anda telah berhasil masuk ke antrean Dashboard Petugas Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika.\n\n` +
    `Petugas kami akan segera meninjau dan merespons langsung di percakapan ini. Chatbot otomatis dinonaktifkan sementara agar komunikasi dengan petugas berjalan lancar.\n\n` +
    `──────────────────────\n` +
    `Ketik *0* atau *MENU* kapan saja jika ingin menampilkan kembali menu bot.`,

  INVALID_OPTION_HINT:
    `Pilihan tidak dikenali.\n` +
    `Silakan balas dengan angka *1, 2, 3, atau 4* sesuai menu, atau ketik *0* untuk menampilkan Menu Utama.`,

  INVALID_LIMIT_REACHED:
    `Pesan Anda telah kami teruskan ke petugas Dinas Peternakan. Petugas kami akan segera membalas pada jam operasional kerja. Terima kasih telah menghubungi kami.`,
};
