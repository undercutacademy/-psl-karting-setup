'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSubmissionById, updateSubmission, getTeamConfig } from '@/lib/api';
import { Submission, SessionType, RearHubsMaterial, FrontHeight, BackHeight, FrontHubsMaterial, FrontBar, Spindle } from '@/types/submission';
import { TeamConfig } from '@/types/team';

// Default options as fallback (matching form/page.tsx)
const DEFAULT_TRACKS = [
  'AMR Motorplex', 'AMR Motorplex CCW', 'Orlando', 'Orlando CCW', 'Speedsportz', 'Speedsportz CCW', 'Piquet',
  'St Pete', 'New Castle', 'New Castle Sharkfin', 'New Castle CCW', 'ROK Rio 2024',
  'Las Vegas Motor Speedway 2023', 'Charlotte Speedway', 'MCC Cinccinati', 'PittRace', 'Trackhouse',
  'Supernats 2024', 'Quaker City', 'ROK Rio 2025', 'Supernats 2025',
  'Hamilton', 'Tremblant', 'Tremblant CCW', 'Icar', 'SH Karting', 'Mosport', 'Supernats 2026', 'T4 Kartplex'
];

const DEFAULT_CHAMPIONSHIPS = [
  'Skusa Winter Series', 'Florida Winter Tour', 'Rotax Winter Trophy', 'Pro Tour',
  'Skusa Vegas', 'ROK Vegas', 'Stars Championship Series', 'Rotax US East Trophy',
  'Rotax US Final', 'Canada National', 'Champions of the Future', 'World Championship',
  'Supernats 2024', 'Coupe de Montreal', 'Canadian Open', 'Supernats 2025', 'Supernats 2026'
];

const DIVISIONS_FALLBACK = [
  'Micro', 'Mini', 'KA100 Jr', 'KA100 Sr', 'KA100 Master', 'Pro Shifter', 'Shifter Master',
  'X30 Junior', 'X30 Senior', 'ROK Micro', 'ROK Mini', 'VLR Junior', 'VLR Senior',
  'VLR Master', 'ROK Shifter', 'ROK Master', 'ROK Junior', 'ROK PRO GP',
  'ROK SV', 'Micro Max', 'Mini Max', 'Junior Max', 'Senior Max', 'Master Max', 'DD2',
  'DD2 Master', '206 Cadet', '206 Junior', '206 Senior', 'OKN', 'OKNJ', 'KZ2', 'KZ1', 'KZM', 'OK', 'OKJ'
];

const TYRE_MODELS_FALLBACK = [
  'Mg Red', 'Mg Yellow', 'MG Wet', 'Evinco Blue', 'Evinco Blue SKH2', 'Evinco Red SKM2',
  'Evinco WET', 'Levanto', 'Levanto WET', 'Bridgestone', 'Vega Red', 'Vega Blue',
  'Vega Yellow', 'Mojo D5', 'Mojo D2', 'Dunlop', 'Dunlop WET'
];

// Styling classes for consistent look
const labelClass = "block text-sm font-bold text-black uppercase tracking-wide";
const inputClass = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 text-gray-700";
const selectClass = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 text-gray-700";
const sectionTitleClass = "mb-4 text-xl font-bold text-black";

export default function EditSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [teamConfig, setTeamConfig] = useState<TeamConfig | null>(null);

  useEffect(() => {
    loadData();
  }, [params.id, params.teamSlug]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [submissionData, config] = await Promise.all([
        getSubmissionById(params.id as string, params.teamSlug as string),
        getTeamConfig(params.teamSlug as string)
      ]);

      setSubmission(submissionData);
      setTeamConfig(config);

      // Normalize sessionType to match frontend enum values (e.g. "Practice1" -> "Practice 1")
      const normalizedSessionType = (SessionType as any)[submissionData.sessionType] || submissionData.sessionType;

      // Merge user details into formData for editing
      setFormData({
        ...submissionData,
        sessionType: normalizedSessionType,
        firstName: submissionData.user?.firstName || '',
        lastName: submissionData.user?.lastName || '',
        userEmail: submissionData.user?.email || '',
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to handle track/championship options
  const TRACKS = teamConfig?.dropdownOptions?.tracks || DEFAULT_TRACKS;
  const CHAMPIONSHIPS = teamConfig?.dropdownOptions?.championships || DEFAULT_CHAMPIONSHIPS;
  const DIVISIONS = teamConfig?.dropdownOptions?.divisions || DIVISIONS_FALLBACK;
  const TYRE_MODELS = teamConfig?.dropdownOptions?.tyreModels || TYRE_MODELS_FALLBACK;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSubmission(params.id as string, formData, params.teamSlug as string);
      router.push(`/${params.teamSlug}/manager/dashboard`);
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('Failed to update submission');
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-black">Edit Submission</h1>
          <p className="text-gray-600">Edit the submission details below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Driver & General Information */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className={sectionTitleClass}>Driver & General Information</h2>
            <div className="mb-6 grid grid-cols-2 gap-4 border-b pb-6">
              <div>
                <label className={labelClass}>First Name *</label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  value={formData.userEmail || ''}
                  onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Session Type *</label>
                <select
                  value={formData.sessionType}
                  onChange={(e) => setFormData({ ...formData, sessionType: e.target.value as SessionType })}
                  required
                  className={selectClass}
                >
                  {Object.values(SessionType).map((session) => (
                    <option key={session} value={session}>{session}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Track *</label>
                <select
                  value={formData.track}
                  onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                  required
                  className={selectClass}
                >
                  <option value="">Please Select</option>
                  {TRACKS.map((track: string) => (
                    <option key={track} value={track}>{track}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Championship *</label>
                <select
                  value={formData.championship}
                  onChange={(e) => setFormData({ ...formData, championship: e.target.value })}
                  required
                  className={selectClass}
                >
                  <option value="">Please Select</option>
                  {CHAMPIONSHIPS.map((champ: string) => (
                    <option key={champ} value={champ}>{champ}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Division *</label>
                <select
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  required
                  className={selectClass}
                >
                  <option value="">Please Select</option>
                  {DIVISIONS.map((div: string) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Engine Setup */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className={sectionTitleClass}>Engine Setup</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Engine Number *</label>
                <input
                  type="text"
                  value={formData.engineNumber}
                  onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Gear Ratio</label>
                <input
                  type="text"
                  value={formData.gearRatio || ''}
                  onChange={(e) => setFormData({ ...formData, gearRatio: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Drive Sprocket</label>
                <input
                  type="text"
                  value={formData.driveSprocket || ''}
                  onChange={(e) => setFormData({ ...formData, driveSprocket: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Driven Sprocket</label>
                <input
                  type="text"
                  value={formData.drivenSprocket || ''}
                  onChange={(e) => setFormData({ ...formData, drivenSprocket: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Carburator Number</label>
                <input
                  type="text"
                  value={formData.carburatorNumber || ''}
                  onChange={(e) => setFormData({ ...formData, carburatorNumber: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Tyres Data */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className={sectionTitleClass}>Tyres Data</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Tyre Model *</label>
                <select
                  value={formData.tyreModel}
                  onChange={(e) => setFormData({ ...formData, tyreModel: e.target.value })}
                  required
                  className={selectClass}
                >
                  <option value="">Please Select</option>
                  {TYRE_MODELS.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tyre Age *</label>
                <input
                  type="text"
                  value={formData.tyreAge}
                  onChange={(e) => setFormData({ ...formData, tyreAge: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Cold Pressure *</label>
                <input
                  type="text"
                  value={formData.tyreColdPressure}
                  onChange={(e) => setFormData({ ...formData, tyreColdPressure: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Kart Setup */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className={sectionTitleClass}>Kart Setup</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Chassis *</label>
                <input
                  type="text"
                  value={formData.chassis}
                  onChange={(e) => setFormData({ ...formData, chassis: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Axle *</label>
                <input
                  type="text"
                  value={formData.axle}
                  onChange={(e) => setFormData({ ...formData, axle: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Rear Hubs Material *</label>
                <select
                  value={formData.rearHubsMaterial}
                  onChange={(e) => setFormData({ ...formData, rearHubsMaterial: e.target.value as RearHubsMaterial })}
                  required
                  className={selectClass}
                >
                  {Object.values(RearHubsMaterial).map((material) => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Rear Hubs Length *</label>
                <input
                  type="text"
                  value={formData.rearHubsLength}
                  onChange={(e) => setFormData({ ...formData, rearHubsLength: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Front Height *</label>
                <select
                  value={formData.frontHeight}
                  onChange={(e) => setFormData({ ...formData, frontHeight: e.target.value as FrontHeight })}
                  required
                  className={selectClass}
                >
                  {Object.values(FrontHeight).map((height) => (
                    <option key={height} value={height}>{height}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Back Height *</label>
                <select
                  value={formData.backHeight}
                  onChange={(e) => setFormData({ ...formData, backHeight: e.target.value as BackHeight })}
                  required
                  className={selectClass}
                >
                  {Object.values(BackHeight).map((height) => (
                    <option key={height} value={height}>{height}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Front Hubs Material *</label>
                <select
                  value={formData.frontHubsMaterial}
                  onChange={(e) => setFormData({ ...formData, frontHubsMaterial: e.target.value as FrontHubsMaterial })}
                  required
                  className={selectClass}
                >
                  {Object.values(FrontHubsMaterial).map((material) => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Front Bar *</label>
                <select
                  value={formData.frontBar}
                  onChange={(e) => setFormData({ ...formData, frontBar: e.target.value as FrontBar })}
                  required
                  className={selectClass}
                >
                  {Object.values(FrontBar).map((bar) => (
                    <option key={bar} value={bar}>{bar}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Spindle *</label>
                <select
                  value={formData.spindle}
                  onChange={(e) => setFormData({ ...formData, spindle: e.target.value as Spindle })}
                  required
                  className={selectClass}
                >
                  {Object.values(Spindle).map((spindle) => (
                    <option key={spindle} value={spindle}>{spindle}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Caster *</label>
                <input
                  type="text"
                  value={formData.caster}
                  onChange={(e) => setFormData({ ...formData, caster: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Seat Position (cm) *</label>
                <input
                  type="text"
                  value={formData.seatPosition}
                  onChange={(e) => setFormData({ ...formData, seatPosition: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Conclusion */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className={sectionTitleClass}>Conclusion</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Lap Time</label>
                <input
                  type="text"
                  value={formData.lapTime || ''}
                  onChange={(e) => setFormData({ ...formData, lapTime: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Observation</label>
                <textarea
                  value={formData.observation || ''}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  rows={4}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-red-600 px-6 py-2 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded bg-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
