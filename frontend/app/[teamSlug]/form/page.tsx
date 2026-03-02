'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getLastSubmissionByEmail, createSubmission, getTeamConfig } from '@/lib/api';
import { Submission, SessionType, RearHubsMaterial, FrontHeight, BackHeight, FrontHubsMaterial, FrontBar, Spindle } from '@/types/submission';
import { TeamConfig } from '@/types/team';
import { TRANSLATIONS, Language } from '@/lib/translations';

// Default dropdown options (used when team config not available)
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

const DEFAULT_DIVISIONS = [
  'Micro', 'Mini', 'KA100 Jr', 'KA100 Sr', 'KA100 Master', 'Pro Shifter', 'Shifter Master',
  'X30 Junior', 'X30 Senior', 'ROK Micro', 'ROK Mini', 'VLR Junior', 'VLR Senior',
  'VLR Master', 'ROK Shifter', 'ROK Master', 'ROK Junior', 'ROK PRO GP',
  'ROK SV', 'Micro Max', 'Mini Max', 'Junior Max', 'Senior Max', 'Master Max', 'DD2',
  'DD2 Max', '206 Cadet', '206 Junior', '206 Senior', 'OKN', 'OKNJ', 'KZ2', 'KZ1', 'KZM', 'OK', 'OKJ'
];

// Region-specific dropdown data
const REGION_DATA: Record<string, { tracks: string[], championships: string[], divisions: string[] }> = {
  NorthAmerica: {
    tracks: DEFAULT_TRACKS,
    championships: DEFAULT_CHAMPIONSHIPS,
    divisions: DEFAULT_DIVISIONS,
  },
  CentralAmerica: {
    tracks: [],
    championships: [],
    divisions: [],
  },
  Brazil: {
    tracks: [
      'Granja Viana (SP)', 'Nova Odessa (SP)',
      'Interlagos', 'Aldeia da Serra (SP)',
      'San Marino (SP)', 'Speed Park (SP)',
      'Itu (SP)', 'Beto Carrero (SC)',
      'Velopark (RS)', 'Volta Redonda (RJ)',
      'Raceland (PR)', 'Serra (ES)',
      'Tarumã (RS)', 'Guapimirim (RJ)',
      'RBC Racing (MG)', 'Paladino (PB)',
      'Luigi Borghesi - Londrina (PR)', 'Imperatriz (MA)'
    ],
    championships: [
      'Copa SP Light', 'Copa SP Granja Viana', 'Copa do Brasil', 'Copa SpeedPark',
      'Campeonato Brasileiro', 'Open BRK', 'Open Copa', 'V11 Cup', 'Copa Beto Carrero', 'Campeonato Mineiro'
    ],
    divisions: [
      'Mirim', 'Cadete', 'Mini 2T', 'F4 Junior', 'OKNJ', 'OKN', 'F4 Graduados', 'F4 Senior',
      'Shifter', 'Shifter Master', 'Sprinter', 'Senior Am', 'Senior Pro', 'Super Senior', 'S60'
    ],
  },
  Europe: {
    tracks: [],
    championships: [],
    divisions: [],
  },
};

// Shifter divisions that use Gear Ratio instead of Sprockets
const SHIFTER_DIVISIONS = [
  'KZ1', 'KZ2', 'KZM', 'Pro Shifter', 'Shifter', 'Shifter Master', 'ROK Shifter', 'DD2', 'DD2 Master'
];

const DEFAULT_TYRE_MODELS = [
  'Mg Red', 'MG Cadet', 'Mg Yellow', 'MG Wet', 'Evinco Blue', 'Evinco Blue SKH2', 'Evinco Red SKM2',
  'Evinco WET', 'Levanto', 'Levanto WET', 'Bridgestone', 'Vega Red', 'Vega Blue',
  'Vega Yellow', 'Mojo D5', 'Mojo D2', 'Dunlop', 'Dunlop WET'
];

import { TRACK_LAYOUTS, TrackLayout } from '@/lib/trackLayouts';

// Racing-themed styling classes - using CSS variables for dynamic coloring
const inputClass = "mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-[var(--team-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--team-primary)]/50 hover:border-gray-600";
const selectClass = "mt-1 block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white backdrop-blur-sm transition-all focus:border-[var(--team-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--team-primary)]/50 hover:border-gray-600 cursor-pointer";
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
  const [configLoading, setConfigLoading] = useState(true);
  const [lang, setLang] = useState<Language>('en');
  const [selectedLayout, setSelectedLayout] = useState<string>('');
  const [helpModal, setHelpModal] = useState<'seatPosition' | 'seatInclination' | null>(null);

  // Load saved language preference on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('preferred_language') as Language;
    if (savedLang && ['en', 'es', 'pt'].includes(savedLang)) {
      setLang(savedLang);
    }
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('preferred_language', newLang);
  };

  const t = TRANSLATIONS[lang];

  // Helper to get label: override from Manager > Translation Dictionary > Fallback
  const getLabel = (key: keyof typeof t) => {
    return teamConfig?.customLabels?.[key] || t[key];
  };

  const isFieldEnabled = (key: string) => {
    return teamConfig?.formConfig?.enabledFields?.includes(key) ?? true;
  };

  // Fetch team configuration on mount
  useEffect(() => {
    if (teamSlug) {
      setConfigLoading(true);
      getTeamConfig(teamSlug)
        .then(config => {
          setTeamConfig(config);
        })
        .catch(error => {
          console.error('Error loading team config:', error);
        })
        .finally(() => {
          setConfigLoading(false);
        });
    }
  }, [teamSlug]);

  // Dynamic dropdown options from team config or region defaults
  const regionKey = teamConfig?.region || 'NorthAmerica';
  const regionDefaults = REGION_DATA[regionKey] || REGION_DATA.NorthAmerica;
  const TRACKS = teamConfig?.dropdownOptions?.tracks || regionDefaults.tracks;
  const CHAMPIONSHIPS = teamConfig?.dropdownOptions?.championships || regionDefaults.championships;
  const DIVISIONS = teamConfig?.dropdownOptions?.divisions || regionDefaults.divisions;
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
    seatInclination: '',
    lapTime: '',
    observation: '',
  });

  const handleEmailCheck = async () => {
    if (!email) return;
    setLoading(true);
    const submission = await getLastSubmissionByEmail(email, teamSlug);
    setLastSubmission(submission);
    if (submission) {
      const { observation, lapTime, track, ...rest } = submission;

      let parsedTrack = track || '';
      let parsedLayout = '';

      // Try to extract layout if it was saved as "Track Name - Layout Name"
      const matchedTrack = TRACKS.find((t) => track.startsWith(t));
      if (matchedTrack && track.length > matchedTrack.length) {
        parsedTrack = matchedTrack;
        parsedLayout = track.substring(matchedTrack.length).replace(/^ - /, '');
      }

      setSelectedLayout(parsedLayout);
      setFormData({ ...rest, track: parsedTrack, observation: '', lapTime: '' });

      if (submission.user) {
        setFirstName(submission.user.firstName || '');
        setLastName(submission.user.lastName || '');
      }
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
      const submissionData = { ...formData };

      // Append the layout name to the track cleanly for the database
      if (selectedLayout && submissionData.track && TRACK_LAYOUTS[submissionData.track]) {
        submissionData.track = `${submissionData.track} - ${selectedLayout}`;
      }

      await createSubmission(submissionData as Submission, email, firstName || '', lastName || '', teamSlug);
      router.push(`/${teamSlug}/form/success`);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert(error.message || 'Error submitting form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = 5;
  const stepNames = [t.driverInfo, t.engineSetup, t.tyresData, t.kartSetup, t.finalDetails];

  // Show loading screen while config is being fetched
  if (configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div
            className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-t-transparent mb-4"
            style={{ borderColor: teamConfig?.primaryColor || '#ef4444', borderTopColor: 'transparent' }}
          ></div>
          <p className="text-xl font-bold text-white uppercase tracking-wider">Loading Team Configuration...</p>
        </div>
      </div>
    );
  }

  const primaryColor = teamConfig?.primaryColor || '#ef4444';

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden"
      style={{ '--team-primary': primaryColor } as React.CSSProperties}
    >
      {/* Help Modal */}
      {helpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setHelpModal(null)}>
          <div className="relative bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-3xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <button type="button" className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors" onClick={() => setHelpModal(null)}>
              <span className="text-3xl">&times;</span>
            </button>
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <span className="text-2xl">📏</span>
              {helpModal === 'seatPosition' ? getLabel('seatPosition') : getLabel('seatInclination')} - Guide
            </h3>
            <div className="relative w-full rounded-xl overflow-hidden flex items-center justify-center bg-gray-800/50 border border-gray-700/50 p-2">
              <img
                src={helpModal === 'seatPosition' ? '/Ajuste de banco/Seat_Position.png' : '/Ajuste de banco/Seat_Inclination.png'}
                alt={helpModal}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpModal(null)}
                className="rounded-lg bg-gray-700 px-6 py-2 font-bold text-white uppercase tracking-wider transition-all hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Racing stripes background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-1 h-full bg-[var(--team-primary)] transform -skew-x-12"></div>
        <div className="absolute top-0 left-1/4 ml-4 w-1 h-full bg-[var(--team-primary)] transform -skew-x-12"></div>
        <div className="absolute top-0 right-1/4 w-1 h-full bg-[var(--team-primary)] transform -skew-x-12"></div>
        <div className="absolute top-0 right-1/4 mr-4 w-1 h-full bg-[var(--team-primary)] transform -skew-x-12"></div>
      </div>

      {/* Checkered flag top border */}
      <div
        className="h-2 w-full"
        style={{ background: `linear-gradient(to right, ${primaryColor}, transparent, ${primaryColor})` }}
      ></div>

      {/* Home Button */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 z-50 flex gap-2 md:gap-4">
        <Link
          href={`/${teamSlug}`}
          className="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/80 px-4 py-2 text-sm font-bold text-gray-300 uppercase tracking-wider backdrop-blur-md transition-all hover:text-white hover:shadow-lg group"
          style={{ '--hover-border': primaryColor } as any}
        >
          <style jsx>{`
            a:hover { border-color: var(--hover-border) !important; box-shadow: 0 0 15px rgba(239, 68, 68, 0.2); }
          `}</style>
          <span className="text-lg group-hover:scale-110 transition-transform">🏠</span>
          <span className="hidden md:inline">{t.home}</span>
        </Link>

        {/* Language Switcher */}
        <div className="flex bg-gray-900/80 rounded-full border border-gray-700 backdrop-blur-md overflow-hidden">
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`px-3 py-2 text-sm font-bold transition-colors ${lang === 'en' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            style={lang === 'en' ? { backgroundColor: `${primaryColor}4D` } : {}}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('es')}
            className={`px-3 py-2 text-sm font-bold border-l border-r border-gray-700 transition-colors ${lang === 'es' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            style={lang === 'es' ? { backgroundColor: `${primaryColor}4D` } : {}}
          >
            ES
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('pt')}
            className={`px-3 py-2 text-sm font-bold transition-colors ${lang === 'pt' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            style={lang === 'pt' ? { backgroundColor: `${primaryColor}4D` } : {}}
          >
            PT
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-24 pb-8 md:pt-12 md:pb-8">
        {/* Logo Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-4">
            <Image
              src={teamConfig?.logoUrl || '/psl-logo.png'}
              alt={teamConfig?.name || 'Team Logo'}
              width={300}
              height={120}
              className="drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              style={{ filter: `drop-shadow(0 0 15px ${primaryColor}4D)` }}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider uppercase">
            Setup <span style={{ color: primaryColor }}>Manager</span>
          </h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 w-full max-w-full overflow-hidden px-1">
          <div className="flex justify-between mb-2 w-full gap-1 sm:gap-2">
            {stepNames.map((name, index) => (
              <div
                key={name}
                className={`text-[9px] sm:text-xs text-center flex-1 w-0 leading-tight break-words font-bold uppercase tracking-tighter sm:tracking-wider transition-colors ${index + 1 <= currentStep ? 'opacity-100' : 'text-gray-600'
                  }`}
                style={index + 1 <= currentStep ? { color: primaryColor } : {}}
              >
                {name}
              </div>
            ))}
          </div>
          <div className="h-3 w-full rounded-full bg-gray-800 overflow-hidden border border-gray-700">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${(currentStep / totalSteps) * 100}%`, backgroundColor: primaryColor }}
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
          <div
            className="absolute top-0 left-8 right-8 h-1 rounded-full"
            style={{ background: `linear-gradient(to right, transparent, ${primaryColor}, transparent)` }}
          ></div>

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}33` }}
                >
                  <span className="text-2xl">🏎️</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{t.driverInfo}</h2>
              </div>

              <div>
                <label className={labelClass}>{getLabel('email')} *</label>
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
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                      style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
                    ></div>
                    <p className="text-sm font-medium" style={{ color: primaryColor }}>{t.checkingSetup}</p>
                  </div>
                )}
              </div>

              {lastSubmission && hasSetupChanged === null && (
                <div className="rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 p-6">
                  <p className="mb-4 font-semibold text-white text-lg">
                    🏁 {t.foundPrevious} <span className="text-red-400">{lastSubmission.championship}</span> - {lastSubmission.sessionType}, {lastSubmission.createdAt ? new Date(lastSubmission.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}, {lastSubmission.createdAt ? new Date(lastSubmission.createdAt).toLocaleDateString('en-GB') : 'last session'}
                  </p>
                  <p className="mb-4 text-gray-300">{t.hasSetupChanged}</p>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setHasSetupChanged(false);
                        setFormData({
                          ...lastSubmission,
                          sessionType: lastSubmission.sessionType,
                          observation: '',
                          lapTime: '',
                          tyreAge: '',
                        });
                        setCurrentStep(5);
                      }}
                      className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-green-500 px-6 py-3 font-bold text-white uppercase tracking-wider transition-all hover:from-green-500 hover:to-green-400 hover:shadow-lg hover:shadow-green-500/30"
                    >
                      ✓ {t.noSameSetup}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasSetupChanged(true);
                        setFormData({
                          ...lastSubmission,
                          sessionType: lastSubmission.sessionType,
                          observation: '',
                          lapTime: ''
                        });
                        // Stay on step 1 so the driver can change championship/track/division if needed
                      }}
                      className="flex-1 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 font-bold text-white uppercase tracking-wider transition-all hover:from-orange-500 hover:to-orange-400 hover:shadow-lg hover:shadow-orange-500/30"
                    >
                      ✎ {t.yesChanged}
                    </button>
                  </div>
                </div>
              )}

              {(!lastSubmission || hasSetupChanged === true) && (
                <div className="space-y-6">
                  {/* Name fields - Always show for new drivers, or when setup changed for returning drivers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{getLabel('firstName')} *</label>
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
                      <label className={labelClass}>{getLabel('lastName')} *</label>
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

                  {/* Info message for returning drivers who are changing setup */}
                  {hasSetupChanged === true && (
                    <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-4">
                      <p className="text-orange-400 font-semibold">
                        ✎ {t.modifyNotice}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>{getLabel('sessionType')} *</label>
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
                    <label className={labelClass}>{getLabel('track')} *</label>
                    <select
                      value={formData.track}
                      onChange={(e) => {
                        setFormData({ ...formData, track: e.target.value });
                        setSelectedLayout(''); // Reset layout when track changes
                      }}
                      required
                      className={selectClass}
                    >
                      <option value="">{t.selectTrack}</option>
                      {TRACKS.map((track) => (
                        <option key={track} value={track}>{track}</option>
                      ))}
                    </select>
                  </div>

                  {/* Track Layout Selection UI */}
                  {formData.track && TRACK_LAYOUTS[formData.track] && (
                    <div className="mt-4 relative rounded-xl border border-gray-700/50 bg-[#16161a] p-5 shadow-lg overflow-hidden">
                      {/* Subtle glowing top red gradient border simulator */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-90 shadow-[0_0_15px_rgba(239,68,68,0.8)] pointer-events-none"></div>

                      {/* Subtle background pattern, dotted/carbon-fiber style */}
                      <div className="absolute inset-0 opacity-[0.05] bg-[url('/checkered.png')] bg-cover mix-blend-overlay pointer-events-none"></div>

                      <div className="relative z-10 flex justify-between items-center mb-6">
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                          SELECT TRACK LAYOUT
                          {selectedLayout === '' && <span className="text-xs ml-2 opacity-80" style={{ color: primaryColor }}>*Required</span>}
                        </h3>
                        <span className="text-xs font-medium text-gray-400">Available: {TRACK_LAYOUTS[formData.track].length} Options</span>
                      </div>

                      <div className="relative z-10 flex gap-4 overflow-x-auto pb-4 snap-x">
                        {TRACK_LAYOUTS[formData.track].map((layout) => (
                          <button
                            key={layout.id}
                            type="button"
                            onClick={() => setSelectedLayout(layout.name)}
                            className={`relative min-w-[140px] md:min-w-[160px] h-[180px] flex-shrink-0 snap-start rounded-xl flex flex-col items-center justify-between p-4 transition-all duration-300 ${selectedLayout === layout.name
                              ? 'border-[1.5px] shadow-lg bg-[#1a1c23]'
                              : 'border border-gray-700/50 bg-[#1a1c23] hover:border-gray-500'
                              }`}
                            style={selectedLayout === layout.name ? { borderColor: primaryColor, boxShadow: `0 0 20px ${primaryColor}4D` } : {}}
                          >
                            <div className="w-full h-24 flex-grow flex items-center justify-center p-2">
                              {/* Optional visual placeholder icon */}
                              {layout.imageUrl ? (
                                <img
                                  src={layout.imageUrl}
                                  alt={layout.name}
                                  className={`max-w-full max-h-full object-contain transition-all duration-300 ${selectedLayout === layout.name
                                    ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] filter brightness-110'
                                    : 'opacity-50 grayscale'
                                    }`}
                                  onError={(e) => {
                                    // Fallback for missing images
                                    (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="${encodeURIComponent(primaryColor)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>`;
                                  }}
                                />
                              ) : (
                                <div className={`w-full h-full rounded border-2 border-dashed ${selectedLayout === layout.name ? 'border-red-500' : 'border-gray-600'}`}></div>
                              )}
                            </div>
                            <span className={`text-sm mt-2 font-medium tracking-wide transition-colors duration-300 ${selectedLayout === layout.name ? 'text-white' : 'text-gray-400'
                              }`}>
                              {layout.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>{getLabel('championship')} *</label>
                      <select
                        value={formData.championship}
                        onChange={(e) => setFormData({ ...formData, championship: e.target.value })}
                        required
                        className={selectClass}
                      >
                        <option value="">{t.selectChampionship}</option>
                        {CHAMPIONSHIPS.map((champ) => (
                          <option key={champ} value={champ}>{champ}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>{getLabel('division')} *</label>
                      <select
                        value={formData.division}
                        onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                        required
                        className={selectClass}
                      >
                        <option value="">{t.selectDivision}</option>
                        {DIVISIONS.map((div) => (
                          <option key={div} value={div}>{div}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (TRACK_LAYOUTS[formData.track || ''] && !selectedLayout) {
                        alert('Please select a track layout before continuing.');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    className="w-full rounded-lg px-8 py-4 font-bold text-white uppercase tracking-wider transition-all hover:shadow-lg flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {t.nextStep}
                    <span className="text-xl">→</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{t.engineSetup}</h2>
              </div>

              {isFieldEnabled('engineNumber') && (
                <div>
                  <label className={labelClass}>{getLabel('engineNumber')} *</label>
                  <input
                    type="text"
                    value={formData.engineNumber}
                    onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                    required
                    className={inputClass}
                    placeholder="Practice or Race (SERIAL NUMBER)"
                  />
                </div>
              )}

              {/* Show Gear Ratio for shifter classes */}
              {SHIFTER_DIVISIONS.includes(formData.division || '') && isFieldEnabled('gearRatio') && (
                <div>
                  <label className={labelClass}>{getLabel('gearRatio')} *</label>
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
                  {isFieldEnabled('driveSprocket') && (
                    <div>
                      <label className={labelClass}>{getLabel('driveSprocket')} *</label>
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
                  )}
                  {isFieldEnabled('drivenSprocket') && (
                    <div>
                      <label className={labelClass}>{getLabel('drivenSprocket')} *</label>
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
                  )}
                </div>
              )}
              {/* Show Carburator Number only for non-shifter classes */}
              {!SHIFTER_DIVISIONS.includes(formData.division || '') && isFieldEnabled('carburatorNumber') && (
                <div>
                  <label className={labelClass}>{getLabel('carburatorNumber')} *</label>
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

              {isFieldEnabled('sessionLaps') && (
                <div>
                  <label className={labelClass}>{getLabel('sessionLaps')} *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.sessionLaps || ''}
                    onChange={(e) => handleNumberChange('sessionLaps', e.target.value)}
                    required
                    className={inputClass}
                    placeholder="e.g., 10"
                  />
                </div>
              )}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 rounded-lg bg-gray-700 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:bg-gray-600"
                >
                  ← {t.back}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/30"
                >
                  {t.nextStep} →
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
                <h2 className="text-2xl font-bold text-white">{t.tyresData}</h2>
              </div>

              {isFieldEnabled('tyreModel') && (
                <div>
                  <label className={labelClass}>{getLabel('tyreModel')} *</label>
                  <select
                    value={formData.tyreModel}
                    onChange={(e) => setFormData({ ...formData, tyreModel: e.target.value })}
                    required
                    className={selectClass}
                  >
                    <option value="">{t.selectTyreModel}</option>
                    {TYRE_MODELS.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{getLabel('tyreAge')} *</label>
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
                  <label className={labelClass}>{getLabel('tyreColdPressure')} *</label>
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
                  ← {t.back}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/30"
                >
                  {t.nextStep} →
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
                <h2 className="text-2xl font-bold text-white">{t.kartSetup}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isFieldEnabled('chassis') && (
                  <div>
                    <label className={labelClass}>{getLabel('chassis')} *</label>
                    <input
                      type="text"
                      value={formData.chassis}
                      onChange={(e) => setFormData({ ...formData, chassis: e.target.value })}
                      required
                      className={inputClass}
                      placeholder="Model or Serial Number"
                    />
                  </div>
                )}
                {isFieldEnabled('axle') && (
                  <div>
                    <label className={labelClass}>{getLabel('axle')} *</label>
                    <input
                      type="text"
                      value={formData.axle}
                      onChange={(e) => setFormData({ ...formData, axle: e.target.value })}
                      required
                      className={inputClass}
                      placeholder="e.g., F1020, M1040"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isFieldEnabled('axleSize') && (
                  <div>
                    <label className={labelClass}>{getLabel('axleSize')} *</label>
                    <input
                      type="text"
                      value={formData.axleSize || ''}
                      onChange={(e) => setFormData({ ...formData, axleSize: e.target.value })}
                      required
                      className={inputClass}
                      placeholder="e.g., 1040"
                    />
                  </div>
                )}
                {isFieldEnabled('rearTrackWidth') && (
                  <div>
                    <label className={labelClass}>{getLabel('rearTrackWidth')} *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.rearTrackWidth || ''}
                      onChange={(e) => handleNumberChange('rearTrackWidth', e.target.value)}
                      required
                      className={inputClass}
                      placeholder="e.g., 139"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isFieldEnabled('rearHubsMaterial') && (
                  <div>
                    <label className={labelClass}>{getLabel('rearHubsMaterial')} *</label>
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
                )}
                {isFieldEnabled('rearHubsLength') && (
                  <div>
                    <label className={labelClass}>{getLabel('rearHubsLength')} *</label>
                    <input
                      type="text"
                      value={formData.rearHubsLength}
                      onChange={(e) => setFormData({ ...formData, rearHubsLength: e.target.value })}
                      required
                      className={inputClass}
                      placeholder="e.g., 75mm"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isFieldEnabled('frontHeight') && (
                  <div>
                    <label className={labelClass}>{getLabel('frontHeight')} *</label>
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
                )}
                {isFieldEnabled('backHeight') && (
                  <div>
                    <label className={labelClass}>{getLabel('backHeight')} *</label>
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
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isFieldEnabled('frontHubsMaterial') && (
                  <div>
                    <label className={labelClass}>{getLabel('frontHubsMaterial')} *</label>
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
                )}
                {isFieldEnabled('frontHubsLength') && (
                  <div>
                    <label className={labelClass}>{getLabel('frontHubsLength')} *</label>
                    <input
                      type="text"
                      value={formData.frontHubsLength || ''}
                      onChange={(e) => setFormData({ ...formData, frontHubsLength: e.target.value })}
                      required
                      className={inputClass}
                      placeholder="e.g., 90mm"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isFieldEnabled('frontBar') && (
                  <div>
                    <label className={labelClass}>{getLabel('frontBar')} *</label>
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
                )}
                {isFieldEnabled('spindle') && (
                  <div>
                    <label className={labelClass}>{getLabel('spindle')} *</label>
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
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isFieldEnabled('caster') && (
                  <div>
                    <label className={labelClass}>{getLabel('caster')} *</label>
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
                )}
                {isFieldEnabled('camber') && (
                  <div>
                    <label className={labelClass}>{getLabel('camber')} *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.camber || ''}
                      onChange={(e) => handleNumberChange('camber', e.target.value)}
                      required
                      className={inputClass}
                      placeholder="e.g., -4"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isFieldEnabled('seatPosition') && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">{getLabel('seatPosition')} *</label>
                      {teamConfig?.name?.toLowerCase().includes('bravar') && (
                        <button
                          type="button"
                          onClick={() => setHelpModal('seatPosition')}
                          className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors border border-gray-600"
                          title="How to measure"
                        >
                          ?
                        </button>
                      )}
                    </div>
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
                )}
                {isFieldEnabled('seatInclination') && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-sm font-bold text-gray-300 uppercase tracking-wider">{getLabel('seatInclination')} *</label>
                      {teamConfig?.name?.toLowerCase().includes('bravar') && (
                        <button
                          type="button"
                          onClick={() => setHelpModal('seatInclination')}
                          className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors border border-gray-600"
                          title="How to measure"
                        >
                          ?
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.seatInclination || ''}
                      onChange={(e) => handleNumberChange('seatInclination', e.target.value)}
                      required
                      className={inputClass}
                      placeholder="e.g. 15 degrees"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 rounded-lg bg-gray-700 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:bg-gray-600"
                >
                  ← {t.back}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/30"
                >
                  {t.nextStep} →
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
                <h2 className="text-2xl font-bold text-white">{t.finalDetails}</h2>
              </div>

              {hasSetupChanged === false && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 mb-6">
                  <p className="text-green-400 font-semibold">✓ {t.usingPrevious}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{getLabel('sessionType')} *</label>
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
                  <label className={labelClass}>{getLabel('tyreColdPressure')} *</label>
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

              {hasSetupChanged === false && (
                <div>
                  <label className={labelClass}>{getLabel('tyreAge')} *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.tyreAge || ''}
                    onChange={(e) => handleNumberChange('tyreAge', e.target.value)}
                    required
                    className={inputClass}
                    placeholder="e.g., 2"
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>{getLabel('lapTime')}</label>
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
                <label className={labelClass}>{getLabel('observation')}</label>
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
                  ← {t.back}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:from-green-500 hover:to-green-400 hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  )}
                  {submitting ? t.submitting : `🏁 ${t.submit}`}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-xs">
          <p>Powered by <a href="https://overcutacademy.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Overcut Academy</a></p>
        </div>
      </div>
    </div>
  );
}
