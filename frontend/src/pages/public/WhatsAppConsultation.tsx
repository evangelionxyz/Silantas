import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { SUANGGI_BRAND } from '../../constants/brand';
import { fetchWhatsappConfig, type WhatsappConfig } from '../../services/api';

export const WhatsAppConsultation: React.FC = () => {
    const [config, setConfig] = useState<WhatsappConfig>({
        whatsappNumber: '6281240000000',
        whatsappMessage: SUANGGI_BRAND.defaultWhatsappMessage,
        agencyName: SUANGGI_BRAND.agency,
    });
    const [selectedTopic, setSelectedTopic] = useState<string>('Umum');
    const [customApplicantName, setCustomApplicantName] = useState<string>('');

    useEffect(() => {
        fetchWhatsappConfig()
            .then((res) => {
                setConfig({
                    ...res,
                    whatsappMessage: res.whatsappMessage.replace(/SI-LANTAS HEWAN MIMIKA|SI-LANTAS/gi, SUANGGI_BRAND.name),
                });
            })
            .catch(() => { });
    }, []);

    const templates: { [key: string]: string } = {
        Umum: `Halo Admin ${SUANGGI_BRAND.name} (${SUANGGI_BRAND.fullName}) Kabupaten Mimika, saya ingin konsultasi umum mengenai pelayanan lalu lintas hewan dan produk hewan.`,
        'Pemasukan Hewan & Produk': `Halo Admin ${SUANGGI_BRAND.name}, saya ingin menanyakan prosedur dan persyaratan izin Pemasukan (data hewan/produk masuk) ke Kabupaten Mimika.`,
        'Pengeluaran & Penerbitan SKKH': `Halo Dokter Hewan ${SUANGGI_BRAND.name} Mimika, saya ingin mengajukan jadwal pemeriksaan kesehatan ternak untuk penerbitan SKKH Pengeluaran (keluar daerah).`,
        'Pemeriksaan Daging & Rantai Dingin': `Halo Admin ${SUANGGI_BRAND.name}, saya pelaku usaha ingin berkonsultasi mengenai kelengkapan dokumen pengiriman daging beku / telur ayam ke Pelabuhan Pomako.`,
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
                { label: `Layanan Publik ${SUANGGI_BRAND.name}`, href: '/' },
                { label: 'Konsultasi WhatsApp Business' }
            ]} />

            <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 flex-1">
                <motion.main
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="py-8 sm:py-10 docs-prose min-w-0"
                >
                    <div className="not-prose bg-[#14532d] text-white p-6 sm:p-8 mb-8 border border-[#166534] shadow-xs">
                        <span className="inline-block px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider bg-[#4ade80] text-[#052e16] mb-3">
                            Saluran Resmi Pelayanan &bull; {SUANGGI_BRAND.name}
                        </span>
                        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2.5 leading-tight">
                            Konsultasi &amp; Chatting WhatsApp Business {SUANGGI_BRAND.name}
                        </h1>
                        <p className="text-sm sm:text-base text-[#dcfce7] leading-relaxed m-0">
                            Saluran komunikasi langsung dengan Tim Verifikator dan Administrator {SUANGGI_BRAND.agency} ({SUANGGI_BRAND.motto}).
                        </p>
                    </div>

                    <div className="not-prose p-5 border border-[#d0d7de] bg-white mb-8 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                            <div>
                                <span className="text-xs uppercase tracking-wider font-extrabold">
                                    Nomor Resmi Pelayanan WhatsApp
                                </span>
                                <div className="text-2xl sm:text-3xl font-mono font-extrabold text-[#14532d] mt-1">
                                    +{config.whatsappNumber}
                                </div>
                                <div className="text-xs sm:text-sm font-semibold flex items-center gap-2 mt-2">
                                    <span>Jam Pelayanan: Senin - Jumat (08.00 - 16.00 WIT)</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleOpenWhatsApp}
                                className="px-5 py-3 text-sm font-bold text-white bg-[#15803d] hover:bg-[#14532d] transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0"
                            >
                                <span>Mulai Chatting WhatsApp</span>
                            </button>
                        </div>
                    </div>

                    <h2>Pilih Topik Konsultasi Cepat</h2>
                    <p>
                        Pilih topik di bawah ini untuk menyiapkan pesan pembuka otomatis kepada petugas {SUANGGI_BRAND.name}:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4 not-prose">
                        {Object.keys(templates).map((topic) => (
                            <button
                                key={topic}
                                type="button"
                                onClick={() => setSelectedTopic(topic)}
                                className={`text-left p-4 border text-sm transition-colors ${selectedTopic === topic
                                        ? 'border-[#15803d] bg-[#f0fdf4] text-[#14532d] font-medium'
                                        : 'border-[#d0d7de] bg-white text-[#1f2328] hover:bg-[#f0fdf4]/40'
                                    }`}
                            >
                                <div className="font-extrabold text-sm mb-1.5">{topic}</div>
                                <div className="text-xs text-[#4b5563] line-clamp-2 leading-relaxed">{templates[topic]}</div>
                            </button>
                        ))}
                    </div>

                    <div className="my-6 not-prose space-y-2">
                        <label
                            htmlFor="applicant-name-input"
                            className="block text-xs font-bold text-[#1f2328] uppercase tracking-wide"
                        >
                            Nama Pemohon / Pelaku Usaha (Opsional):
                        </label>
                        <div className="flex flex-row items-center gap-3">
                            <input
                                id="applicant-name-input"
                                type="text"
                                value={customApplicantName}
                                onChange={(e) => setCustomApplicantName(e.target.value)}
                                placeholder="Masukkan nama pemohon atau nama usaha..."
                                className="w-full sm:w-96 p-3 text-sm border border-[#d0d7de] focus:outline-none focus:border-[#15803d] bg-white text-[#1f2328]"
                            />
                            <button
                                type="button"
                                onClick={handleOpenWhatsApp}
                                className="px-6 p-3 text-sm font-bold text-white bg-[#14532d] hover:bg-[#15803d] transition-colors"
                            >
                                Kirim Pesan ke WhatsApp Admin {SUANGGI_BRAND.name}
                            </button>
                        </div>
                    </div>
                </motion.main>
            </div>
        </div>
    );
};
