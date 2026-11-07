import React from 'react';
import { Link } from 'react-router-dom';
import { SUANGGI_BRAND } from '../../constants/brand';
import { useAuth } from '../../context/AuthContext';

interface InternalHeaderProps {
  onToggleMobileSidebar: () => void;
}

export const InternalHeader: React.FC<InternalHeaderProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-[#ffebe9] text-[#cf222e] border-[#ff8182]/50';
      case 'dokter_hewan':
        return 'bg-[#dafbe1] text-[#1a7f37] border-[#4ac26b]/50';
      case 'pimpinan':
        return 'bg-[#ddf4ff] text-[#0969da] border-[#54aeff]/50';
      default:
        return 'bg-[#fff8c5] text-[#9a6700] border-[#d4a72c]/50';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#c6cbc0] select-none shadow-sm">
      <div className="mx-auto px-3 sm:px-6 lg:px-8 min-h-[4rem] h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile hamburger & Internal Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-[#57606a] hover:text-[#1f2328] hover:bg-[#f6f8fa] transition-colors border border-[#d0d7de]"
            title="Buka Menu Manajemen SUANGGI"
            aria-label="Buka Menu Manajemen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#174b2b] text-white flex items-center justify-center font-extrabold text-sm tracking-tight shrink-0">
              {SUANGGI_BRAND.initials}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-[#173d22]">
                  {SUANGGI_BRAND.name}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold bg-[#dafbe1] text-[#1a7f37] border border-[#4ac26b]/40 uppercase tracking-wide">
                  Internal Petugas
                </span>
                <span className="hidden xl:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de]">
                  {SUANGGI_BRAND.motto}
                </span>
              </div>
              <span className="text-xs text-[#57606a] font-medium leading-none hidden xs:inline">
                {SUANGGI_BRAND.fullName} &bull; {SUANGGI_BRAND.agencyShort}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Action Controls: Return to Public Portal + Staff Profile + Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#174b2b] hover:bg-[#eef1e8] border border-[#9eaa98] transition-colors"
            title="Kunjungi Halaman Panduan Layanan Publik SUANGGI"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Lihat Portal Publik</span>
          </Link>

          {user && (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-[#d0d7de]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#1f2328] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {user.fullName.charAt(0)}
                </div>
                <div className="hidden md:flex flex-col min-w-0">
                  <span className="font-semibold text-xs sm:text-sm text-[#1f2328] truncate max-w-[140px]">
                    {user.fullName}
                  </span>
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 border w-fit ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="px-2.5 py-1.5 text-xs sm:text-sm font-medium text-[#cf222e] hover:bg-[#ffebe9] border border-[#ff8182]/40 transition-colors"
                title="Keluar dari sesi petugas"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
