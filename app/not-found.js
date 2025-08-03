'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect from old test-results path to results-review
    if (pathname === '/test-results') {
      router.replace('/results-review');
    }
  }, [pathname, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">404 - Page Not Found</h2>
          <p className="mt-2 text-sm text-gray-600">
            The page you are looking for does not exist.
          </p>
          {pathname === '/test-results' && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Redirecting to Results/Review page...</p>
            </div>
          )}
        </div>
        <div className="mt-8">
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500">
            Go back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}