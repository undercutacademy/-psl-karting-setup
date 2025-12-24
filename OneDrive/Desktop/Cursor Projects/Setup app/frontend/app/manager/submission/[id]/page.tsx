'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSubmissionById } from '@/lib/api';
import { Submission } from '@/types/submission';

export default function ViewSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmission();
  }, [params.id]);

  const loadSubmission = async () => {
    try {
      const data = await getSubmissionById(params.id as string);
      setSubmission(data);
    } catch (error) {
      console.error('Error loading submission:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Submission not found</p>
      </div>
    );
  }

  const userName = submission.user
    ? `${submission.user.firstName} ${submission.user.lastName}`
    : 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Submission Details</h1>
          <button
            onClick={() => router.back()}
            className="rounded bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
          >
            Back
          </button>
        </div>

        <div className="space-y-6">
          {/* General Information */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">General Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Driver</p>
                <p className="text-lg">{userName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg">{submission.user?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Session Type</p>
                <p className="text-lg">{submission.sessionType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Class Code</p>
                <p className="text-lg">{submission.classCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Track</p>
                <p className="text-lg">{submission.track}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Championship</p>
                <p className="text-lg">{submission.championship}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Division</p>
                <p className="text-lg">{submission.division}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-lg">
                  {submission.createdAt
                    ? new Date(submission.createdAt).toLocaleString()
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Engine Setup */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Engine Setup</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Engine Number</p>
                <p className="text-lg">{submission.engineNumber}</p>
              </div>
              {submission.gearRatio && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Gear Ratio</p>
                  <p className="text-lg">{submission.gearRatio}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Drive Sprocket</p>
                <p className="text-lg">{submission.driveSprocket}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Driven Sprocket</p>
                <p className="text-lg">{submission.drivenSprocket}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Carburator Number</p>
                <p className="text-lg">{submission.carburatorNumber}</p>
              </div>
            </div>
          </div>

          {/* Tyres Data */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Tyres Data</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tyre Model</p>
                <p className="text-lg">{submission.tyreModel}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tyre Age</p>
                <p className="text-lg">{submission.tyreAge}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cold Pressure</p>
                <p className="text-lg">{submission.tyreColdPressure}</p>
              </div>
            </div>
          </div>

          {/* Kart Setup */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Kart Setup</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Chassis</p>
                <p className="text-lg">{submission.chassis}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Axle</p>
                <p className="text-lg">{submission.axle}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Rear Hubs Material</p>
                <p className="text-lg">{submission.rearHubsMaterial}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Rear Hubs Length</p>
                <p className="text-lg">{submission.rearHubsLength}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Front Height</p>
                <p className="text-lg">{submission.frontHeight}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Back Height</p>
                <p className="text-lg">{submission.backHeight}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Front Hubs Material</p>
                <p className="text-lg">{submission.frontHubsMaterial}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Front Bar</p>
                <p className="text-lg">{submission.frontBar}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Spindle</p>
                <p className="text-lg">{submission.spindle}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Caster</p>
                <p className="text-lg">{submission.caster}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Seat Position (cm)</p>
                <p className="text-lg">{submission.seatPosition}</p>
              </div>
            </div>
          </div>

          {/* Conclusion */}
          {(submission.lapTime || submission.observation) && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold">Conclusion</h2>
              {submission.lapTime && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Lap Time</p>
                  <p className="text-lg">{submission.lapTime}</p>
                </div>
              )}
              {submission.observation && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Observation</p>
                  <p className="text-lg whitespace-pre-wrap">{submission.observation}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/manager/submission/${params.id}/edit`)}
              className="rounded bg-purple-600 px-6 py-2 text-white hover:bg-purple-700"
            >
              Edit Submission
            </button>
            <button
              onClick={() => router.back()}
              className="rounded bg-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-400"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

