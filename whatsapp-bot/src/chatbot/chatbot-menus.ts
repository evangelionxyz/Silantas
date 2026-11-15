export const ADMIN_WHATSAPP_CONTACT = '+6281141112269';

export const CHATBOT_MENUS = {
  GREETING_HEADER: (name?: string, webUrl?: string) => {
    const cleanUrl = (webUrl || process.env.FRONTEND_WEB_URL || 'https://silantas.vercel.app').replace(/\/+$/, '');
    const cleanName = name && name.trim() !== '.' ? name.trim() : '';
    return (
      `*LAYANAN INFORMASI & BANTUAN LALU LINTAS HEWAN*\n` +
      `*Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika*\n` +
      `*(SI-LANTAS HEWAN MIMIKA)*\n\n` +
      `Halo ${cleanName ? `Bapak/Ibu *${cleanName}*` : 'Bapak/Ibu'}, selamat datang di layanan WhatsApp SI-LANTAS HEWAN MIMIKA.\n\n` +
      `Silakan pilih jenis kebutuhan Anda dengan membalas angka *1* atau *2*:\n\n` +
      `1. *Informasi*\n` +
      `   (Persyaratan lalu lintas, pemeriksaan kesehatan, dan prosedur website Lalin.isikhnas)\n\n` +
      `2. *Bantuan*\n` +
      `   (Konsultasi dan komunikasi dengan Admin SI-LANTAS HEWAN MIMIKA)\n\n` +
      `Portal Informasi: ${cleanUrl}\n` +
      `\n` +
      `Ketik *0*, *MENU*, atau *#MENU* kapan saja untuk kembali ke menu utama.`
    );
  },

  MENU_INFORMASI:
    `*LAYANAN INFORMASI*\n\n` +
    `Silakan balas dengan angka *(1 - 3)* sesuai informasi yang Anda butuhkan:\n\n` +
    `1. Informasi persyaratan pemasukan dan pengeluaran hewan, produk hewan, serta olahannya.\n` +
    `2. Informasi pemeriksaan kesehatan hewan, produk hewan, dan olahannya yang akan dilalulintaskan.\n` +
    `3. Informasi prosedur penggunaan website Lalin.isikhnas.\n\n` +
    `Ketik *0* untuk kembali ke Menu Utama.`,

  SUBMENU_INFORMASI_1_CHAT_1:
    `*INFORMASI PERSYARATAN PEMASUKAN DAN PENGELUARAN HEWAN, PRODUK HEWAN, DAN OLAHANNYA DI KABUPATEN MIMIKA*\n\n` +
    `*Tujuan persyaratan:*\n` +
    `Memastikan setiap hewan dan produk hewan yang dilalulintaskan memenuhi persyaratan kesehatan, keamanan, dan ketentuan karantina sehingga dapat mencegah penyebaran penyakit hewan serta menjaga keamanan pangan masyarakat.\n\n` +
    `*1. Persyaratan pemasukan hewan, Produk hewan ke Kabupaten Mimika*\n` +
    `Bagi masyarakat atau pelaku usaha yang akan memasukkan hewan, Produk hewan ke Kabupaten Mimika, perlu mempersiapkan:\n` +
    `1. Fotokopi KTP atau identitas pemohon.\n` +
    `2. Surat permohonan pemasukan hewan, produk hewan.\n` +
    `3. Informasi jenis dan jumlah hewan, produk hewan yang akan dimasukkan.\n` +
    `4. Informasi asal daerah dan tujuan pemasukan.\n` +
    `5. Informasi produsen atau unit usaha asal.\n` +
    `6. Kemasan dan label produk yang sesuai ketentuan.\n` +
    `7. Sertifikat Veteriner atau Surat Keterangan Kesehatan Hewan, Surat Keterangan Kesehatan Produk Hewan sesuai jenis produk dan ketentuan yang berlaku daerah asal.\n` +
    `8. Rekomendasi pemasukan dari Otoritas Veteriner daerah tujuan apabila dipersyaratkan.\n` +
    `9. Produk hewan meliputi daging sapi, daging babi, daging ayam, telur, susu, serta produk olahan seperti sosis, bakso, nugget, keju, dan produk lainnya.\n` +
    `10. Semua proses permohonan dimulai dari rekomendasi pemasukan hingga Sertifikat Veteriner diterbitkan dalam sistem lalin.isikhnas.go.id., dan dapat dipandu oleh petugas SI-LANTAS HEWAN MIMIKA melalui pusat kontak whatsapp ${ADMIN_WHATSAPP_CONTACT}.`,

  SUBMENU_INFORMASI_1_CHAT_2:
    `*2. Persyaratan pengeluaran hewan, produk hewan dari Kabupaten Mimika*\n` +
    `Bagi masyarakat atau pelaku usaha yang akan mengeluarkan hewan, produk hewan dari Kabupaten Mimika, perlu mempersiapkan:\n` +
    `1. Fotokopi KTP atau identitas pemohon.\n` +
    `2. Surat permohonan pengeluaran hewan, produk hewan.\n` +
    `3. Informasi jenis dan jumlah hewan, produk hewan.\n` +
    `4. Informasi daerah tujuan pengiriman.\n` +
    `5. Dokumen kepemilikan atau bukti asal hewan, produk hewan apabila diperlukan.\n` +
    `6. Pemeriksaan kesehatan hewan, produk hewan oleh petugas berwenang dari Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika.\n` +
    `7. Sertifikat Veteriner atau Surat Keterangan Kesehatan Hewan, Surat Keterangan Kesehatan Produk Hewan sesuai jenis produk dan ketentuan yang berlaku daerah asal yaitu Kabupaten Mimika Propinsi Papua Tengah.\n` +
    `8. Rekomendasi pengeluaran dan pemasukan sesuai ketentuan wilayah asal dan tujuan.\n` +
    `9. Produk hewan meliputi daging sapi, daging babi, daging ayam, telur, susu, serta produk olahan seperti sosis, bakso, nugget, keju, dan produk lainnya.\n` +
    `10. Semua proses permohonan dimulai dari rekomendasi pemasukan hingga Sertifikat Veteriner diterbitkan dalam sistem lalin.isikhnas.go.id., dan dapat dipandu oleh petugas SI-LANTAS HEWAN MIMIKA melalui pusat kontak whatsapp ${ADMIN_WHATSAPP_CONTACT}.\n\n` +
    `Ketik *0* untuk kembali ke Menu Utama.`,

  SUBMENU_INFORMASI_2_CHAT_1:
    `Silakan lengkapi template data di bawah ini untuk keperluan informasi pemeriksaan kesehatan hewan, produk hewan, dan olahannya yang akan dilalulintaskan:`,

  SUBMENU_INFORMASI_2_CHAT_2:
    `1. Nama pemohon:\n` +
    `2. Alamat:\n` +
    `3. No HP yang bisa dihubungi:\n` +
    `4. Jenis dan jumlah hewan/produk:`,

  SUBMENU_INFORMASI_3_ISIKHNAS:
    `*PROSEDUR PENGGUNAAN WEBSITE LALIN.ISIKHNAS*\n\n` +
    `1. Silahkan buat ID di web : iSIKHNAS - Lalu Lintas HPM https://share.google/KJDES3yGAFbIrpuhA\n` +
    `2. Isi Profil secara lengkap (silahkan WA apabila butuh panduan petugas)\n` +
    `3. Buat Permohonan Rekomendasi Pemasukan Daerah Tujuan Hewan,Produk Hewan;\n` +
    `4. Buat Permohonan Rekomendasi Pengeluaran Daerah Asal Hewan,Produk Hewan;\n` +
    `5. Buat Permohonan SKKH/SKKPH Daerah Asal Hewan,Produk Hewan;\n` +
    `6. Buat Permohonan Sertifikat Veteriner Daerah Asal Hewan,Produk Hewan\n` +
    `7. Setiap Proses harus ditunggu hingga disetujui oleh Admin lalin.isikhnas.go.id Propinsi Papua Tengah\n` +
    `8. Apabila Si Pemohon masih kesulitan maka dapat dipandu oleh petugas SI-LANTAS HEWAN MIMIKA melalui pusat kontak whatsapp ${ADMIN_WHATSAPP_CONTACT}\n\n` +
    `Ketik *0* untuk kembali ke Menu Utama.`,

  MENU_BANTUAN_CHAT_1:
    `Anda butuh bantuan? Baik, kami akan pandu Anda oleh petugas SI-LANTAS HEWAN MIMIKA melalui pusat kontak WhatsApp ${ADMIN_WHATSAPP_CONTACT}.\n\n` +
    `Silakan lengkapi template data di bawah ini agar keluhan atau kendala Anda dapat segera ditindaklanjuti:`,

  MENU_BANTUAN_CHAT_2:
    `1. Nama:\n` +
    `2. Alamat:\n` +
    `3. No HP yang bisa dihubungi:\n` +
    `4. Keluhan/Kendala:`,

  REQUEST_CONFIRMATION: (
    ticketNo: string,
    serviceType: 'INFORMASI' | 'BANTUAN',
    reporterName: string,
    phone: string,
    address?: string,
  ) => {
    const serviceLabel = serviceType === 'INFORMASI' ? 'Informasi' : 'Bantuan';
    return (
      `*PERMOHONAN ${serviceLabel.toUpperCase()} DITERIMA*\n\n` +
      `Nomor Tiket: *${ticketNo}*\n` +
      `Jenis Layanan: *${serviceLabel}*\n` +
      `Nama: *${reporterName}*\n` +
      `No. HP: *${phone}*\n` +
      `Alamat: *${address || 'Kabupaten Mimika'}*\n\n` +
      `Terima kasih telah menghubungi SI-LANTAS HEWAN MIMIKA. Petugas kami akan segera meninjau dan menghubungi Anda kembali di percakapan ini.\n\n` +
      `Ketik *0* atau *MENU* kapan saja jika ingin menampilkan kembali menu utama.`
    );
  },

  INVALID_OPTION_HINT_MAIN:
    `Pilihan tidak dikenali.\n` +
    `Silakan balas dengan angka *1* (Informasi) atau *2* (Bantuan), atau ketik *0* untuk menampilkan Menu Utama.`,

  INVALID_OPTION_HINT_INFORMASI:
    `Pilihan tidak dikenali.\n` +
    `Silakan balas dengan angka *1*, *2*, atau *3* sesuai layanan informasi yang Anda butuhkan, atau ketik *0* untuk kembali ke Menu Utama.`,

  INVALID_LIMIT_REACHED:
    `Pesan Anda telah kami teruskan ke petugas SI-LANTAS HEWAN MIMIKA. Petugas kami akan segera membalas pada jam operasional kerja. Terima kasih telah menghubungi kami.`,
};
