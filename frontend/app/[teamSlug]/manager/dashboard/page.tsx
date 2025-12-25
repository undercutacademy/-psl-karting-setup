'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getAllSubmissions, updateSubmission } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const inputClass = "block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 hover:border-gray-600";
const selectClass = "block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white backdrop-blur-sm transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 hover:border-gray-600 cursor-pointer";
const labelClass = "block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2";

// Color Helpers
const getSessionColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('qualifying')) return 'bg-yellow-500/20 text-yellow-500';
  if (t.includes('final') || t.includes('heat') || t.includes('super')) return 'bg-red-500/20 text-red-500';
  if (t.includes('warm')) return 'bg-cyan-500/20 text-cyan-400';
  if (t.includes('practice')) return 'bg-blue-500/20 text-blue-400';
  if (t.includes('happy')) return 'bg-green-500/20 text-green-400';
  return 'bg-gray-500/20 text-gray-400';
};

const getDivisionColor = (division: string) => {
  if (!division) return 'text-gray-400';
  const d = division.toLowerCase();

  // Green for small karts
  if (d.includes('micro') || d.includes('mini')) return 'text-green-400';

  // Blue/Teal for Junior
  if (d.includes('junior') || d.includes('jr')) return 'text-teal-400';

  // Purple/Indigo for Senior/Master
  if (d.includes('senior') || d.includes('sr') || d.includes('master')) return 'text-indigo-400';

  // Red/Rose for Shifter/KZ (Fastest)
  if (d.includes('shifter') || d.includes('kz') || d.includes('dd2')) return 'text-rose-400';

  // Default
  return 'text-gray-300';
};

export default function ManagerDashboard() {
  const router = useRouter();
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrack, setFilterTrack] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [searchTerm, filterTrack, filterSession, submissions]);

  const loadSubmissions = async () => {
    try {
      const data = await getAllSubmissions(teamSlug);
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
          sub.division?.toLowerCase().includes(term) ||
          sub.engineNumber?.toLowerCase().includes(term) ||
          sub.tyreModel?.toLowerCase().includes(term)
        );
      });
    }

    if (filterTrack) {
      filtered = filtered.filter((sub) => sub.track === filterTrack);
    }

    if (filterSession) {
      filtered = filtered.filter((sub) => sub.sessionType === filterSession);
    }


    if (showFavorites) {
      filtered = filtered.filter((sub) => sub.isFavorite);
    }

    setFilteredSubmissions(filtered);
  };

  const toggleFavorite = async (e: React.MouseEvent, submission: any) => {
    e.stopPropagation();
    try {
      const updated = !submission.isFavorite;
      // Optimistic update
      const newSubmissions = submissions.map(s =>
        s.id === submission.id ? { ...s, isFavorite: updated } : s
      );
      setSubmissions(newSubmissions);
      // We need to re-filter immediately to reflect optimistic changes if we are on the favorites tab
      // But since filterSubmissions depends on 'submissions' state which is async, let's just trigger update

      // Wait for API
      await updateSubmission(submission.id, { isFavorite: updated }, teamSlug);

      // If API fails, we could revert, but for now assuming success or user will refresh
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite status');
      // Revert on error
      const reverted = submissions.map(s =>
        s.id === submission.id ? { ...s, isFavorite: submission.isFavorite } : s
      );
      setSubmissions(reverted);
    }
  };

  const handleExportPDF = async (submissionId: string) => {
    try {
      const response = await fetch(`${API_URL}/submissions/${submissionId}/pdf?teamSlug=${encodeURIComponent(teamSlug)}`);
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
    router.push(`/${teamSlug}/manager/submission/${submissionId}`);
  };

  const handleEdit = (submissionId: string) => {
    router.push(`/${teamSlug}/manager/submission/${submissionId}/edit`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredSubmissions.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedIds.size} submission(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/submissions/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), teamSlug }),
      });

      if (!response.ok) throw new Error('Failed to delete submissions');

      // Refresh the list
      await loadSubmissions();
      setSelectedIds(new Set());
      alert(`Successfully deleted ${selectedIds.size} submission(s)`);
    } catch (error) {
      console.error('Error deleting submissions:', error);
      alert('Failed to delete submissions');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (selectedIds.size === 0) return;

    // Get selected submissions
    const selectedSubmissions = submissions.filter(s => selectedIds.has(s.id));

    // Define CSV headers
    const headers = [
      'Date',
      'Driver First Name',
      'Driver Last Name',
      'Session Type',
      'Track',
      'Championship',
      'Division',
      'Engine Number',
      'Gear Ratio',
      'Drive Sprocket',
      'Driven Sprocket',
      'Carburator Number',
      'Tyre Model',
      'Tyre Age',
      'Cold Pressure',
      'Chassis',
      'Axle',
      'Rear Hubs Material',
      'Rear Hubs Length',
      'Front Height',
      'Back Height',
      'Front Hubs Material',
      'Front Bar',
      'Spindle',
      'Caster',
      'Seat Position',
      'Lap Time',
      'Observation'
    ];

    // Build CSV rows
    const rows = selectedSubmissions.map(sub => {
      const userName = sub.user || {};
      return [
        sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-GB') : '',
        userName.firstName || '',
        userName.lastName || '',
        sub.sessionType || '',
        sub.track || '',
        sub.championship || '',
        sub.division || '',
        sub.engineNumber || '',
        sub.gearRatio || '',
        sub.driveSprocket || '',
        sub.drivenSprocket || '',
        sub.carburatorNumber || '',
        sub.tyreModel || '',
        sub.tyreAge || '',
        sub.tyreColdPressure || '',
        sub.chassis || '',
        sub.axle || '',
        sub.rearHubsMaterial || '',
        sub.rearHubsLength || '',
        sub.frontHeight || '',
        sub.backHeight || '',
        sub.frontHubsMaterial || '',
        sub.frontBar || '',
        sub.spindle || '',
        sub.caster || '',
        sub.seatPosition || '',
        sub.lapTime || '',
        // Escape quotes and commas in observation
        `"${(sub.observation || '').replace(/"/g, '""')}"`
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells that contain commas or quotes (except observation which is already quoted)
        const cellStr = String(cell);
        if (cellStr.startsWith('"') && cellStr.endsWith('"')) return cellStr;
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    a.download = `setups-export-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };


  const uniqueTracks = Array.from(new Set(submissions.map((s) => s.track).filter(Boolean)));
  const uniqueSessions = Array.from(new Set(submissions.map((s) => s.sessionType).filter(Boolean)));

  // Re-run filter when showFavorites changes or submissions update
  useEffect(() => {
    filterSubmissions();
  }, [showFavorites, submissions, searchTerm, filterTrack, filterSession]);

  const allSelected = filteredSubmissions.length > 0 && selectedIds.size === filteredSubmissions.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredSubmissions.length;

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

      <div className="relative z-10 mx-auto max-w-[95%] px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-wider">
              Setup <span className="text-red-500">Submissions</span>
            </h1>
            <p className="text-gray-400">View and manage all driver setups</p>
          </div>
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold uppercase tracking-wider hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <span>📊</span>
                  Export CSV ({selectedIds.size})
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold uppercase tracking-wider hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>🗑️</span>
                  )}
                  Delete Selected ({selectedIds.size})
                </button>
              </>
            )}
            <div className="px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30">
              <span className="text-red-400 font-bold">
                {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>


        {/* Search and Filters */}
        <div className="mb-6 rounded-2xl bg-gray-900/80 border border-gray-800 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Search & Filter</h2>
            </div>

            {/* Favorites Tab / Filter */}
            <div className="flex bg-gray-800/50 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => setShowFavorites(false)}
                className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all ${!showFavorites
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                All Sessions
              </button>
              <button
                onClick={() => setShowFavorites(true)}
                className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${showFavorites
                  ? 'bg-yellow-500 text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span>⭐</span>
                Favorites
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Driver, track, engine, tyre..."
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
                  <th className="px-4 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 text-red-500 focus:ring-red-500 focus:ring-offset-gray-900"
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Date
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Driver
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Session
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Track
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Division
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Engine
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Tyre
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
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
                    const isSelected = selectedIds.has(submission.id);
                    return (
                      <tr
                        key={submission.id}
                        className={`hover:bg-gray-800/50 transition-colors ${isSelected ? 'bg-red-500/10' : ''}`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectOne(submission.id, e.target.checked)}
                              className="w-4 h-4 rounded border-gray-600 text-red-500 focus:ring-red-500 focus:ring-offset-gray-900"
                            />
                            <button
                              onClick={(e) => toggleFavorite(e, submission)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              {submission.isFavorite ? (
                                <span className="text-xl">⭐</span>
                              ) : (
                                <span className="text-xl opacity-30 grayscale hover:opacity-100 hover:grayscale-0">⭐</span>
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                          {submission.createdAt
                            ? new Date(submission.createdAt).toLocaleDateString('en-GB')
                            : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-white">{userName}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getSessionColor(submission.sessionType)}`}>
                            {submission.sessionType}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                          {submission.track}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${getDivisionColor(submission.division)}`}>
                            {submission.division}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                          {submission.engineNumber || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                          {submission.tyreModel || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
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
