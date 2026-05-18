import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/LogoutButton';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kept',
  description: 'Your personal small business directory',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        {user && (
          <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-lg font-bold text-gray-900">
                Kept
              </Link>
              <Link
                href="/businesses/new"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Add Business
              </Link>
              <Link
                href="/flagged"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Flagged
              </Link>
              <Link
                href="/feedback"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Feedback Log
              </Link>
            </nav>
            <LogoutButton />
          </header>
        )}
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
