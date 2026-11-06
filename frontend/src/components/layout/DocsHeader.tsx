import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchWhatsappConfig, type WhatsappConfig } from '../../services/api';
import { SearchModal } from './SearchModal';

export const DocsHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [waConfig, setWaConfig] = useState<WhatsappConfig | null>(null);

  useEffect(() => {
    fetchWhatsappConfig().then(setWaConfig).catch(() => {});
  }, []);

  // Keyboard shortcut '/' to trigger search modal
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
      <header className="sticky top-0 z-40 bg-white border-b border-[#d0d7de] select-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Scope */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 text-[#1f2328] hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-md bg-[#1f2328] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
                SL
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[15px] leading-tight tracking-tight text-[#1f2328]">
                  SI-LANTAS HEWAN
                </span>
                <span className="text-[11px] text-[#656d76] font-medium leading-none">
                  Dinas Peternakan & Keswan
                </span>
              </div>
            </Link>

            <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#f6f8fa] text-[#656d76] border border-[#d0d7de]">
              Kab. Mimika
            </span>
          </div>

          {/* Search Trigger Button */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full text-left pl-9 pr-3 py-1.5 text-xs bg-[#f6f8fa] text-[#656d76] rounded-md border border-[#d0d7de] hover:border-[#0969da] flex items-center justify-between transition-colors relative"
            >
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#656d76]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span>Cari persyaratan, SKKH, atau alur layanan...</span>
              <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold text-[#656d76] bg-white border border-[#d0d7de] rounded shadow-2xs">
                /
              </kbd>
            </button>
          </div>

          {/* Right action controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openWhatsApp}
              title="Hubungi Admin SI-LANTAS via WhatsApp Business"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1a7f37] bg-[#dafbe1]/60 hover:bg-[#dafbe1] border border-[#4ac26b]/40 rounded-md transition-colors"
            >
              <span>WhatsApp Admin</span>
            </button>

            <Link
              to="/persyaratan"
              className="text-xs font-medium text-[#656d76] hover:text-[#1f2328] transition-colors px-2 py-1"
            >
              Layanan Publik
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="px-3 py-1.5 text-xs font-semibold text-[#1f2328] bg-[#f6f8fa] hover:bg-[#eaeef2] border border-[#d0d7de] rounded-md transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-medium text-[#d1242f] hover:underline px-2 py-1"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#1f2328] hover:bg-[#2f363d] rounded-md transition-colors shadow-2xs"
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
