'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine the expected login path for this team
  const loginPath = `/${teamSlug}/manager/login`;

  useEffect(() => {
    const managerEmail = localStorage.getItem('managerEmail');
    const managerUser = localStorage.getItem('managerUser');

    if (!managerEmail || !managerUser) {
      if (pathname !== loginPath) {
        router.push(loginPath);
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    } else {
      setIsAuthenticated(true);
      setLoading(false);
    }
  }, [router, pathname, loginPath]);

  const handleLogout = () => {
    localStorage.removeItem('managerEmail');
    localStorage.removeItem('managerUser');
    router.push(loginPath);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
          <p className="text-lg text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If we are on the login page, just render children without the nav bar
  if (pathname === loginPath) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Top bar with logout */}
      <nav className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${teamSlug}`}>
                <Image
                  src="/psl-logo.png"
                  alt="PSL Karting"
                  width={120}
                  height={48}
                  className="drop-shadow-[0_0_10px_rgba(227,24,55,0.3)]"
                />
              </Link>
              <div className="hidden md:block">
                <span className="text-lg font-bold text-white uppercase tracking-wider">
                  Manager <span className="text-red-500">Portal</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/${teamSlug}/manager/dashboard`}
                className="text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-gray-800 transition-colors"
              >
                📊 Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                Logout →
              </button>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
