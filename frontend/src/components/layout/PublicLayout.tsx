import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { DocsHeader } from './DocsHeader';
import { DocsSidebar } from './DocsSidebar';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock background scroll when public navigation drawer is active on mobile
  useBodyScrollLock(mobileMenuOpen);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1f2328]">
      <DocsHeader onToggleMobileMenu={() => setMobileMenuOpen(true)} />

      {/* Mobile Drawer Modal for Public Documentation */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs lg:hidden flex"
          onClick={() => setMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#1f2328] text-white flex items-center justify-center font-bold text-xs">
                  SL
                </div>
                <span className="font-bold text-sm text-[#1f2328]">Panduan Layanan</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-[#57606a] hover:text-[#1f2328] rounded-md text-lg leading-none cursor-pointer"
                aria-label="Tutup menu"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <DocsSidebar sticky={false} onNavigate={() => setMobileMenuOpen(false)} className="w-full border-r-0 py-4 pr-0" />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
};
