import Link from 'next/link';
import Image from 'next/image';
import { getTeamInfo } from '@/lib/api';

export default async function Home({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  const teamInfo = await getTeamInfo(teamSlug);

  // Defaults (fallback to PSL style if fetch fails or no config)
  const logoUrl = teamInfo?.logoUrl || '/psl-logo.png';
  const primaryColor = teamInfo?.primaryColor || '#dc2626'; // Default red
  const teamName = teamInfo?.name || 'PSL Karting';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden p-8">
      {/* Racing stripes background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-1 h-full bg-[var(--primary-color)] transform -skew-x-12" style={{ backgroundColor: primaryColor }} />
        <div className="absolute top-0 left-1/4 ml-4 w-1 h-full bg-[var(--primary-color)] transform -skew-x-12" style={{ backgroundColor: primaryColor }} />
        <div className="absolute top-0 right-1/4 w-1 h-full bg-[var(--primary-color)] transform -skew-x-12" style={{ backgroundColor: primaryColor }} />
        <div className="absolute top-0 right-1/4 mr-4 w-1 h-full bg-[var(--primary-color)] transform -skew-x-12" style={{ backgroundColor: primaryColor }} />
      </div>

      {/* Home Button */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900/80 px-4 py-2 text-sm font-bold text-gray-500 uppercase tracking-wider backdrop-blur-md transition-all hover:border-white/30 hover:text-white hover:bg-gray-800 group"
      >
        <span className="text-lg group-hover:scale-110 transition-transform">🏠</span>
        <span className="hidden md:inline text-xs">Switch Team</span>
      </Link>

      {/* Top racing stripe */}
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background: `linear-gradient(to right, ${primaryColor}, white, ${primaryColor})` }}></div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4">
            <Image
              src={logoUrl}
              alt={teamName}
              width={350}
              height={140}
              className="drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider uppercase">
            Setup <span style={{ color: primaryColor }}>Manager</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Manage your {teamName} race setups efficiently
          </p>
        </div>

        {/* Cards Container */}
        <div className="rounded-2xl bg-gray-900/80 border border-gray-800 p-8 shadow-2xl backdrop-blur-xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Link
              href={`/${teamSlug}/form`}
              className="group flex flex-col items-center justify-center rounded-xl border-2 bg-gradient-to-br p-8 transition-all hover:shadow-lg hover:scale-105"
              style={{
                borderColor: `${primaryColor}4D`, // 30% opacity
                backgroundColor: `${primaryColor}1A`, // 10% opacity
                '--hover-color': primaryColor,
              } as React.CSSProperties}
            >
              <div className="mb-4 text-5xl group-hover:animate-bounce">🏎️</div>
              <h2 className="mb-2 text-xl font-bold text-white uppercase tracking-wider">
                Submit Setup
              </h2>
              <p className="text-center text-sm text-gray-400">
                Fill out your karting setup form
              </p>
              <div
                className="mt-4 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider"
                style={{ backgroundColor: `${primaryColor}33`, color: primaryColor }}
              >
                Driver →
              </div>
            </Link>

            <Link
              href={`/${teamSlug}/manager/dashboard`}
              className="group flex flex-col items-center justify-center rounded-xl border-2 border-gray-600/30 bg-gradient-to-br from-gray-500/10 to-gray-600/5 p-8 transition-all hover:border-gray-500 hover:shadow-lg hover:shadow-white/10 hover:scale-105"
            >
              <div className="mb-4 text-5xl group-hover:animate-bounce">📊</div>
              <h2 className="mb-2 text-xl font-bold text-white uppercase tracking-wider">
                Manager Dashboard
              </h2>
              <p className="text-center text-sm text-gray-400">
                View and manage all submissions
              </p>
              <div className="mt-4 px-4 py-2 rounded-full bg-white/10 text-gray-300 text-sm font-semibold uppercase tracking-wider">
                Manager →
              </div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-xs">
          <p>Powered by <a href="https://overcutacademy.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Overcut Academy</a></p>
        </div>
      </div>
    </div>
  );
}
