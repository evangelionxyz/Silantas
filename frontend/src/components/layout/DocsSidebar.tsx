import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { SUANGGI_BRAND, SUANGGI_CORE_FEATURES } from '../../constants/brand';

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
    `flex items-center gap-2.5 py-2.5 px-3 text-sm rounded-r-lg transition-colors ${
      isActive
        ? 'border-l-4 border-[#15803d] font-bold text-[#14532d] bg-[#f0fdf4] -ml-[2px]'
        : 'text-[#4b5563] hover:text-[#14532d] hover:bg-[#f0fdf4]/60'
    }`;

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside
      className={`w-72 shrink-0 border-r border-[#d1fae5] bg-white py-6 pr-4 select-none ${
        sticky ? 'sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto' : ''
      } ${className}`}
    >
      <div className="space-y-6">
        {/* Section: Tentang SUANGGI */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('about')}
            className="w-full flex items-center justify-between text-left font-extrabold text-xs text-[#14532d] tracking-wider uppercase px-3 py-1.5 hover:text-[#15803d]"
          >
            <span>Tentang {SUANGGI_BRAND.name}</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${openSections.about ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.about && (
            <div className="mt-1 space-y-1 border-l-2 border-[#bbf7d0] ml-3 pl-1.5">
              <NavLink to="/" end className={navItemClass} onClick={handleLinkClick}>
                <span>Beranda & Fitur Utama</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Section: Layanan Publik */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('services')}
            className="w-full flex items-center justify-between text-left font-extrabold text-xs text-[#14532d] tracking-wider uppercase px-3 py-1.5 hover:text-[#15803d]"
          >
            <span>Panduan & Layanan Publik</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${openSections.services ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openSections.services && (
            <div className="mt-1 space-y-1 border-l-2 border-[#bbf7d0] ml-3 pl-1.5">
              <NavLink to="/persyaratan" className={navItemClass} onClick={handleLinkClick}>
                <span className="w-5 h-5 bg-[#dcfce7] text-[#15803d] text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>Persyaratan Lalu Lintas</span>
              </NavLink>
              <NavLink to="/pemeriksaan" className={navItemClass} onClick={handleLinkClick}>
                <span className="w-5 h-5 bg-[#e0f2fe] text-[#0369a1] text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>Pemeriksaan & SKKH</span>
              </NavLink>
              <NavLink to="/isikhnas" className={navItemClass} onClick={handleLinkClick}>
                <span className="w-5 h-5 bg-[#fef3c7] text-[#b45309] text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>Status Integrasi iSIKHNAS</span>
              </NavLink>
              <NavLink to="/konsultasi" className={navItemClass} onClick={handleLinkClick}>
                <span className="w-5 h-5 bg-[#ccfbf1] text-[#0f766e] text-xs font-bold flex items-center justify-center shrink-0">
                  4
                </span>
                <span>Konsultasi WhatsApp</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Section: 4 Pilar Utama SUANGGI */}
        <div className="mx-2 p-3.5 bg-[#f0fdf4] border border-[#bbf7d0]">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#14532d] mb-1">
            4 Fitur Utama {SUANGGI_BRAND.name}
          </div>
          <div className="text-[11px] text-[#166534] font-medium mb-2.5">
            {SUANGGI_BRAND.motto}
          </div>
          <ul className="space-y-2 text-xs">
            {SUANGGI_CORE_FEATURES.map((feat) => (
              <li key={feat.id} className="flex items-start gap-2">
                <span
                  className="w-2 h-2 mt-1.5 shrink-0"
                  style={{ backgroundColor: feat.accentColor }}
                />
                <div>
                  <span className="font-bold text-[#1f2328]">{feat.title}:</span>{' '}
                  <span className="text-[#4b5563]">{feat.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};
