import { createClient } from '@/lib/supabase/server';
import DirectoryClient from '@/components/DirectoryClient';
import type { Business } from '@/types';

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Directory</h1>
        <span className="text-sm text-gray-400">{data?.length ?? 0} businesses</span>
      </div>
      <DirectoryClient businesses={(data as Business[]) ?? []} />
    </div>
  );
}
