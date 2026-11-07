import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

interface DocsSidebarProps {
  className?: string;
  onNavigate?: () => void;
  sticky?: boolean;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  className = '',
  onNavigate,
  sticky = true,
}) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    about: true,
    services: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 py-2 px-3 text-sm transition-colors ${
      isActive
        ? 'border-l-4 border-[#1a7f37] font-semibold text-[#1f2328] bg-[#f6f8fa] -ml-[2px]'
        : 'text-[#57606a] hover:text-[#1f2328] hover:bg-[#f6f8fa]/70'
    }`;

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside
      className={`w-72 shrink-0 border-r border-[#d0d7de] bg-white py-6 pr-4 select-none ${
        sticky ? 'sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto' : ''
      } ${className}`}
    >
      <div className="space-y-6">
        {/* Section: Tentang SI-LANTAS */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('about')}
            className="w-full flex items-center justify-between text-left font-bold text-xs text-[#1f2328] tracking-wider uppercase px-3 py-1.5 hover:text-[#0969da] cursor-pointer"
          >
            <span>Tentang SI-LANTAS</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${openSections.about ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.about && (
            <div className="mt-1 space-y-1 border-l border-[#d0d7de]/50 ml-3 pl-1.5">
              <NavLink to="/" end className={navItemClass} onClick={handleLinkClick}>
                <span>Profil & Wilayah Kerja</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Section: Layanan Publik */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('services')}
            className="w-full flex items-center justify-between text-left font-bold text-xs text-[#1f2328] tracking-wider uppercase px-3 py-1.5 hover:text-[#0969da] cursor-pointer"
          >
            <span>Panduan & Layanan Publik</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${openSections.services ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.services && (
            <div className="mt-1 space-y-1 border-l border-[#d0d7de]/50 ml-3 pl-1.5">
              <NavLink to="/persyaratan" className={navItemClass} onClick={handleLinkClick}>
                <span>1. Persyaratan Lalu Lintas</span>
              </NavLink>
              <NavLink to="/pemeriksaan" className={navItemClass} onClick={handleLinkClick}>
                <span>2. Pemeriksaan Kesehatan & SKKH</span>
              </NavLink>
              <NavLink to="/isikhnas" className={navItemClass} onClick={handleLinkClick}>
                <span>3. Status Integrasi iSIKHNAS</span>
              </NavLink>
              <NavLink to="/konsultasi" className={navItemClass} onClick={handleLinkClick}>
                <span>4. Konsultasi WhatsApp Business</span>
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
