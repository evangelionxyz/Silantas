import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan saat masuk');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-12 h-12 rounded-lg bg-[#1a7f37] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            SL
          </div>
        </Link>
        <h2 className="text-2xl font-bold text-[#1f2328] tracking-tight">
          Masuk Portal Petugas
        </h2>
        <p className="text-sm text-[#57606a] mt-1">
          SI-LANTAS HEWAN &bull; Dinas Peternakan & Keswan Kab. Mimika
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#d0d7de] rounded-xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-[#ffebe9] border border-[#ff8182]/40 text-sm text-[#cf222e] flex items-center gap-2.5">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1f2328] uppercase tracking-wide mb-1.5">
                Username atau Email
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="misal: admin atau petugas"
                className="w-full px-3.5 py-2.5 text-sm bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#1f2328] uppercase tracking-wide">
                  Kata Sandi
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full px-3.5 py-2.5 text-sm bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da]/30 focus:border-[#0969da]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-2.5 px-4 text-sm font-semibold text-white bg-[#1a7f37] hover:bg-[#1a7f37]/90 rounded-md transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
            >
              {loading ? 'Memeriksa kredensial...' : 'Masuk ke Portal Internal'}
            </button>
          </form>

          {/* Access Policy Information */}
          <div className="mt-6 pt-5 border-t border-[#d0d7de] text-xs text-[#57606a] leading-relaxed">
            <span className="font-semibold text-[#1f2328]">Kebijakan Akses:</span> Akses internal terbatas bagi Petugas, Dokter Hewan, dan Pimpinan Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika.
          </div>
        </div>

        <div className="text-center mt-5">
          <Link to="/" className="text-sm font-semibold text-[#0969da] hover:underline inline-flex items-center gap-1.5">
            <span>&larr; Kembali ke Panduan Layanan Publik</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
