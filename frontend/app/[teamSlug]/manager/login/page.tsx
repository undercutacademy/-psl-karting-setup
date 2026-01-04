'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ManagerLoginPage() {
  const router = useRouter();
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch(`${API_URL}/teams/${teamSlug}`);
        if (response.ok) {
          const data = await response.json();
          setTeamLogo(data.logoUrl);
          setTeamName(data.name);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
      }
    };

    if (teamSlug) {
      fetchTeam();
    }
  }, [teamSlug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/manager/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, teamSlug }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('managerEmail', email);
      localStorage.setItem('managerUser', JSON.stringify(data.user));

      router.push(`/${teamSlug}/manager/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Link href={`/${teamSlug}`}>
            {teamLogo ? (
              <Image
                src={teamLogo}
                alt={teamName || "Team Logo"}
                width={250}
                height={100}
                className="drop-shadow-[0_0_30px_rgba(227,24,55,0.4)] mb-4"
                priority
              />
            ) : (
              // Fallback or Loading state
              <div className="h-24 w-64 bg-gray-800/50 rounded animate-pulse mb-4"></div>
            )}
          </Link>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-gray-900/80 border border-gray-800 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
                Manager <span className="text-red-500">Login</span>
              </h1>
              <p className="text-gray-400 text-sm">Enter your credentials</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 hover:border-gray-600"
                placeholder="manager@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 hover:border-gray-600"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              )}
              {loading ? 'Logging in...' : '→ Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href={`/${teamSlug}`} className="text-gray-400 hover:text-white transition-colors">
              ← Back to Home
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
