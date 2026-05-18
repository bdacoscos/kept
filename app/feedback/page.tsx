import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Feedback } from '@/types';

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const entries = (data as Feedback[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Feedback Log</h1>
        <span className="text-sm text-gray-400">{entries.length} notes</span>
      </div>
      {entries.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">
          No scan issues reported yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-xl border border-gray-100 p-4"
            >
              <p className="text-sm text-gray-800">{entry.note}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-400">
                  {new Date(entry.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {entry.business_id && (
                  <Link
                    href={`/businesses/${entry.business_id}`}
                    className="text-xs text-gray-400 hover:text-gray-700 underline"
                  >
                    View business
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
