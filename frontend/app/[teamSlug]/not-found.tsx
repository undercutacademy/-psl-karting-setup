import Link from 'next/link';
import Image from 'next/image';

export default function TeamNotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden p-8">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-1/4 w-1 h-full bg-red-600 transform -skew-x-12" />
                <div className="absolute top-0 left-1/4 ml-4 w-1 h-full bg-red-600 transform -skew-x-12" />
                <div className="absolute top-0 right-1/4 w-1 h-full bg-red-600 transform -skew-x-12" />
                <div className="absolute top-0 right-1/4 mr-4 w-1 h-full bg-red-600 transform -skew-x-12" />
            </div>

            <div className="relative z-10 w-full max-w-md text-center">
                <div className="mb-8 flex justify-center">
                    <Image
                        src="/overcut-academy-logo.png"
                        alt="Overcut Academy"
                        width={260}
                        height={104}
                        className="drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                        priority
                    />
                </div>

                <div className="rounded-2xl bg-gray-900/80 border border-gray-800 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="mb-4 text-5xl">🏁</div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-wider mb-3">
                        Team Not Found
                    </h1>
                    <p className="text-gray-400 mb-6">
                        This team doesn&apos;t exist or hasn&apos;t been set up yet.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-600 bg-gray-800/60 hover:bg-gray-700 hover:border-white text-gray-200 hover:text-white text-sm font-semibold uppercase tracking-wider transition-all"
                    >
                        <span>←</span>
                        <span>Back to Teams</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
