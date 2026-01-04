'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getLastSubmissionByEmail, createSubmission, getTeamConfig } from '@/lib/api';
import { Submission, SessionType, RearHubsMaterial, FrontHeight, BackHeight, FrontHubsMaterial, FrontBar, Spindle } from '@/types/submission';
import { TeamConfig } from '@/types/team';

// Default dropdown options (used when team config not available)
const DEFAULT_TRACKS = [
  'AMR Motorplex', 'AMR Motorplex CCW', 'Orlando', 'Orlando CCW', 'Speedsportz Piquet',
  'St Pete', 'New Castle', 'New Castle Sharkfin', 'New Castle CCW', 'ROK Rio 2024',
  'Las Vegas Motor Speedway 2023', 'Charlotte Speedway', 'MCC Cinccinati', 'PittRace Trackhouse',
  'Supernats 2024', 'Quaker City', 'ROK Rio 2025', 'Supernats 2025',
  'Hamilton', 'Tremblant', 'Icar SH Karting', 'Mosport', 'Portimao'
];

const DEFAULT_CHAMPIONSHIPS = [
  'Skusa Winter Series', 'Florida Winter Tour', 'Rotax Winter Trophy', 'Pro Tour',
  'Skusa Vegas', 'ROK Vegas', 'Stars Championship Series', 'Rotax US East Trophy',
  'Rotax US Final', 'Canada National', 'Champions of the Future', 'World Championship',
  'Supernats 2024', 'Coupe de Montreal', 'Canadian Open', 'Supernats 2025'
];

const DEFAULT_DIVISIONS = [
  'Micro', 'Mini', 'KA100 Jr', 'KA100 Sr', 'KA100 Master', 'Pro Shifter', 'Shifter Master',
  'X30 Junior', 'X30 Senior', 'ROK Micro', 'ROK Mini', 'VLR Junior', 'VLR Senior',
  'VLR Master', 'ROK Shifter', 'ROK Master', 'ROK Junior', 'ROK PRO GP',
  'ROK SV', 'Micro Max', 'Mini Max', 'Junior Max', 'Senior Max', 'Master Max', 'DD2',
  'DD2 Master', '206 Cadet', '206 Junior', '206 Senior', 'OKN', 'OKNJ', 'KZ2', 'KZ1', 'KZM', 'OK', 'OKJ'
];

// Shifter divisions that use Gear Ratio instead of Sprockets
const SHIFTER_DIVISIONS = [
  'KZ1', 'KZ2', 'KZM', 'Pro Shifter', 'Shifter Master', 'ROK Shifter', 'DD2', 'DD2 Master'
];

const DEFAULT_TYRE_MODELS = [
  'Mg Red', 'Mg Yellow', 'MG Wet', 'Evinco Blue', 'Evinco Blue SKH2', 'Evinco Red SKM2',
  'Evinco WET', 'Levanto', 'Levanto WET', 'Bridgestone', 'Vega Red', 'Vega Blue',
  'Vega Yellow', 'Mojo D5', 'Mojo D2', 'Dunlop', 'Dunlop WET'
];

// Racing-themed styling classes
const inputClass = "mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 hover:border-gray-600";
const selectClass = "mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white backdrop-blur-sm transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 hover:border-gray-600 cursor-pointer";
const labelClass = "block text-sm font-bold text-gray-300 uppercase tracking-wider";

export default function FormPage() {
  const router = useRouter();
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const [currentStep, setCurrentStep] = useState(1);
  const [hasSetupChanged, setHasSetupChanged] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [teamConfig, setTeamConfig] = useState<TeamConfig | null>(null);

  // Fetch team configuration on mount
  useEffect(() => {
    if (teamSlug) {
      getTeamConfig(teamSlug).then(config => {
        setTeamConfig(config);
      });
    }
  }, [teamSlug]);

  // Dynamic dropdown options from team config or defaults
  const TRACKS = teamConfig?.dropdownOptions?.tracks || DEFAULT_TRACKS;
  const CHAMPIONSHIPS = teamConfig?.dropdownOptions?.championships || DEFAULT_CHAMPIONSHIPS;
  const DIVISIONS = teamConfig?.dropdownOptions?.divisions || DEFAULT_DIVISIONS;
  const TYRE_MODELS = teamConfig?.dropdownOptions?.tyreModels || DEFAULT_TYRE_MODELS;

  const [formData, setFormData] = useState<Partial<Submission>>({
    sessionType: SessionType.Practice1,
    track: '',
    championship: '',
    division: '',
    engineNumber: '',
    gearRatio: '',
    driveSprocket: '',
    drivenSprocket: '',
    carburatorNumber: '',
    tyreModel: '',
    tyreAge: '',
    tyreColdPressure: '',
    chassis: '',
    axle: '',
    rearHubsMaterial: RearHubsMaterial.Aluminium,
    rearHubsLength: '',
    frontHeight: FrontHeight.Standard,
    backHeight: BackHeight.Standard,
    frontHubsMaterial: FrontHubsMaterial.Aluminium,
    frontBar: FrontBar.Standard,
    spindle: Spindle.Standard,
    caster: '',
    seatPosition: '',
    lapTime: '',
    observation: '',
  });

  const handleEmailCheck = async () => {
    if (!email) return;
    setLoading(true);
    const submission = await getLastSubmissionByEmail(email, teamSlug);
    setLastSubmission(submission);
    if (submission) {
      setFormData(submission);
    }
    setLoading(false);
  };

  const handleNumberChange = (field: keyof Submission, value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    const sanitizedValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleanValue;
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      alert('Please enter your email address');
      return;
    }

    if (!lastSubmission && (!firstName || !lastName)) {
      alert('Please enter your first and last name');
      return;
    }

    setSubmitting(true);
    try {
      await createSubmission(formData as Submission, email, firstName || '', lastName || '', teamSlug);
      router.push(`/${teamSlug}/form/success`);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert(error.message || 'Error submitting form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = 5;
  const stepNames = ['Driver Info', 'Engine', 'Tyres', 'Chassis', 'Submit'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Racing stripes background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
        <div className="absolute top-0 left-1/4 ml-4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
        <div className="absolute top-0 right-1/4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
        <div className="absolute top-0 right-1/4 mr-4 w-1 h-full bg-red-600 transform -skew-x-12"></div>
      </div>

      {/* Checkered flag top border */}
      <div className="h-2 w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600"></div>

      {/* Home Button */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/80 px-4 py-2 text-sm font-bold text-gray-300 uppercase tracking-wider backdrop-blur-md transition-all hover:border-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20 group"
      >
        <span className="text-lg group-hover:scale-110 transition-transform">🏠</span>
        <span className="hidden md:inline">Teams</span>
      </Link>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8">
        {/* Logo Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4">
            <Image
              src={teamConfig?.logoUrl || '/psl-logo.png'}
              alt={teamConfig?.name || 'Team Logo'}
              width={300}
              height={120}
              className="drop-shadow-[0_0_30px_rgba(227,24,55,0.5)]"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider uppercase">
            Setup <span style={{ color: teamConfig?.primaryColor || '#ef4444' }}>Manager</span>
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {stepNames.map((name, index) => (
              <div
                key={name}
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${index + 1 <= currentStep ? 'text-red-500' : 'text-gray-600'
                  }`}
              >
                {name}
              </div>
            ))}
          </div>
          <div className="h-3 w-full rounded-full bg-gray-800 overflow-hidden border border-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500 ease-out relative"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
            </div>
          </div>
          <div className="mt-2 text-center text-sm text-gray-400">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="rounded-2xl bg-gray-900/80 border border-gray-800 p-5 md:p-8 shadow-2xl backdrop-blur-xl">
          {/* Racing accent line */}
          <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full"></div>

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl">🏎️</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Driver Information</h2>
              </div>

              <div>
                <label className={labelClass}>Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailCheck}
                  required
                  className={inputClass}
                  placeholder="your@email.com"
                />
                {loading && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                    <p className="text-sm text-red-400">Checking for previous setup...</p>
                  </div>
                )}
              </div>

              {lastSubmission && hasSetupChanged === null && (
                <div className="rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 p-6">
                  <p className="mb-4 font-semibold text-white text-lg">
                    🏁 Found previous setup from <span className="text-red-400">{lastSubmission.championship}</span> - {lastSubmission.sessionType}, {lastSubmission.createdAt ? new Date(lastSubmission.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}, {lastSubmission.createdAt ? new Date(lastSubmission.createdAt).toLocaleDateString('en-GB') : 'last session'}
                  </p>
                  <p className="mb-4 text-gray-300">Has your setup changed since then?</p>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setHasSetupChanged(false);
                        setFormData({
                          ...lastSubmission,
                          sessionType: formData.sessionType || lastSubmission.sessionType,
                        });
                        setCurrentStep(5);
                      }}
                      className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-green-500 px-6 py-3 font-bold text-white uppercase tracking-wider transition-all hover:from-green-500 hover:to-green-400 hover:shadow-lg hover:shadow-green-500/30"
                    >
                      ✓ No, Same Setup
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasSetupChanged(true);
                        setFormData({
                          ...lastSubmission,
                          sessionType: formData.sessionType || lastSubmission.sessionType,
                        });
                        // Stay on step 1 so the driver can change championship/track/division if needed
                      }}
                      className="flex-1 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 font-bold text-white uppercase tracking-wider transition-all hover:from-orange-500 hover:to-orange-400 hover:shadow-lg hover:shadow-orange-500/30"
                    >
                      ✎ Yes, Changed
                    </button>
                  </div>
                </div>
              )}

              {(!lastSubmission || hasSetupChanged === true) && (
                <>
                  {/* Show name fields only for new drivers (no last submission) */}
                  {!lastSubmission && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>First Name *</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className={inputClass}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Last Name *</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className={inputClass}
                          placeholder="Speed"
                        />
                      </div>
                    </div>
                  )}

                  {/* Info message for returning drivers who are changing setup */}
                  {hasSetupChanged === true && (
                    <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-4">
                      <p className="text-orange-400 font-semibold">
                        ✎ Modify your setup details below. You can change the championship, track, or division if needed.
                      </p>
                    </div>
                  )}

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
                      <option value="">Select Track</option>
                      {TRACKS.map((track) => (
                        <option key={track} value={track}>{track}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Championship *</label>
                      <select
                        value={formData.championship}
                        onChange={(e) => setFormData({ ...formData, championship: e.target.value })}
                        required
                        className={selectClass}
                      >
                        <option value="">Select Championship</option>
                        {CHAMPIONSHIPS.map((champ) => (
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
                        <option value="">Select Division</option>
                        {DIVISIONS.map((div) => (
                          <option key={div} value={div}>{div}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-8 py-4 font-bold text-white uppercase tracking-wider transition-all hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    Next Step
                    <span className="text-xl">→</span>
                  </button>
                </>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Engine Setup</h2>
              </div>

              <div>
                <label className={labelClass}>Engine Number *</label>
                <input
                  type="text"
                  value={formData.engineNumber}
                  onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                  required
                  className={inputClass}
                  placeholder="Practice or Race (SERIAL NUMBER)"
                />
              </div>

              {/* Show Gear Ratio for shifter classes */}
              {SHIFTER_DIVISIONS.includes(formData.division || '') && (
                <div>
                  <label className={labelClass}>Gear Ratio *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.gearRatio || ''}
                    onChange={(e) => handleNumberChange('gearRatio', e.target.value)}
                    required
                    className={inputClass}
                    placeholder="e.g., 2.66"
                  />
                </div>
              )}

              {/* Show Sprockets for non-shifter classes */}
              {!SHIFTER_DIVISIONS.includes(formData.division || '') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Drive Sprocket (Engine) *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.driveSprocket}
                      onChange={(e) => handleNumberChange('driveSprocket', e.target.value)}
                      required
                      className={inputClass}
                      placeholder="e.g., 11"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Driven Sprocket (Gear) *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.drivenSprocket}
                      onChange={(e) => handleNumberChange('drivenSprocket', e.target.value)}
                      required
                      className={inputClass}
                      placeholder="e.g., 78"
                    />
                  </div>
                </div>
              )}
              {/* Show Carburator Number only for non-shifter classes */}
              {!SHIFTER_DIVISIONS.includes(formData.division || '') && (
                <div>
                  <label className={labelClass}>Carburator Number *</label>
                  <input
                    type="text"
                    value={formData.carburatorNumber}
                    onChange={(e) => setFormData({ ...formData, carburatorNumber: e.target.value })}
                    required
                    className={inputClass}
                    placeholder="e.g., CARB-001"
                  />
                </div>
              )}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 rounded-lg bg-gray-700 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:bg-gray-600"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/30"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl">🛞</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Tyres Data</h2>
              </div>

              <div>
                <label className={labelClass}>Tyre Model *</label>
                <select
                  value={formData.tyreModel}
                  onChange={(e) => setFormData({ ...formData, tyreModel: e.target.value })}
                  required
                  className={selectClass}
                >
                  <option value="">Select Tyre Model</option>
                  {TYRE_MODELS.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tyre Age *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.tyreAge}
                    onChange={(e) => handleNumberChange('tyreAge', e.target.value)}
                    required
                    className={inputClass}
                    placeholder="e.g., 2"
                  />
                </div>
                <div>
                  <label className={labelClass}>Tyre Cold Pressure *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.tyreColdPressure}
                    onChange={(e) => handleNumberChange('tyreColdPressure', e.target.value)}
                    required
                    className={inputClass}
                    placeholder="e.g., 9.5"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 rounded-lg bg-gray-700 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:bg-gray-600"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/30"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl">🔧</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Kart Setup</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Chassis *</label>
                  <input
                    type="text"
                    value={formData.chassis}
                    onChange={(e) => setFormData({ ...formData, chassis: e.target.value })}
                    required
                    className={inputClass}
                    placeholder="Model or Serial Number"
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
                    placeholder="e.g., F1020, M1040"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="e.g., 75mm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    inputMode="decimal"
                    value={formData.caster}
                    onChange={(e) => handleNumberChange('caster', e.target.value)}
                    required
                    className={inputClass}
                    placeholder="e.g., 28"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Seat Position [cm] *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.seatPosition}
                  onChange={(e) => handleNumberChange('seatPosition', e.target.value)}
                  required
                  className={inputClass}
                  placeholder="e.g. 62.5"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 rounded-lg bg-gray-700 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:bg-gray-600"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/30"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-2xl">🏁</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Final Details</h2>
              </div>

              {hasSetupChanged === false && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 mb-6">
                  <p className="text-green-400 font-semibold">✓ Using your previous setup. Update session details below and submit!</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className={labelClass}>Tyre Cold Pressure *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.tyreColdPressure || ''}
                    onChange={(e) => handleNumberChange('tyreColdPressure', e.target.value)}
                    required
                    className={inputClass}
                    placeholder="e.g., 9.5"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Lap Time</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.lapTime || ''}
                  onChange={(e) => handleNumberChange('lapTime', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., 45.123"
                />
              </div>
              <div>
                <label className={labelClass}>Observation / Notes</label>
                <textarea
                  value={formData.observation || ''}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  rows={4}
                  className={inputClass}
                  placeholder="Any additional notes about the session..."
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(hasSetupChanged === false ? 1 : 4)}
                  className="flex-1 rounded-lg bg-gray-700 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:bg-gray-600"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:from-green-500 hover:to-green-400 hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  )}
                  {submitting ? 'Submitting...' : '🏁 Submit Setup'}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-xs">
          <p>Powered by <a href="https://undercutacademy.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Undercut Academy</a></p>
        </div>
      </div>
    </div>
  );
}
