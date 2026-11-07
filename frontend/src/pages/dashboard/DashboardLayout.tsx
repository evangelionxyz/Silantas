import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Breadcrumbs, type CrumbItem } from '../../components/layout/Breadcrumbs';
import { InternalHeader } from '../../components/layout/InternalHeader';
import { InternalSidebar } from '../../components/layout/InternalSidebar';
import { SUANGGI_BRAND } from '../../constants/brand';
import { useAuth } from '../../context/AuthContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface DashboardLayoutProps {
  breadcrumbs?: CrumbItem[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ breadcrumbs = [] }) => {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Lock background scroll when mobile sidebar drawer is open
  useBodyScrollLock(mobileSidebarOpen);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-sm text-[#57606a]">
        <div className="w-8 h-8 border-3 border-[#15803d] border-t-transparent animate-spin"></div>
        <span>Memuat sesi petugas {SUANGGI_BRAND.name}...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const defaultCrumbs: CrumbItem[] = [
    { label: `Portal Internal ${SUANGGI_BRAND.name}`, href: '/dashboard' },
    ...breadcrumbs,
  ];

  return (
    <div className="min-h-screen bg-[#eef0e9] flex flex-col">
      {/* Dedicated Internal Header */}
      <InternalHeader onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />

      {/* Internal Breadcrumbs */}
      <Breadcrumbs items={defaultCrumbs} />

      {/* Mobile Sidebar Drawer Modal with fast framer animation (< 250ms) */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs lg:hidden flex"
            onClick={() => setMobileSidebarOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Menu Internal Petugas SUANGGI"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#d0d7de] flex items-center justify-between bg-[#f6f8fa]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#15803d] text-white flex items-center justify-center font-extrabold text-xs">
                    {SUANGGI_BRAND.initials}
                  </div>
                  <span className="font-bold text-sm text-[#1f2328]">Menu Internal {SUANGGI_BRAND.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 text-[#57606a] hover:text-[#1f2328] text-lg leading-none"
                  aria-label="Tutup menu"
                >
                  &times;
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4">
                <InternalSidebar sticky={false} onNavigate={() => setMobileSidebarOpen(false)} className="w-full border-r-0 py-4 pr-0" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dashboard Workspace */}
      <div className="w-full mx-auto px-3 sm:px-6 lg:px-8 flex-1 flex items-start">
        {/* Desktop Sidebar (Sticky, follows content) */}
        <InternalSidebar className="hidden lg:flex" />

        {/* Dynamic Main Management View */}
        <main className="flex-1 py-6 px-0 lg:px-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
