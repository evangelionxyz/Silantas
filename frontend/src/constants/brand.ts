export interface CoreFeatureItem {
  id: 'pemasukan' | 'pengeluaran' | 'pemuktahiran' | 'monitoring';
  title: string;
  description: string;
  badge: string;
  accentColor: string;
  bgLight: string;
  borderColor: string;
  imageUrl: string;
  imageAlt: string;
}

export interface LivestockGalleryImage {
  id: string;
  url: string;
  alt: string;
  caption: string;
  categoryLabel: string;
  width: number;
  height: number;
}

export const SUANGGI_BRAND = {
  name: 'SUANGGI CARI KO',
  initials: 'SG',
  fullName: 'SISTEM INFORMASI LALU LINTAS HEWAN',
  motto: 'Data Terpadu - Akurat - Terkini',
  mottoParts: ['Data Terpadu', 'Akurat', 'Terkini'] as const,
  slogan: 'Satu Sistem, Satu Data, Terpantau Lalu Lintas Hewan dan Produk Hewan',
  agency: 'Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika',
  agencyShort: 'Dinas Peternakan & Keswan Kab. Mimika',
  region: 'Kabupaten Mimika, Papua Tengah',
  defaultWhatsappMessage:
    'Halo Admin SUANGGI (Sistem Informasi Lalu Lintas Hewan) Kabupaten Mimika, saya ingin berkonsultasi mengenai layanan lalu lintas hewan dan produk hewan.',
} as const;

export const SUANGGI_CORE_FEATURES: CoreFeatureItem[] = [
  {
    id: 'pemasukan',
    title: 'Pemasukan',
    description: 'Data Hewan dan Produk Hewan Masuk',
    badge: 'Arus Masuk (Impor Daerah)',
    accentColor: '#174b2b',
    bgLight: '#edf1e7',
    borderColor: '#a6b39e',
    imageUrl:
      'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Ternak sapi sehat di kawasan peternakan hijau untuk pemasukan daerah',
  },
  {
    id: 'pengeluaran',
    title: 'Pengeluaran',
    description: 'Data Hewan dan Produk Hewan Keluar',
    badge: 'Arus Keluar (Ekspor Daerah)',
    accentColor: '#526b3d',
    bgLight: '#f1f1e8',
    borderColor: '#b9bd9d',
    imageUrl:
      'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Peternakan unggas dan komoditas ternak siap distribusi keluar daerah',
  },
  {
    id: 'pemuktahiran',
    title: 'Pemuktahiran',
    description: 'Pengelolaan data terkini',
    badge: 'Verifikasi & Dokumen SKKH',
    accentColor: '#805500',
    bgLight: '#f8f0d8',
    borderColor: '#d4bb71',
    imageUrl:
      'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Ternak ruminansia dengan penanda kesehatan terverifikasi terkini',
  },
  {
    id: 'monitoring',
    title: 'Monitoring',
    description: 'Statistik dan laporan lalu lintas',
    badge: 'Rekapitulasi & Pengawasan',
    accentColor: '#36583c',
    bgLight: '#eaf0e7',
    borderColor: '#a8b8a5',
    imageUrl:
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Pengawasan mutu daging dan produk hewan rantai dingin terpadu',
  },
];

export const LIVESTOCK_HERO_IMAGE: LivestockGalleryImage = {
  id: 'hero-cattle-pasture',
  url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80',
  alt: 'Peternakan sapi sehat di padang penggembalaan hijau dalam pengawasan SUANGGI',
  caption: 'Pengawasan Kesehatan Ternak & Biosekuriti Kabupaten Mimika',
  categoryLabel: 'Hewan Hidup & Ruminansia',
  width: 1200,
  height: 750,
};

export const LOGIN_IMAGE: LivestockGalleryImage = {
    id: 'login-cattle',
    url: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80',
    alt: 'Sapi ternak sehat di padang rumput hijau',
    caption: 'Pemasukan & Pengeluaran Ternak Besar',
    categoryLabel: 'Ternak Ruminansia',
    width: 700,
    height: 460,
};

export const PUBLIC_COMMODITY_IMAGES = {
  liveAnimals: {
    url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
    alt: 'Ternak hidup yang menjalani pengawasan karantina dan pemeriksaan SKKH',
    width: 800,
    height: 500,
  },
  freshFrozenProducts: {
    url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80',
    alt: 'Produk daging segar dan beku dengan standar rantai dingin veteriner',
    width: 800,
    height: 500,
  },
  eggsAndProcessed: {
    url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80',
    alt: 'Telur konsumsi dan hasil olahan peternakan higienis',
    width: 800,
    height: 500,
  },
} as const;
