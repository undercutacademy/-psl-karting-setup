'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { changePassword } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamName, setTeamName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#ef4444');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch(`${API_URL}/teams/${teamSlug}`);
        if (response.ok) {
          const data = await response.json();
          setTeamLogo(data.logoUrl);
          setTeamName(data.name);
          if (data.primaryColor) setPrimaryColor(data.primaryColor);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
      }
    };

    if (teamSlug) fetchTeam();
  }, [teamSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const email = localStorage.getItem('managerEmail');
      if (!email) {
        router.push(`/${teamSlug}/manager/login`);
        return;
      }

      await changePassword(email, currentPassword, newPassword);

      // Update localStorage to reflect password changed
      const userStr = localStorage.getItem('managerUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.mustChangePassword = false;
        localStorage.setItem('managerUser', JSON.stringify(user));
      }

      router.push(`/${teamSlug}/manager/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden p-8">
      {/* Racing stripes background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-1 h-full transform -skew-x-12" style={{ backgroundColor: primaryColor }}></div>
        <div className="absolute top-0 left-1/4 ml-4 w-1 h-full transform -skew-x-12" style={{ backgroundColor: primaryColor }}></div>
        <div className="absolute top-0 right-1/4 w-1 h-full transform -skew-x-12" style={{ backgroundColor: primaryColor }}></div>
        <div className="absolute top-0 right-1/4 mr-4 w-1 h-full transform -skew-x-12" style={{ backgroundColor: primaryColor }}></div>
      </div>

      {/* Top racing stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{ background: `linear-gradient(to right, ${primaryColor}, white, ${primaryColor})` }}
      ></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          {teamLogo ? (
            <Image
              src={teamLogo}
              alt={teamName || 'Team Logo'}
              width={250}
              height={100}
              className="drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4"
              style={{ filter: `drop-shadow(0 0 15px ${primaryColor}4D)` }}
              priority
            />
          ) : (
            <div className="h-24 w-64 bg-gray-800/50 rounded animate-pulse mb-4"></div>
          )}
        </div>

        {/* Change Password Card */}
        <div className="rounded-2xl bg-gray-900/80 border border-gray-800 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}33` }}
            >
              <span className="text-2xl">🔑</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
                Change <span style={{ color: primaryColor }}>Password</span>
              </h1>
              <p className="text-gray-400 text-sm">Create your own password to continue</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="rounded-xl border p-4 text-red-400"
                style={{ backgroundColor: `${primaryColor}1A`, borderColor: `${primaryColor}4D` }}
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="currentPassword" className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 hover:border-gray-600"
                placeholder="Enter password from email"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 hover:border-gray-600"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 hover:border-gray-600"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {loading && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              )}
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-xs">
          <p>Powered by <a href="https://overcutacademy.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Overcut Academy</a></p>
        </div>
      </div>
    </div>
  );
}
