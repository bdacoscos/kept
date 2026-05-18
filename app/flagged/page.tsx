import { createClient } from '@/lib/supabase/server';
import BusinessCard from '@/components/BusinessCard';
import type { Business } from '@/types';

export default async function FlaggedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('needs_review', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const businesses = (data as Business[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Flagged</h1>
        <span className="text-sm text-gray-400">{businesses.length} flagged</span>
      </div>
      {businesses.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">
          Nothing flagged — you&apos;re all caught up.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {businesses.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      )}
    </div>
  );
}
