import React, { useEffect, useState } from 'react';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { DocsSidebar } from '../../components/layout/DocsSidebar';
import { fetchWhatsappConfig, type WhatsappConfig } from '../../services/api';

export const WhatsAppConsultation: React.FC = () => {
  const [config, setConfig] = useState<WhatsappConfig>({
    whatsappNumber: '6281240000000',
    whatsappMessage: 'Halo Admin SI-LANTAS HEWAN MIMIKA, saya ingin konsultasi mengenai persyaratan lalu lintas hewan/produk hewan.',
    agencyName: 'Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika',
  });
  const [selectedTopic, setSelectedTopic] = useState<string>('Umum');
  const [customApplicantName, setCustomApplicantName] = useState<string>('');

  useEffect(() => {
    fetchWhatsappConfig().then(setConfig).catch(() => {});
  }, []);

  const templates: { [key: string]: string } = {
    Umum: 'Halo Admin SI-LANTAS HEWAN MIMIKA, saya ingin konsultasi umum mengenai pelayanan lalu lintas hewan.',
    'Pemasukan Ternak': 'Halo Admin SI-LANTAS, saya ingin menanyakan prosedur dan persyaratan izin pemasukan (impor) ternak sapi/kambing/babi ke Kabupaten Mimika.',
    'Pemeriksaan Daging & Telur': 'Halo Admin SI-LANTAS, saya pelaku usaha ingin berkonsultasi mengenai kelengkapan dokumen pengiriman daging beku / telur ayam ke Pelabuhan Pomako.',
    'Penerbitan SKKH': 'Halo Dokter Hewan SI-LANTAS Mimika, saya ingin mengajukan jadwal pemeriksaan kesehatan ternak untuk penerbitan SKKH pengeluaran (ekspor).',
  };

  const handleOpenWhatsApp = () => {
    const baseMsg = templates[selectedTopic] || config.whatsappMessage;
    const fullMsg = customApplicantName
      ? `${baseMsg}\n\nNama Pemohon: ${customApplicantName}`
      : baseMsg;
    const url = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(fullMsg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Breadcrumbs items={[
        { label: 'Layanan Publik', href: '/' },
        { label: 'Konsultasi WhatsApp Business' }
      ]} />

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-start">
        <DocsSidebar className="hidden lg:block" />

        <main className="flex-1 py-8 px-0 lg:px-10 docs-prose">
          <div className="border-b border-[#d0d7de] pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1f2328] mb-3">
              Konsultasi & Chatting WhatsApp Business SI-LANTAS
            </h1>
            <p className="text-base sm:text-lg text-[#57606a] leading-relaxed">
              Saluran komunikasi langsung dengan Tim Verifikator dan Administrator Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-lg border border-[#d0d7de] bg-[#f6f8fa] mb-8 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[#57606a]">
                  Nomor Resmi Pelayanan WhatsApp
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-[#1f2328] mt-1.5">
                  +{config.whatsappNumber}
                </div>
                <div className="text-xs sm:text-sm text-[#1a7f37] font-medium flex items-center gap-2 mt-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1a7f37]"></span>
                  <span>Jam Pelayanan: Senin - Jumat (08.00 - 16.00 WIT)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="px-5 py-3 rounded-md text-sm font-semibold text-white bg-[#1a7f37] hover:bg-[#1a7f37]/90 transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer shrink-0"
              >
                <span>Mulai Chatting WhatsApp</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

          <h2>Pilih Topik Konsultasi Cepat</h2>
          <p>
            Pilih topik di bawah ini untuk menghasilkan pesan pembuka secara otomatis:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4 not-prose">
            {Object.keys(templates).map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={`text-left p-4 rounded-lg border text-sm transition-colors cursor-pointer ${
                  selectedTopic === topic
                    ? 'border-[#0969da] bg-[#ddf4ff]/40 text-[#0969da] font-medium ring-2 ring-[#0969da]/30'
                    : 'border-[#d0d7de] bg-white text-[#1f2328] hover:bg-[#f6f8fa]'
                }`}
              >
                <div className="font-bold text-sm mb-1.5">{topic}</div>
                <div className="text-xs text-[#57606a] line-clamp-2 leading-relaxed">{templates[topic]}</div>
              </button>
            ))}
          </div>

          <div className="my-6 not-prose space-y-2">
            <label className="block text-xs font-semibold text-[#1f2328] uppercase tracking-wide">
              Nama Pemohon / Pelaku Usaha (Opsional):
            </label>
            <input
              type="text"
              value={customApplicantName}
              onChange={(e) => setCustomApplicantName(e.target.value)}
              placeholder="Contoh: Budi - CV Mandiri Ternak Mimika"
              className="w-full sm:w-96 px-3.5 py-2.5 text-sm border border-[#d0d7de] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da] bg-white text-[#1f2328]"
            />
          </div>

          <div className="not-prose pt-2">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-6 py-3 rounded-md text-sm font-semibold text-white bg-[#1f2328] hover:bg-[#2f363d] transition-colors cursor-pointer shadow-2xs"
            >
              Kirim Pesan ke WhatsApp Admin &rarr;
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
