'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[logout]', e);
    }
    router.push('/login');
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm text-gray-500 hover:text-gray-900"
    >
      Log out
    </button>
  );
}
