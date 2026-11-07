import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchWhatsappConfig, type WhatsappConfig } from '../../services/api';
import { SearchModal } from './SearchModal';

interface DocsHeaderProps {
  onToggleMobileMenu?: () => void;
}

export const DocsHeader: React.FC<DocsHeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [waConfig, setWaConfig] = useState<WhatsappConfig | null>(null);

  useEffect(() => {
    fetchWhatsappConfig().then(setWaConfig).catch(() => {});
  }, []);

  // Keyboard shortcut '/' and 'Ctrl/Cmd + K' to trigger search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openWhatsApp = () => {
    const num = waConfig?.whatsappNumber || '6281240000000';
    const msg = encodeURIComponent(
      waConfig?.whatsappMessage || 'Halo Admin SI-LANTAS HEWAN MIMIKA, saya ingin konsultasi.'
    );
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-[#d0d7de] select-none shadow-2xs">
        <div className="mx-auto px-3 sm:px-6 lg:px-8 min-h-[4rem] h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-1.5 -ml-1 text-[#656d76] hover:text-[#1f2328] hover:bg-[#f6f8fa] rounded-md transition-colors"
                title="Buka Menu Navigasi Dokumen"
                aria-label="Buka Menu Navigasi"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            <Link to="/" className="flex items-center gap-2.5 text-[#1f2328] hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-md bg-[#1f2328] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs shrink-0">
                SL
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm sm:text-[15px] leading-tight tracking-tight text-[#1f2328]">
                  SI-LANTAS HEWAN
                </span>
                <span className="text-[11px] sm:text-xs text-[#656d76] font-medium leading-none hidden xs:inline">
                  Dinas Peternakan & Keswan
                </span>
              </div>
            </Link>

            <span className="hidden md:inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-[#f6f8fa] text-[#656d76] border border-[#d0d7de]">
              Kab. Mimika
            </span>
          </div>

          {/* Search Trigger (Responsive: Full Bar on desktop/tablet, compact button on mobile) */}
          <div className="flex-1 max-w-md min-w-0 hidden sm:block">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full text-left pl-9 pr-3 h-9 text-xs sm:text-sm bg-[#f6f8fa] text-[#656d76] rounded-md border border-[#d0d7de] hover:border-[#0969da] hover:bg-white flex items-center justify-between transition-colors relative"
            >
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#656d76]">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="truncate min-w-0 pr-2">Cari persyaratan, SKKH, atau alur layanan...</span>
              <kbd className="hidden md:inline-flex shrink-0 items-center justify-center px-1.5 py-0.5 text-[11px] font-semibold text-[#656d76] bg-white border border-[#d0d7de] rounded shadow-2xs">
                /
              </kbd>
            </button>
          </div>

          {/* Mobile Search Icon Button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#656d76] hover:text-[#1f2328] hover:bg-[#f6f8fa] rounded-md border border-[#d0d7de] transition-colors"
              title="Cari Informasi"
              aria-label="Cari Informasi"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* WhatsApp Admin button: ONLY visible when NOT logged in (public users only) */}
            {!user && (
              <button
                type="button"
                onClick={openWhatsApp}
                title="Hubungi Admin SI-LANTAS via WhatsApp Business"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-[#1a7f37] bg-[#dafbe1]/70 hover:bg-[#dafbe1] border border-[#4ac26b]/50 rounded-md transition-colors"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.8 14.07c-.24.68-1.4 1.25-1.95 1.33-.51.07-1.17.1-3.38-.82-2.82-1.17-4.63-4.04-4.77-4.23-.14-.19-1.14-1.52-1.14-2.9 0-1.38.72-2.06.98-2.34.25-.28.56-.35.75-.35.19 0 .38 0 .54.01.18.01.41-.07.65.49.24.58.83 2.01.9 2.16.07.15.12.33.02.53-.1.19-.15.31-.3.49-.15.17-.31.39-.45.52-.15.14-.3.3-.13.6.17.29.77 1.27 1.66 2.06 1.14 1.02 2.1 1.33 2.4 1.48.29.14.47.12.65-.08.17-.2.74-.86.94-1.15.19-.3.39-.25.66-.15.26.1 1.69.8 1.98.94.29.15.49.22.56.35.07.12.07.72-.17 1.4z" />
                </svg>
                <span className="hidden xs:inline">WhatsApp Admin</span>
                <span className="xs:hidden">WA</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/dashboard"
                  className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#1f2328] bg-[#f6f8fa] hover:bg-[#eaeef2] border border-[#d0d7de] rounded-md transition-colors flex items-center gap-1.5"
                  title="Masuk ke Manajemen Internal Petugas"
                >
                  <span className="w-2 h-2 rounded-full bg-[#1a7f37]"></span>
                  <span>Portal Petugas</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs sm:text-sm font-medium text-[#d1242f] hover:underline px-2 py-1"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-[#1f2328] hover:bg-[#2f363d] rounded-md transition-colors shadow-2xs whitespace-nowrap"
              >
                Masuk Petugas
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Interactive Command Search Palette */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
