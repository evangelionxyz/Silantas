import React from 'react';
import { Outlet } from 'react-router-dom';
import { DocsHeader } from './DocsHeader';

export const PublicLayout: React.FC = () => (
  <div className="min-h-screen bg-[#f7f6f1] text-[#1f2920]">
    <DocsHeader />
    <div className="min-h-[calc(100vh-7.25rem)]">
      <Outlet />
    </div>
  </div>
);
