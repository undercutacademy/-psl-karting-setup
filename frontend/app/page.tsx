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
                        className="group relative flex items-center justify-between p-4 rounded-xl border border-gray-700/50 bg-gray-900/80 hover:bg-gray-800 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    >
                        <span className="font-bold text-lg text-gray-200 group-hover:text-white transition-colors">
                            PSL Karting
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                ACCESS
                            </span>
                            <span className="text-gray-500 group-hover:text-red-500 group-hover:translate-x-1 transition-all text-xl">
                                →
                            </span>
                        </div>
                    </Link>

                    <Link
                        href="/tkg-birelart"
                        className="group relative flex items-center justify-between p-4 rounded-xl border border-gray-700/50 bg-gray-900/80 hover:bg-gray-800 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    >
                        <span className="font-bold text-lg text-gray-200 group-hover:text-white transition-colors">
                            TKG BirelArt
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                ACCESS
                            </span>
                            <span className="text-gray-500 group-hover:text-red-500 group-hover:translate-x-1 transition-all text-xl">
                                →
                            </span>
                        </div>
                    </Link>

                    <Link
                        href="/primepowerteam"
                        className="group relative flex items-center justify-between p-4 rounded-xl border border-gray-700/50 bg-gray-900/80 hover:bg-gray-800 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    >
                        <span className="font-bold text-lg text-gray-200 group-hover:text-white transition-colors">
                            Prime Powerteam
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                ACCESS
                            </span>
                            <span className="text-gray-500 group-hover:text-red-500 group-hover:translate-x-1 transition-all text-xl">
                                →
                            </span>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
