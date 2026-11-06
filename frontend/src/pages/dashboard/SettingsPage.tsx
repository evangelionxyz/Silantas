import React, { useEffect, useState } from 'react';
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
      <div className="p-8 text-center bg-white border border-[#d0d7de] rounded-md">
        <h2 className="text-base font-semibold text-[#d1242f] mb-1">Akses Terbatas</h2>
        <p className="text-xs text-[#656d76]">
          Pengaturan sistem hanya dapat diakses oleh Administrator Sistem.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-b border-[#d0d7de] pb-4">
        <h1 className="text-xl font-semibold text-[#1f2328] tracking-tight">
          Pengaturan Sistem & Saluran WhatsApp
        </h1>
        <p className="text-xs text-[#656d76] mt-0.5">
          Atur kontak resmi WhatsApp Business yang digunakan pada tombol konsultasi publik.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-md text-xs border ${
            statusMessage.type === 'success'
              ? 'bg-[#dafbe1] text-[#1a7f37] border-[#4ac26b]/40'
              : 'bg-[#ffebe9] text-[#d1242f] border-[#ff8182]/40'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="p-5 rounded-md border border-[#d0d7de] bg-white">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#1f2328] mb-1">Nama Instansi</label>
            <input
              type="text"
              disabled
              value={agencyName}
              className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded bg-[#f6f8fa] text-[#656d76]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1f2328] mb-1">
              Nomor WhatsApp Business Pelayanan (Format Internasional)
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-mono text-[#656d76] bg-[#f6f8fa] border border-r-0 border-[#d0d7de] rounded-l">
                +
              </span>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="misal: 6281240000000"
                className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded-r font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#0969da]"
              />
            </div>
            <p className="text-[11px] text-[#656d76] mt-1">
              Gunakan kode negara tanpa tanda plus atau spasi (contoh: 6281240000000).
            </p>
          </div>

          <div>
            <label className="block font-semibold text-[#1f2328] mb-1">
              Pesan Pembuka Konsultasi Bawaan
            </label>
            <textarea
              rows={3}
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#d0d7de] rounded focus:outline-none focus:ring-1 focus:ring-[#0969da]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || saving}
              className="px-4 py-2 font-semibold text-white bg-[#1a7f37] hover:bg-[#1a7f37]/90 rounded disabled:opacity-50 transition-colors shadow-2xs"
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan WhatsApp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
