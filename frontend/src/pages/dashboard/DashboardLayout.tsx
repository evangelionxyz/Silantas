import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Breadcrumbs, type CrumbItem } from '../../components/layout/Breadcrumbs';
import { DocsSidebar } from '../../components/layout/DocsSidebar';
import { useAuth } from '../../context/AuthContext';

interface DashboardLayoutProps {
  breadcrumbs?: CrumbItem[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ breadcrumbs = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-xs text-[#656d76]">
        Memuat sesi pengguna...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const defaultCrumbs: CrumbItem[] = [
    { label: 'Internal Petugas', href: '/dashboard' },
    ...breadcrumbs,
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Breadcrumbs items={defaultCrumbs} />

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex">
        <DocsSidebar className="hidden lg:block" />

        <main className="flex-1 py-6 px-0 lg:px-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
