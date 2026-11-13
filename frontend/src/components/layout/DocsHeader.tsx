import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { SUANGGI_BRAND } from '../../constants/brand';
import { useAuth } from '../../context/AuthContext';
import { SearchModal } from './SearchModal';

interface DocsHeaderProps {
  onToggleMobileMenu?: () => void;
}

const publicLinks = [
  { label: 'Beranda', to: '/', end: true },
  { label: 'Profil & Tentang', to: '/about' },
  { label: 'Persyaratan', to: '/persyaratan' },
  { label: 'Pemeriksaan', to: '/pemeriksaan' },
  { label: 'iSIKHNAS', to: '/isikhnas' },
  { label: 'Konsultasi', to: '/konsultasi' },
];

export const DocsHeader: React.FC<DocsHeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if ((e.key === '/' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center border-b-2 px-2 text-[13px] font-semibold transition-colors ${
      isActive ? 'border-[#d6a51d] text-[#174b2b]' : 'border-transparent text-[#3f4b41] hover:border-[#c5cbbf] hover:text-[#174b2b]'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#d8dbd2] bg-white shadow-[0_2px_8px_rgba(24,45,27,0.06)]">
        <div className="hidden min-h-7 items-center justify-between bg-[#173d22] px-6 text-[14px] font-semibold text-[#f3f1e8] lg:flex xl:px-10">
          <span>{SUANGGI_BRAND.agency}</span>
          <span className="text-[#f4d16b]">{SUANGGI_BRAND.region}</span>
        </div>
        <div className="mx-auto flex min-h-[5rem] max-w-[1600px] items-center gap-3 px-3 sm:px-6 xl:px-10">
          <div className="flex shrink-0 items-center gap-2.5">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="inline-flex min-h-11 items-center gap-2 border border-[#b9c0b4] px-3 text-sm font-semibold text-[#203b25] hover:bg-[#f2f4ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174b2b] lg:hidden"
                aria-label="Buka menu navigasi"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">Menu</span>
              </button>
            )}
            <Link to="/" className="flex items-center gap-3.5 text-[#1d2b1f]">
              <span className="flex h-12 w-12 items-center justify-center bg-[#174b2b] text-m font-extrabold tracking-tight text-white">{SUANGGI_BRAND.initials}</span>
              <span className="min-w-0 max-w-2xl">
                <span className="block text-base font-extrabold leading-tight tracking-tight text-[#173d22] sm:text-[18px]">{SUANGGI_BRAND.name}</span>
                <span className="hidden text-[12px] font-semibold leading-tight text-[#566056] xl:block">SISTEM UPDATE ARUS NIAGA DAN GERAK HEWAN, PRODUK HEWAN, DAN OLAHANNYA</span>
                <span className="hidden text-[12px] font-semibold leading-tight text-[#566056] xl:block">CATATAN ARUS, REKAPITULASI, DAN INFORMASI KOMODITAS</span>
              </span>
            </Link>
          </div>

          <nav aria-label="Navigasi utama" className="ml-auto hidden items-center gap-1 lg:flex">
            {publicLinks.map((item) => (
              <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : undefined} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-3">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center border border-[#b9c0b4] text-[#263b2a] hover:bg-[#f2f4ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174b2b]"
              aria-label="Cari informasi SUANGGI"
              title="Cari informasi ( / )"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35m1.35-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
              </svg>
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="inline-flex min-h-11 items-center bg-[#174b2b] px-3 text-xs font-bold text-white hover:bg-[#10391f] sm:px-4 sm:text-sm">Portal Petugas</Link>
                <button type="button" onClick={logout} className="min-h-11 px-2 text-xs font-semibold text-[#8d2723] underline-offset-4 hover:underline sm:text-sm">Keluar</button>
              </div>
            ) : (
              <Link to="/login" className="inline-flex min-h-11 items-center bg-[#d6a51d] px-3 text-xs font-extrabold text-[#1d261c] hover:bg-[#c3910d] sm:px-4 sm:text-sm">Masuk Petugas</Link>
            )}
          </div>
        </div>
        <nav aria-label="Navigasi utama" className="flex gap-1 overflow-x-auto border-t border-[#e4e6df] px-3 lg:hidden">
          {publicLinks.map((item) => (
            <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : undefined} className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-xs font-semibold ${isActive ? 'border-[#d6a51d] text-[#174b2b]' : 'border-transparent text-[#465047]'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
