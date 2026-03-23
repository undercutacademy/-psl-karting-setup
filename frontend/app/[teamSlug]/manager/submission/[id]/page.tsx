'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSubmissionById, getTeamConfig } from '@/lib/api';
import { Submission } from '@/types/submission';
import { TeamConfig } from '@/types/team';
import { TRANSLATIONS, Language } from '@/lib/translations';
import { TRACK_LAYOUTS, getTrackLayoutImage, getTrackLayoutName } from '@/lib/trackLayouts';

// Styling classes for consistent look
const labelClass = "text-sm font-bold text-black uppercase tracking-wide";
const valueClass = "text-lg text-gray-600";
const sectionTitleClass = "mb-4 text-xl font-bold text-black";

export default function ViewSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [teamConfig, setTeamConfig] = useState<TeamConfig | null>(null);

  useEffect(() => {
    loadSubmission();
    loadTeamConfig();
  }, [params.id]);

  const loadSubmission = async () => {
    try {
      const data = await getSubmissionById(params.id as string, params.teamSlug as string);
      setSubmission(data);
    } catch (error) {
      console.error('Error loading submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamConfig = async () => {
    try {
      const config = await getTeamConfig(params.teamSlug as string);
      setTeamConfig(config);
    } catch (error) {
      console.error('Error loading team config:', error);
    }
  };

  const lang = (teamConfig?.defaultLanguage as Language) || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

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

  const layoutImage = getTrackLayoutImage(submission.track || '');
  const layoutName = getTrackLayoutName(submission.track || '');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-black">{t.submissionDetails}</h1>
          <button
            onClick={() => router.back()}
            className="rounded bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
          >
            {t.back}
          </button>
        </div>

        <div className="space-y-6">
          {/* General Information */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className={sectionTitleClass}>{t.generalInfo}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={labelClass}>{t.driver}</p>
                <p className={valueClass}>{userName}</p>
              </div>
              <div>
                <p className={labelClass}>{t.email}</p>
                <p className={valueClass}>{submission.user?.email || '-'}</p>
              </div>
              <div>
                <p className={labelClass}>{t.sessionType}</p>
                <p className={valueClass}>{submission.sessionType}</p>
              </div>

              <div>
                <p className={labelClass}>{t.track}</p>
                <p className={valueClass}>{submission.track}</p>
              </div>
              <div>
                <p className={labelClass}>{t.championship}</p>
                <p className={valueClass}>{submission.championship}</p>
              </div>
              <div>
                <p className={labelClass}>{t.division}</p>
                <p className={valueClass}>{submission.division}</p>
              </div>
              <div>
                <p className={labelClass}>{t.date}</p>
                <p className={valueClass}>
                  {submission.createdAt
                    ? new Date(submission.createdAt).toLocaleString()
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Track Layout Image */}
          {layoutImage && (
            <div className="rounded-lg bg-[#16161a] p-6 shadow-md">
              <h2 className="mb-4 text-xl font-bold text-white">{t.trackLayout}: <span className="text-red-400">{layoutName}</span></h2>
              <div className="flex justify-center p-4">
                <img
                  src={layoutImage}
                  alt={layoutName || 'Track Layout'}
                  className="max-h-64 object-contain drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                />
              </div>
            </div>
          )}

          {/* Engine Setup */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className={sectionTitleClass}>{t.engineSetup}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={labelClass}>{t.engineNumber}</p>
                <p className={valueClass}>{submission.engineNumber}</p>
              </div>
              {submission.gearRatio && (
                <div>
                  <p className={labelClass}>{t.gearRatio}</p>
                  <p className={valueClass}>{submission.gearRatio}</p>
                </div>
              )}
              {submission.driveSprocket && (
                <div>
                  <p className={labelClass}>{t.driveSprocket}</p>
                  <p className={valueClass}>{submission.driveSprocket}</p>
                </div>
              )}
              {submission.drivenSprocket && (
                <div>
                  <p className={labelClass}>{t.drivenSprocket}</p>
                  <p className={valueClass}>{submission.drivenSprocket}</p>
                </div>
              )}
              {submission.carburatorNumber && (
                <div>
                  <p className={labelClass}>{t.carburatorNumber}</p>
                  <p className={valueClass}>{submission.carburatorNumber}</p>
                </div>
              )}
              {submission.sparkplugType && (
                <div>
                  <p className={labelClass}>{t.sparkplugType}</p>
                  <p className={valueClass}>{submission.sparkplugType}</p>
                </div>
              )}
              {submission.sparkplugGap != null && (
                <div>
                  <p className={labelClass}>{t.sparkplugGap}</p>
                  <p className={valueClass}>{submission.sparkplugGap}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tyres Data */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className={sectionTitleClass}>{t.tyresData}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className={labelClass}>{t.tyreModel}</p>
                <p className={valueClass}>{submission.tyreModel}</p>
              </div>
              <div>
                <p className={labelClass}>{t.tyreAge}</p>
                <p className={valueClass}>{submission.tyreAge}</p>
              </div>
              <div>
                <p className={labelClass}>{t.tyreColdPressure}</p>
                <p className={valueClass}>{submission.tyreColdPressure}</p>
              </div>
            </div>
          </div>

          {/* Kart Setup */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className={sectionTitleClass}>{t.kartSetup}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={labelClass}>{t.chassis}</p>
                <p className={valueClass}>{submission.chassis}</p>
              </div>
              <div>
                <p className={labelClass}>{t.axle}</p>
                <p className={valueClass}>{submission.axle}</p>
              </div>
              <div>
                <p className={labelClass}>{t.rearHubsMaterial}</p>
                <p className={valueClass}>{submission.rearHubsMaterial}</p>
              </div>
              <div>
                <p className={labelClass}>{t.rearHubsLength}</p>
                <p className={valueClass}>{submission.rearHubsLength}</p>
              </div>
              <div>
                <p className={labelClass}>{t.frontHeight}</p>
                <p className={valueClass}>{submission.frontHeight}</p>
              </div>
              <div>
                <p className={labelClass}>{t.backHeight}</p>
                <p className={valueClass}>{submission.backHeight}</p>
              </div>
              <div>
                <p className={labelClass}>{t.frontHubsMaterial}</p>
                <p className={valueClass}>{submission.frontHubsMaterial}</p>
              </div>
              <div>
                <p className={labelClass}>{t.frontBar}</p>
                <p className={valueClass}>{submission.frontBar}</p>
              </div>
              <div>
                <p className={labelClass}>{t.spindle}</p>
                <p className={valueClass}>{submission.spindle}</p>
              </div>
              {submission.frontWheelType && (
                <div>
                  <p className={labelClass}>{t.frontWheelType}</p>
                  <p className={valueClass}>{submission.frontWheelType}</p>
                </div>
              )}
              <div>
                <p className={labelClass}>{t.caster}</p>
                <p className={valueClass}>{submission.caster}</p>
              </div>
              <div>
                <p className={labelClass}>{t.seatPosition}</p>
                <p className={valueClass}>{submission.seatPosition}</p>
              </div>
            </div>
          </div>

          {/* Conclusion */}
          {(submission.lapTime || submission.observation) && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className={sectionTitleClass}>{t.sessionResults}</h2>
              {submission.lapTime && (
                <div className="mb-4">
                  <p className={labelClass}>{t.lapTime}</p>
                  <p className={valueClass}>{submission.lapTime}</p>
                </div>
              )}
              {submission.observation && (
                <div>
                  <p className={labelClass}>{t.observation}</p>
                  <p className={`${valueClass} whitespace-pre-wrap`}>{submission.observation}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/${params.teamSlug}/manager/submission/${params.id}/edit`)}
              className="rounded bg-red-600 px-6 py-2 text-white hover:bg-red-700"
            >
              {t.editSubmission}
            </button>
            <button
              onClick={() => router.back()}
              className="rounded bg-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-400"
            >
              {t.backToDashboard}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
