import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LOGIN_IMAGE, SUANGGI_BRAND } from '../../constants/brand';
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
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#f6f5ef]">
      <div className="relative min-h-[13rem] h-[30vh] max-h-72 lg:h-auto lg:max-h-none lg:min-h-screen overflow-hidden bg-[#173d22]">
        <img
          src={LOGIN_IMAGE.url}
          alt={LOGIN_IMAGE.alt}
          width={LOGIN_IMAGE.width}
          height={LOGIN_IMAGE.height}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <main className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-3 text-[#183b22] hover:text-[#276438]">
            <span className="flex h-11 w-11 items-center justify-center bg-[#174b2b] text-sm font-extrabold text-white">{SUANGGI_BRAND.initials}</span>
            <span>
              <span className="block text-lg font-extrabold leading-tight tracking-tight">{SUANGGI_BRAND.name}</span>
              <span className="mt-0.5 block text-xs font-semibold text-[#48564b]">{SUANGGI_BRAND.motto}</span>
            </span>
          </Link>

          <header className="mb-7 mt-10">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#426a34]">Portal Internal</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1b261d]">Masuk Portal Petugas</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#4f5b51]">{SUANGGI_BRAND.fullName} &bull; {SUANGGI_BRAND.agencyShort}</p>
          </header>

          <div className="border border-[#d4d8cd] bg-white px-5 py-6 shadow-sm sm:px-7">
            {error && (
              <div role="alert" className="mb-5 border border-[#bd332c] bg-[#fff0ed] p-3.5 text-sm font-medium text-[#8f211c]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-identifier" className="mb-1.5 block text-sm font-bold text-[#202820]">Username atau Email Dinas</label>
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan username atau email petugas"
                  className="w-full border border-[#8a9389] bg-white px-3.5 py-3 text-sm text-[#1f2328] placeholder:text-[#626b62] focus:border-[#174b2b] focus:outline-none focus:ring-2 focus:ring-[#174b2b]/30"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-sm font-bold text-[#202820]">Kata Sandi</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full border border-[#8a9389] bg-white px-3.5 py-3 text-sm text-[#1f2328] placeholder:text-[#626b62] focus:border-[#174b2b] focus:outline-none focus:ring-2 focus:ring-[#174b2b]/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-[#174b2b] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#10391f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Memeriksa kredensial...' : `Masuk ke Portal ${SUANGGI_BRAND.name}`}
              </button>
            </form>

            <div className="mt-6 border-t border-[#d9ddd5] pt-5 text-xs leading-relaxed text-[#4f5b51]">
              <span className="font-bold text-[#202820]">Kebijakan Akses:</span> Akses internal {SUANGGI_BRAND.name} terbatas bagi Petugas Karantina, Dokter Hewan Berwenang, dan Pimpinan {SUANGGI_BRAND.agency}.
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link to="/" className="font-bold text-[#174b2b] underline-offset-4 hover:underline">Kembali ke Portal Publik</Link>
            <Link to="/konsultasi" className="font-semibold text-[#465448] underline-offset-4 hover:underline">Bantuan Admin</Link>
          </div>
        </div>
      </main>
    </div>
  );
};
