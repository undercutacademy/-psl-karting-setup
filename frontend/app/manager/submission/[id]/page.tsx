'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSubmissionById } from '@/lib/api';
import { Submission } from '@/types/submission';

// Styling classes for consistent look
const labelClass = "text-sm font-bold text-black uppercase tracking-wide";
const valueClass = "text-lg text-gray-600";
const sectionTitleClass = "mb-4 text-xl font-bold text-black";

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
          <h1 className="text-3xl font-bold text-black">Submission Details</h1>
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
            <h2 className={sectionTitleClass}>General Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={labelClass}>Driver</p>
                <p className={valueClass}>{userName}</p>
              </div>
              <div>
                <p className={labelClass}>Email</p>
                <p className={valueClass}>{submission.user?.email || '-'}</p>
              </div>
              <div>
                <p className={labelClass}>Session Type</p>
                <p className={valueClass}>{submission.sessionType}</p>
              </div>

              <div>
                <p className={labelClass}>Track</p>
                <p className={valueClass}>{submission.track}</p>
              </div>
              <div>
                <p className={labelClass}>Championship</p>
                <p className={valueClass}>{submission.championship}</p>
              </div>
              <div>
                <p className={labelClass}>Division</p>
                <p className={valueClass}>{submission.division}</p>
              </div>
              <div>
                <p className={labelClass}>Date</p>
                <p className={valueClass}>
                  {submission.createdAt
                    ? new Date(submission.createdAt).toLocaleString()
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Engine Setup */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className={sectionTitleClass}>Engine Setup</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={labelClass}>Engine Number</p>
                <p className={valueClass}>{submission.engineNumber}</p>
              </div>
              {submission.gearRatio && (
                <div>
                  <p className={labelClass}>Gear Ratio</p>
                  <p className={valueClass}>{submission.gearRatio}</p>
                </div>
              )}
              {submission.driveSprocket && (
                <div>
                  <p className={labelClass}>Drive Sprocket</p>
                  <p className={valueClass}>{submission.driveSprocket}</p>
                </div>
              )}
              {submission.drivenSprocket && (
                <div>
                  <p className={labelClass}>Driven Sprocket</p>
                  <p className={valueClass}>{submission.drivenSprocket}</p>
                </div>
              )}
              {submission.carburatorNumber && (
                <div>
                  <p className={labelClass}>Carburator Number</p>
                  <p className={valueClass}>{submission.carburatorNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tyres Data */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className={sectionTitleClass}>Tyres Data</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className={labelClass}>Tyre Model</p>
                <p className={valueClass}>{submission.tyreModel}</p>
              </div>
              <div>
                <p className={labelClass}>Tyre Age</p>
                <p className={valueClass}>{submission.tyreAge}</p>
              </div>
              <div>
                <p className={labelClass}>Cold Pressure</p>
                <p className={valueClass}>{submission.tyreColdPressure}</p>
              </div>
            </div>
          </div>

          {/* Kart Setup */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className={sectionTitleClass}>Kart Setup</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={labelClass}>Chassis</p>
                <p className={valueClass}>{submission.chassis}</p>
              </div>
              <div>
                <p className={labelClass}>Axle</p>
                <p className={valueClass}>{submission.axle}</p>
              </div>
              <div>
                <p className={labelClass}>Rear Hubs Material</p>
                <p className={valueClass}>{submission.rearHubsMaterial}</p>
              </div>
              <div>
                <p className={labelClass}>Rear Hubs Length</p>
                <p className={valueClass}>{submission.rearHubsLength}</p>
              </div>
              <div>
                <p className={labelClass}>Front Height</p>
                <p className={valueClass}>{submission.frontHeight}</p>
              </div>
              <div>
                <p className={labelClass}>Back Height</p>
                <p className={valueClass}>{submission.backHeight}</p>
              </div>
              <div>
                <p className={labelClass}>Front Hubs Material</p>
                <p className={valueClass}>{submission.frontHubsMaterial}</p>
              </div>
              <div>
                <p className={labelClass}>Front Bar</p>
                <p className={valueClass}>{submission.frontBar}</p>
              </div>
              <div>
                <p className={labelClass}>Spindle</p>
                <p className={valueClass}>{submission.spindle}</p>
              </div>
              <div>
                <p className={labelClass}>Caster</p>
                <p className={valueClass}>{submission.caster}</p>
              </div>
              <div>
                <p className={labelClass}>Seat Position (cm)</p>
                <p className={valueClass}>{submission.seatPosition}</p>
              </div>
            </div>
          </div>

          {/* Conclusion */}
          {(submission.lapTime || submission.observation) && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className={sectionTitleClass}>Conclusion</h2>
              {submission.lapTime && (
                <div className="mb-4">
                  <p className={labelClass}>Lap Time</p>
                  <p className={valueClass}>{submission.lapTime}</p>
                </div>
              )}
              {submission.observation && (
                <div>
                  <p className={labelClass}>Observation</p>
                  <p className={`${valueClass} whitespace-pre-wrap`}>{submission.observation}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/manager/submission/${params.id}/edit`)}
              className="rounded bg-red-600 px-6 py-2 text-white hover:bg-red-700"
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
