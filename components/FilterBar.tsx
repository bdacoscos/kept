'use client';

type Filters = {
  search: string;
  category: string;
  metAt: string;
};

type Props = {
  filters: Filters;
  categories: string[];
  metAtOptions: string[];
  onChange: (filters: Filters) => void;
};

export default function FilterBar({
  filters,
  categories,
  metAtOptions,
  onChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input
        type="text"
        placeholder="Search businesses..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        aria-label="Search businesses"
        className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
        aria-label="Filter by category"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={filters.metAt}
        onChange={(e) => onChange({ ...filters, metAt: e.target.value })}
        aria-label="Filter by event"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
      >
        <option value="">All events</option>
        {metAtOptions.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
