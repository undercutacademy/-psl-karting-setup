'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function LandingPage() {
    const [hoveredLogo, setHoveredLogo] = useState<string | null>(null);
    const [privateModal, setPrivateModal] = useState<string | null>(null);

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
                <div className="mb-12 relative h-[220px] flex items-center justify-center">
                    <Image
                        src="/overcut-academy-logo.png"
                        alt="Overcut Academy"
                        width={350}
                        height={140}
                        className={`absolute drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-opacity duration-500 ease-in-out ${hoveredLogo ? 'opacity-0' : 'opacity-100'}`}
                        priority
                    />
                    {hoveredLogo && (
                        <Image
                            src={hoveredLogo}
                            alt="Team Logo"
                            width={300}
                            height={140}
                            className={`absolute object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-opacity duration-500 ease-in-out opacity-100`}
                        />
                    )}
                </div>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider mb-2">
                        Select Team
                    </h1>
                    <p className="text-gray-400">
                        Choose a team to access their workspace
                    </p>
                </div>

                <div className="grid gap-4">
                    {/* Demo Motorsport - public access */}
                    <Link
                        href="/demo"
                        onMouseEnter={() => setHoveredLogo('/demo.png')}
                        onMouseLeave={() => setHoveredLogo(null)}
                        className="group relative flex items-center justify-between p-4 rounded-xl border border-gray-700/50 bg-gray-900/80 hover:bg-gray-800 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    >
                        <span className="font-bold text-lg text-gray-200 group-hover:text-white transition-colors">
                            Demo Motorsport
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

                    {/* PSL Karting - private */}
                    <button
                        onClick={() => setPrivateModal('PSL Karting')}
                        onMouseEnter={() => setHoveredLogo('/psl-logo.png')}
                        onMouseLeave={() => setHoveredLogo(null)}
                        className="group relative flex items-center justify-between p-4 rounded-xl border border-gray-700/50 bg-gray-900/80 hover:bg-gray-800 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300 hover:scale-[1.02] cursor-pointer text-left"
                    >
                        <span className="font-bold text-lg text-gray-200 group-hover:text-white transition-colors">
                            PSL Karting
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                PRIVATE ACCESS
                            </span>
                            <span className="text-gray-500 group-hover:text-red-500 group-hover:translate-x-1 transition-all text-xl">
                                →
                            </span>
                        </div>
                    </button>

                    {/* TKG BirelArt - private */}
                    <button
                        onClick={() => setPrivateModal('TKG BirelArt')}
                        onMouseEnter={() => setHoveredLogo('/tkg-logo.png')}
                        onMouseLeave={() => setHoveredLogo(null)}
                        className="group relative flex items-center justify-between p-4 rounded-xl border border-gray-700/50 bg-gray-900/80 hover:bg-gray-800 hover:border-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-300 hover:scale-[1.02] cursor-pointer text-left"
                    >
                        <span className="font-bold text-lg text-gray-200 group-hover:text-white transition-colors">
                            TKG BirelArt
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                PRIVATE ACCESS
                            </span>
                            <span className="text-gray-500 group-hover:text-green-500 group-hover:translate-x-1 transition-all text-xl">
                                →
                            </span>
                        </div>
                    </button>

                    {/* GPM Racing / EmiliaKart - private */}
                    <button
                        onClick={() => setPrivateModal('GPM Racing / EmiliaKart')}
                        onMouseEnter={() => setHoveredLogo('/GPM_Emilia_logo.png')}
                        onMouseLeave={() => setHoveredLogo(null)}
                        className="group relative flex items-center justify-between p-4 rounded-xl border border-gray-700/50 bg-gray-900/80 hover:bg-gray-800 hover:border-red-600 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all duration-300 hover:scale-[1.02] cursor-pointer text-left"
                    >
                        <span className="font-bold text-lg text-gray-200 group-hover:text-white transition-colors">
                            GPM Racing / EmiliaKart
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                PRIVATE ACCESS
                            </span>
                            <span className="text-gray-500 group-hover:text-red-600 group-hover:translate-x-1 transition-all text-xl">
                                →
                            </span>
                        </div>
                    </button>

                    {/* Prime Powerteam - private */}
                    <button
                        onClick={() => setPrivateModal('Prime Powerteam')}
                        onMouseEnter={() => setHoveredLogo('/primepowerteam-logo.png')}
                        onMouseLeave={() => setHoveredLogo(null)}
                        className="group relative flex items-center justify-between p-4 rounded-xl border border-gray-700/50 bg-gray-900/80 hover:bg-gray-800 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300 hover:scale-[1.02] cursor-pointer text-left"
                    >
                        <span className="font-bold text-lg text-gray-200 group-hover:text-white transition-colors">
                            Prime Powerteam
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                PRIVATE ACCESS
                            </span>
                            <span className="text-gray-500 group-hover:text-red-500 group-hover:translate-x-1 transition-all text-xl">
                                →
                            </span>
                        </div>
                    </button>

                    {/* Bravar Sports - private */}
                    <button
                        onClick={() => setPrivateModal('Bravar Sports')}
                        onMouseEnter={() => setHoveredLogo('/LOGO_BRAVAR_SPORTS.png')}
                        onMouseLeave={() => setHoveredLogo(null)}
                        className="group relative flex items-center justify-between p-4 rounded-xl border border-gray-700/50 bg-gray-900/80 hover:bg-gray-800 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300 hover:scale-[1.02] cursor-pointer text-left"
                    >
                        <span className="font-bold text-lg text-gray-200 group-hover:text-white transition-colors">
                            Bravar Sports
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                PRIVATE ACCESS
                            </span>
                            <span className="text-gray-500 group-hover:text-blue-500 group-hover:translate-x-1 transition-all text-xl">
                                →
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Private access modal */}
            {privateModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setPrivateModal(null)}
                >
                    <div
                        className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm mx-4 text-center shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 text-4xl">🔒</div>
                        <h2 className="text-xl font-bold text-white mb-3">Private Access</h2>
                        <p className="text-gray-400 mb-6">
                            This Setup page is private for members of <span className="text-white font-semibold">{privateModal}</span>.
                        </p>
                        <button
                            onClick={() => setPrivateModal(null)}
                            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
