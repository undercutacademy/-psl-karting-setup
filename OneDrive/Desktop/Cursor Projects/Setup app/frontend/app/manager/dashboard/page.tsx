'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getAllSubmissions } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const inputClass = "block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 hover:border-gray-600";
const selectClass = "block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white backdrop-blur-sm transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 hover:border-gray-600 cursor-pointer";
const labelClass = "block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2";

export default function ManagerDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrack, setFilterTrack] = useState('');
  const [filterSession, setFilterSession] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [searchTerm, filterTrack, filterSession, submissions]);

  const loadSubmissions = async () => {
    try {
      const data = await getAllSubmissions();
      setSubmissions(data);
      setFilteredSubmissions(data);
    } catch (error: any) {
      console.error('Error loading submissions:', error);
      alert(error.message || 'Failed to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((sub) => {
        const userName = sub.user ? `${sub.user.firstName} ${sub.user.lastName}` : '';
        return (
          userName.toLowerCase().includes(term) ||
          sub.track?.toLowerCase().includes(term) ||
          sub.championship?.toLowerCase().includes(term) ||
          sub.division?.toLowerCase().includes(term)
        );
      });
    }

    if (filterTrack) {
      filtered = filtered.filter((sub) => sub.track === filterTrack);
    }

    if (filterSession) {
      filtered = filtered.filter((sub) => sub.sessionType === filterSession);
    }

    setFilteredSubmissions(filtered);
  };

  const handleExportPDF = async (submissionId: string) => {
    try {
      const response = await fetch(`${API_URL}/submissions/${submissionId}/pdf`);
      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `setup-${submissionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const handleView = (submissionId: string) => {
    router.push(`/manager/submission/${submissionId}`);
  };

  const handleEdit = (submissionId: string) => {
    router.push(`/manager/submission/${submissionId}/edit`);
  };

  const uniqueTracks = Array.from(new Set(submissions.map((s) => s.track).filter(Boolean)));
  const uniqueSessions = Array.from(new Set(submissions.map((s) => s.sessionType).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
          <p className="text-lg text-gray-400">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Racing stripes background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
        <div className="absolute top-0 left-1/4 ml-4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
        <div className="absolute top-0 right-1/4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
        <div className="absolute top-0 right-1/4 mr-4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-wider">
              Setup <span className="text-red-500">Submissions</span>
            </h1>
            <p className="text-gray-400">View and manage all driver setups</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30">
              <span className="text-red-400 font-bold">
                {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 rounded-2xl bg-gray-900/80 border border-gray-800 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔍</span>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Search & Filter</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Driver, track, championship..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Filter by Track</label>
              <select
                value={filterTrack}
                onChange={(e) => setFilterTrack(e.target.value)}
                className={selectClass}
              >
                <option value="">All Tracks</option>
                {uniqueTracks.map((track) => (
                  <option key={track} value={track}>{track}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Filter by Session</label>
              <select
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value)}
                className={selectClass}
              >
                <option value="">All Sessions</option>
                {uniqueSessions.map((session) => (
                  <option key={session} value={session}>{session}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Driver
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Session
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Track
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Championship
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Division
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-gray-500">
                        {submissions.length === 0 ? 'No submissions yet' : 'No submissions match your filters'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission) => {
                    const userName = submission.user
                      ? `${submission.user.firstName} ${submission.user.lastName}`
                      : 'Unknown';
                    return (
                      <tr
                        key={submission.id}
                        className="hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {submission.createdAt
                            ? new Date(submission.createdAt).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-white">{userName}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400">
                            {submission.sessionType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {submission.track}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {submission.championship}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {submission.division}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleView(submission.id)}
                              className="px-3 py-1 rounded-lg bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleExportPDF(submission.id)}
                              className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-colors"
                            >
                              PDF
                            </button>
                            <button
                              onClick={() => handleEdit(submission.id)}
                              className="px-3 py-1 rounded-lg bg-gray-700 text-gray-300 font-semibold text-sm hover:bg-gray-600 transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
