import React, { useEffect, useState } from 'react';

export interface TocItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ items }) => {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -60% 0%' }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      // Offset for sticky header (h-16 = 64px + 16px buffer = 80px)
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveId(id);
    }
  };

  if (!items.length) return null;

  return (
    <div className="w-64 shrink-0 hidden xl:block pl-6 py-8 select-none sticky top-16 self-start max-h-[calc(100vh-4rem)] overflow-y-auto">
      <h4 className="text-xs font-bold tracking-wider uppercase text-[#57606a] mb-3">
        Pada Halaman Ini
      </h4>
      <nav className="space-y-1.5 text-xs sm:text-sm border-l-2 border-[#d0d7de] pl-3">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className={`block w-full text-left py-1 text-xs sm:text-sm leading-snug transition-colors truncate cursor-pointer ${
                isActive
                  ? 'text-[#0969da] font-semibold -ml-[14px] pl-3 border-l-2 border-[#0969da]'
                  : 'text-[#57606a] hover:text-[#1f2328]'
              }`}
            >
              {item.title}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
