import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface InternalSidebarProps {
  className?: string;
  onNavigate?: () => void;
  sticky?: boolean;
}

export const InternalSidebar: React.FC<InternalSidebarProps> = ({
  className = '',
  onNavigate,
  sticky = true,
}) => {
  const { user } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 py-2.5 px-3.5 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'border-l-3 border-[#1a7f37] font-semibold text-[#1f2328] bg-[#f6f8fa] -ml-[2px]'
        : 'text-[#57606a] hover:text-[#1f2328] hover:bg-[#f6f8fa]/80'
    }`;

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside
      className={`w-72 shrink-0 border-r border-[#d0d7de] bg-white py-6 pr-4 select-none flex flex-col justify-between ${
        sticky ? 'sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto' : ''
      } ${className}`}
    >
      <div className="space-y-6">
        {/* Section: Operasional */}
        <div>
          <div className="font-bold text-xs text-[#57606a] uppercase tracking-wider px-3.5 mb-2">
            Operasional Peternakan
          </div>
          <div className="space-y-1">
            <NavLink to="/dashboard" end className={navItemClass} onClick={handleLinkClick}>
              <svg className="w-4 h-4 shrink-0 text-[#1a7f37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Data Lalu Lintas Hewan</span>
            </NavLink>

            <NavLink to="/dashboard/kalkulasi" className={navItemClass} onClick={handleLinkClick}>
              <svg className="w-4 h-4 shrink-0 text-[#0969da]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Kalkulasi & Rekapitulasi</span>
            </NavLink>
          </div>
        </div>

        {/* Section: Pengawasan & Audit */}
        {(user?.role === 'admin' || user?.role === 'pimpinan') && (
          <div>
            <div className="font-bold text-xs text-[#57606a] uppercase tracking-wider px-3.5 mb-2">
              Pengawasan & Kepatuhan
            </div>
            <div className="space-y-1">
              <NavLink to="/dashboard/audit" className={navItemClass} onClick={handleLinkClick}>
                <svg className="w-4 h-4 shrink-0 text-[#8250df]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Log Audit Perubahan</span>
              </NavLink>
            </div>
          </div>
        )}

        {/* Section: Manajemen Admin */}
        {user?.role === 'admin' && (
          <div>
            <div className="font-bold text-xs text-[#57606a] uppercase tracking-wider px-3.5 mb-2">
              Administrasi Sistem
            </div>
            <div className="space-y-1">
              <NavLink to="/dashboard/users" className={navItemClass} onClick={handleLinkClick}>
                <svg className="w-4 h-4 shrink-0 text-[#bf8700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Manajemen Pengguna</span>
              </NavLink>

              <NavLink to="/dashboard/settings" className={navItemClass} onClick={handleLinkClick}>
                <svg className="w-4 h-4 shrink-0 text-[#1a7f37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Pengaturan WhatsApp</span>
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* Footer link to public documents */}
      <div className="pt-6 border-t border-[#d0d7de] px-2 space-y-3">
        <Link
          to="/"
          onClick={handleLinkClick}
          className="flex items-center gap-2 p-2.5 rounded-md bg-[#f6f8fa] hover:bg-[#eaeef2] text-xs font-semibold text-[#0969da] border border-[#d0d7de] transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <div className="flex flex-col">
            <span className="font-semibold text-xs leading-snug">Portal Panduan Publik</span>
            <span className="text-[11px] text-[#57606a] font-normal">SOP & Persyaratan Lintas</span>
          </div>
        </Link>
      </div>
    </aside>
  );
};
