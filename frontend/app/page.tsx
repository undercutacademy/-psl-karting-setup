import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden p-8">
            {/* Racing stripes background */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-1/4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
                <div className="absolute top-0 left-1/4 ml-4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
                <div className="absolute top-0 right-1/4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
                <div className="absolute top-0 right-1/4 mr-4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
            </div>

            <div className="relative z-10 w-full max-w-md text-center">
                <div className="mb-8">
                    <Image
                        src="/undercut-academy-logo.png"
                        alt="Undercut Academy"
                        width={350}
                        height={140}
                        className="drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] mb-4 mx-auto"
                        priority
                    />
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider mb-2">
                        Select Team
                    </h1>
                    <p className="text-gray-400">
                        Choose a team to access their workspace
                    </p>
                </div>

                <div className="grid gap-4">
                    <Link
                        href="/psl-karting"
                        className="group flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/80 hover:border-red-500/50 transition-all"
                    >
                        <span className="font-semibold text-white group-hover:text-red-400 transition-colors">
                            PSL Karting
                        </span>
                        <span className="text-gray-500 group-hover:translate-x-1 transition-transform">
                            →
                        </span>
                    </Link>

                    <Link
                        href="/tkg-birelart"
                        className="group flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-800/80 hover:border-red-500/50 transition-all"
                    >
                        <span className="font-semibold text-white group-hover:text-red-400 transition-colors">
                            TKG BirelArt
                        </span>
                        <span className="text-gray-500 group-hover:translate-x-1 transition-transform">
                            →
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
