'use client';

import { useState, useMemo } from 'react';
import type { Business } from '@/types';
import FilterBar from './FilterBar';
import BusinessCard from './BusinessCard';

type Props = { businesses: Business[] };

export default function DirectoryClient({ businesses }: Props) {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    metAt: '',
  });

  const categories = useMemo(
    () =>
      [...new Set(businesses.map((b) => b.category).filter(Boolean) as string[])].sort(),
    [businesses]
  );

  const metAtOptions = useMemo(
    () =>
      [...new Set(businesses.map((b) => b.met_at).filter(Boolean) as string[])].sort(),
    [businesses]
  );

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return businesses.filter((b) => {
      const matchesSearch =
        !q ||
        b.name?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        b.met_at?.toLowerCase().includes(q);
      const matchesCategory =
        !filters.category || b.category === filters.category;
      const matchesMetAt = !filters.metAt || b.met_at === filters.metAt;
      return matchesSearch && matchesCategory && matchesMetAt;
    });
  }, [businesses, filters]);

  return (
    <div>
      <FilterBar
        filters={filters}
        categories={categories}
        metAtOptions={metAtOptions}
        onChange={setFilters}
      />
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">
          {businesses.length === 0
            ? 'No businesses yet — add your first one.'
            : 'No businesses match your filters.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      )}
    </div>
  );
}
