import React from 'react';
import { NavLink } from 'react-router-dom';
import { SUANGGI_BRAND } from '../../constants/brand';
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
    `flex items-start gap-2.5 py-2.5 px-3 text-sm transition-colors ${
      isActive
        ? 'border-l-4 border-[#174b2b] font-semibold text-[#1f2920] bg-[#eef1e8] -ml-[2px]'
        : 'text-[#4b574d] hover:text-[#1f2920] hover:bg-[#eef1e8]/70'
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
        {/* Section: Operasional SUANGGI */}
        <div>
          <div className="font-bold text-xs text-[#57606a] uppercase tracking-wider px-3.5 mb-2">
            Operasional {SUANGGI_BRAND.name}
          </div>
          <div className="space-y-1">
            <NavLink to="/dashboard" end className={navItemClass} onClick={handleLinkClick}>
              <svg className="w-4 h-4 shrink-0 text-[#15803d] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex flex-col">
                <span>Pemasukan, Pengeluaran &amp; Pemuktahiran</span>
                <span className="text-[11px] font-normal text-[#57606a]">
                  Data Hewan &amp; Produk Hewan Terkini
                </span>
              </div>
            </NavLink>

            <NavLink to="/dashboard/kalkulasi" className={navItemClass} onClick={handleLinkClick}>
              <svg className="w-4 h-4 shrink-0 text-[#0969da] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="flex flex-col">
                <span>Monitoring &amp; Kalkulasi</span>
                <span className="text-[11px] font-normal text-[#57606a]">
                  Statistik &amp; Laporan Lalu Lintas
                </span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Section: Pengawasan & Audit */}
        {(user?.role === 'admin' || user?.role === 'pimpinan') && (
          <div>
            <div className="font-bold text-xs text-[#57606a] uppercase tracking-wider px-3.5 mb-2">
              Pengawasan &amp; Kepatuhan
            </div>
            <div className="space-y-1">
              <NavLink to="/dashboard/audit" className={navItemClass} onClick={handleLinkClick}>
                <svg className="w-4 h-4 shrink-0 text-[#8250df] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Log Audit Pemuktahiran</span>
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
                <svg className="w-4 h-4 shrink-0 text-[#bf8700] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Manajemen Pengguna</span>
              </NavLink>

              <NavLink to="/dashboard/settings" className={navItemClass} onClick={handleLinkClick}>
                <svg className="w-4 h-4 shrink-0 text-[#15803d] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Pengaturan WhatsApp</span>
              </NavLink>

              <NavLink to="/dashboard/backup" className={navItemClass} onClick={handleLinkClick}>
                <svg className="w-4 h-4 shrink-0 text-[#0969da] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span>Cadangan &amp; Basis Data</span>
              </NavLink>
            </div>
          </div>
        )}
      </div>

      {/* Compact Functional Brand Reference in Sidebar Footer */}
      <div className="mx-3 mt-6 p-3 bg-[#eef0e9] border border-[#c6cbc0] text-xs text-[#4b574d]">
        <div className="font-bold text-[#1f2920]">{SUANGGI_BRAND.name}</div>
        <div className="text-[11px] font-semibold text-[#174b2b]">{SUANGGI_BRAND.motto}</div>
      </div>
    </aside>
  );
};
