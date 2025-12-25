import Link from 'next/link';
import Image from 'next/image';

export default function SuccessPage() {
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
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-600 via-green-500 to-green-600"></div>

      <div className="relative z-10 max-w-md w-full">
        {/* Success Card */}
        <div className="rounded-2xl bg-gray-900/80 border border-gray-800 p-10 shadow-2xl backdrop-blur-xl text-center">
          {/* Animated checkered flag */}
          <div className="mb-6 relative">
            <div className="text-8xl animate-bounce">🏁</div>
            <div className="absolute -inset-4 bg-green-500/20 blur-3xl rounded-full -z-10"></div>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-white uppercase tracking-wider">
            Setup <span className="text-green-500">Submitted!</span>
          </h1>

          <p className="mb-8 text-gray-400">
            Your karting setup has been recorded successfully. The team manager has been notified.
          </p>

          {/* Success indicator */}
          <div className="mb-8 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-center justify-center gap-2 text-green-400">
              <span className="text-xl">✓</span>
              <span className="font-semibold">Data saved to database</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/form"
              className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/30 text-center"
            >
              🏎️ Submit Another
            </Link>
            <Link
              href="/"
              className="flex-1 rounded-lg bg-gray-700 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:bg-gray-600 text-center"
            >
              ← Home
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
