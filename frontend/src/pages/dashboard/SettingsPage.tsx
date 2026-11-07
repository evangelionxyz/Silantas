import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { fetchWhatsappConfig, updateWhatsappConfig } from '../../services/api';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchWhatsappConfig()
      .then((cfg) => {
        setWhatsappNumber(cfg.whatsappNumber);
        setWhatsappMessage(cfg.whatsappMessage);
        setAgencyName(cfg.agencyName);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setSaving(true);

    try {
      await updateWhatsappConfig({ whatsappNumber, whatsappMessage });
      setStatusMessage({ type: 'success', text: 'Konfigurasi WhatsApp berhasil diperbarui dan disimpan.' });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal memperbarui konfigurasi',
      });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white border border-[#d0d7de] rounded-lg">
        <h2 className="text-base font-semibold text-[#cf222e] mb-1">Akses Terbatas</h2>
        <p className="text-sm text-[#57606a]">
          Pengaturan sistem hanya dapat diakses oleh Administrator Sistem.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="max-w-2xl space-y-6"
    >
      <div className="border-b border-[#d0d7de] pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1f2328] tracking-tight">
          Pengaturan Sistem & Saluran WhatsApp
        </h1>
        <p className="text-sm text-[#57606a] mt-1">
          Atur kontak resmi WhatsApp Business yang digunakan pada tombol konsultasi publik.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 text-sm border ${
            statusMessage.type === 'success'
              ? 'bg-[#dafbe1] text-[#1a7f37] border-[#4ac26b]/40'
              : 'bg-[#ffebe9] text-[#cf222e] border-[#ff8182]/40'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="p-5 sm:p-6 border border-[#d0d7de] bg-white shadow-2xs">
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div>
            <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">Nama Instansi</label>
            <input
              type="text"
              disabled
              value={agencyName}
              className="w-full px-3 py-2 border border-[#d0d7de] bg-[#f6f8fa] text-[#57606a] text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
              Nomor WhatsApp Business Pelayanan (Format Internasional)
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3.5 py-2 text-sm font-mono text-[#57606a] bg-[#f6f8fa] border border-r-0 border-[#d0d7de] rounded-l-md font-semibold">
                +
              </span>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="misal: 6281240000000"
                className="w-full px-3 py-2 border border-[#d0d7de] rounded-r-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
              />
            </div>
            <p className="text-xs text-[#57606a] mt-1.5">
              Gunakan kode negara tanpa tanda plus atau spasi (contoh: 6281240000000).
            </p>
          </div>

          <div>
            <label className="block font-semibold text-[#1f2328] mb-1.5 text-xs uppercase tracking-wide">
              Pesan Pembuka Konsultasi Bawaan
            </label>
            <textarea
              rows={4}
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#d0d7de] focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || saving}
              className="px-5 py-2.5 font-semibold text-sm text-white bg-[#1a7f37] hover:bg-[#1a7f37]/90 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan WhatsApp'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
