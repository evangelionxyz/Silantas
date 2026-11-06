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
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveId(id);
    }
  };

  if (!items.length) return null;

  return (
    <div className="w-56 shrink-0 hidden xl:block pl-6 py-6 select-none sticky top-20">
      <h4 className="text-[11px] font-bold tracking-wider uppercase text-[#656d76] mb-3">
        Pada Halaman Ini
      </h4>
      <nav className="space-y-1 text-xs border-l border-[#d0d7de] pl-2.5">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className={`block w-full text-left py-1 text-xs leading-snug transition-colors truncate ${
                isActive
                  ? 'text-[#0969da] font-semibold -ml-[11px] pl-2.5 border-l-2 border-[#0969da]'
                  : 'text-[#656d76] hover:text-[#1f2328]'
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
