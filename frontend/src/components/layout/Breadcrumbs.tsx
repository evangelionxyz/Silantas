import React from 'react';
import { Link } from 'react-router-dom';

export interface CrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: CrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center text-xs sm:text-sm text-[#57606a] py-3 px-3 sm:px-6 lg:px-8 border-b border-[#d0d7de] bg-white select-none">
      <div className="w-full mx-auto flex items-center space-x-1.5 overflow-x-auto">
        <Link to="/" className="hover:text-[#174b2b] hover:underline flex items-center gap-1.5 font-semibold shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Beranda</span>
        </Link>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <span className="text-[#8c959f] shrink-0">/</span>
              {isLast || !item.href ? (
                <span className="font-semibold text-[#1f2328] truncate max-w-xs sm:max-w-md">
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="hover:text-[#174b2b] hover:underline truncate shrink-0">
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
