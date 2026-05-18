import Link from 'next/link';
import type { Business } from '@/types';

type Props = { business: Business };

export default function BusinessCard({ business }: Props) {
  return (
    <Link
      href={`/businesses/${business.id}`}
      className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {business.name ?? 'Unnamed business'}
          </h3>
          {business.category && (
            <p className="text-sm text-gray-500 mt-0.5">{business.category}</p>
          )}
          {business.met_at && (
            <p className="text-xs text-gray-400 mt-1">{business.met_at}</p>
          )}
        </div>
        {business.needs_review && (
          <span className="flex-shrink-0 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5">
            Needs review
          </span>
        )}
      </div>
    </Link>
  );
}
