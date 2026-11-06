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
    <div className="min-h-screen bg-[#f6f8fa] flex flex-col justify-center py-12 sm:px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-md bg-[#1f2328] text-white flex items-center justify-center font-bold text-base shadow-xs">
            SL
          </div>
        </Link>
        <h2 className="text-xl font-bold text-[#1f2328] tracking-tight">
          Masuk ke SI-LANTAS HEWAN
        </h2>
        <p className="text-xs text-[#656d76] mt-1">
          Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-6 sm:px-8 shadow-xs border border-[#d0d7de] rounded-md">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-[#ffebe9] border border-[#ff8182]/40 text-xs text-[#d1242f] flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1f2328] mb-1">
                Username atau Email
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="misal: evangelionxyz"
                className="w-full px-3 py-1.5 text-xs bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#1f2328]">
                  Kata Sandi
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white text-[#1f2328] border border-[#d0d7de] rounded-md focus:outline-none focus:ring-1 focus:ring-[#0969da] focus:border-[#0969da]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-4 text-xs font-semibold text-white bg-[#1a7f37] hover:bg-[#1a7f37]/90 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Memeriksa kredensial...' : 'Masuk Sistem'}
            </button>
          </form>

          {/* Access Policy Information */}
          <div className="mt-6 pt-4 border-t border-[#d0d7de] text-[11px] text-[#656d76] leading-relaxed">
            <span className="font-semibold text-[#1f2328]">Kebijakan Akses:</span> Pendaftaran akun baru dilakukan khusus oleh Administrator. Petugas atau Dokter Hewan yang belum memiliki akun dipersilakan menghubungi Admin Dinas.
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-[#0969da] hover:underline">
            &larr; Kembali ke Beranda Publik
          </Link>
        </div>
      </div>
    </div>
  );
};
