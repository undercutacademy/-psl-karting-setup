import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden p-8">
      {/* Racing stripes background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
        <div className="absolute top-0 left-1/4 ml-4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
        <div className="absolute top-0 right-1/4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
        <div className="absolute top-0 right-1/4 mr-4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
      </div>

      {/* Top racing stripe */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-red-500 to-red-600"></div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/psl-logo.png"
            alt="PSL Karting"
            width={350}
            height={140}
            className="drop-shadow-[0_0_40px_rgba(227,24,55,0.5)] mb-4"
            priority
          />
          <h1 className="text-2xl font-bold text-white tracking-wider uppercase">
            Setup <span className="text-red-500">Manager</span>
          </h1>
          <p className="mt-2 text-gray-400">
            Manage your karting race setups efficiently
          </p>
        </div>

        {/* Cards Container */}
        <div className="rounded-2xl bg-gray-900/80 border border-gray-800 p-8 shadow-2xl backdrop-blur-xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Link
              href="/form"
              className="group flex flex-col items-center justify-center rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-600/5 p-8 transition-all hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 hover:scale-105"
            >
              <div className="mb-4 text-5xl group-hover:animate-bounce">🏎️</div>
              <h2 className="mb-2 text-xl font-bold text-white uppercase tracking-wider">
                Submit Setup
              </h2>
              <p className="text-center text-sm text-gray-400">
                Fill out your karting setup form
              </p>
              <div className="mt-4 px-4 py-2 rounded-full bg-red-500/20 text-red-400 text-sm font-semibold uppercase tracking-wider">
                Driver →
              </div>
            </Link>

            <Link
              href="/manager/dashboard"
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
          <p>Powered by <a href="https://undercutacademy.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Undercut Academy</a></p>
        </div>
      </div>
    </div>
  );
}
