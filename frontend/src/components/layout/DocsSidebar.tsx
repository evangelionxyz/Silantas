import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface DocsSidebarProps {
  className?: string;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    about: true,
    services: true,
    internal: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 py-1.5 px-3 text-xs transition-colors rounded-sm ${
      isActive
        ? 'border-l-2 border-[#1a7f37] font-semibold text-[#1f2328] bg-[#f6f8fa] -ml-[2px]'
        : 'text-[#656d76] hover:text-[#1f2328] hover:bg-[#f6f8fa]/60'
    }`;

  return (
    <aside className={`w-64 shrink-0 border-r border-[#d0d7de] bg-white py-6 pr-4 select-none ${className}`}>
      <div className="space-y-6 text-xs">
        {/* Section: Tentang SI-LANTAS */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('about')}
            className="w-full flex items-center justify-between text-left font-bold text-[#1f2328] tracking-tight uppercase px-3 py-1 hover:text-[#0969da]"
          >
            <span>Tentang SI-LANTAS</span>
            <svg
              className={`w-3.5 h-3.5 transform transition-transform ${openSections.about ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.about && (
            <div className="mt-1 space-y-0.5 border-l border-[#d0d7de]/50 ml-3 pl-1">
              <NavLink to="/" end className={navItemClass}>
                Profil & Wilayah Kerja
              </NavLink>
            </div>
          )}
        </div>

        {/* Section: Layanan Publik */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('services')}
            className="w-full flex items-center justify-between text-left font-bold text-[#1f2328] tracking-tight uppercase px-3 py-1 hover:text-[#0969da]"
          >
            <span>Layanan Publik</span>
            <svg
              className={`w-3.5 h-3.5 transform transition-transform ${openSections.services ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.services && (
            <div className="mt-1 space-y-0.5 border-l border-[#d0d7de]/50 ml-3 pl-1">
              <NavLink to="/persyaratan" className={navItemClass}>
                1. Persyaratan Lalu Lintas
              </NavLink>
              <NavLink to="/pemeriksaan" className={navItemClass}>
                2. Pemeriksaan Kesehatan & SKKH
              </NavLink>
              <NavLink to="/isikhnas" className={navItemClass}>
                3. Status Integrasi iSIKHNAS
              </NavLink>
              <NavLink to="/konsultasi" className={navItemClass}>
                4. Konsultasi WhatsApp Business
              </NavLink>
            </div>
          )}
        </div>

        {/* Section: Internal Management */}
        {user && (
          <div>
            <button
              type="button"
              onClick={() => toggleSection('internal')}
              className="w-full flex items-center justify-between text-left font-bold text-[#1f2328] tracking-tight uppercase px-3 py-1 hover:text-[#0969da]"
            >
              <span>Internal Petugas</span>
              <svg
                className={`w-3.5 h-3.5 transform transition-transform ${openSections.internal ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSections.internal && (
              <div className="mt-1 space-y-0.5 border-l border-[#d0d7de]/50 ml-3 pl-1">
                <NavLink to="/dashboard" end className={navItemClass}>
                  Data Lalu Lintas Hewan
                </NavLink>
                <NavLink to="/dashboard/kalkulasi" className={navItemClass}>
                  Kalkulasi & Rekapitulasi
                </NavLink>
                {(user.role === 'admin' || user.role === 'pimpinan') && (
                  <NavLink to="/dashboard/audit" className={navItemClass}>
                    Log Audit Perubahan
                  </NavLink>
                )}
                {user.role === 'admin' && (
                  <>
                    <NavLink to="/dashboard/users" className={navItemClass}>
                      Manajemen Pengguna
                    </NavLink>
                    <NavLink to="/dashboard/settings" className={navItemClass}>
                      Pengaturan WhatsApp
                    </NavLink>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Badge / Active Role Indicator */}
      {user && (
        <div className="mt-8 pt-4 border-t border-[#d0d7de] px-3">
          <div className="p-2.5 rounded-md bg-[#f6f8fa] border border-[#d0d7de]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1f2328] text-white flex items-center justify-center font-bold text-[10px]">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs text-[#1f2328] truncate">{user.fullName}</span>
                <span className="text-[10px] text-[#656d76] uppercase tracking-wider font-medium">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
