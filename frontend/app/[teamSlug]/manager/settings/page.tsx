'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    getTeamConfig,
    updateTeamConfig,
    addTeamManager,
    listTeamManagers,
    deleteTeamManager,
    resendManagerAccess,
    addTeamDriver,
    listTeamDrivers,
    deleteTeamDriver,
    resendDriverAccess,
    setSuperuserAccess,
} from '@/lib/api';
import { TeamConfig, TeamManager, TeamDriver, SuperuserAccessDuration } from '@/types/team';
import { TRANSLATIONS, Language } from '@/lib/translations';

function formatExpiry(expiresAt: string | null | undefined): string | null {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return null;
    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

const ALL_FIELD_KEYS = [
    'engineNumber', 'gearRatio', 'driveSprocket', 'drivenSprocket', 'carburatorNumber', 'sessionLaps', 'sparkplugType', 'sparkplugGap',
    'tyreModel', 'tyreAge',
    'chassis', 'axle', 'axleSize', 'rearHubsMaterial', 'rearHubsLength', 'kartRearWidth', 'frontHeight', 'backHeight',
    'frontHubsMaterial', 'frontHubsLength', 'frontBar', 'spindle', 'caster', 'camber', 'seatPosition', 'seatInclination', 'frontWheelType'
];

export default function ManagerSettings() {
    const params = useParams();
    const router = useRouter();
    const teamSlug = params.teamSlug as string;
    const [config, setConfig] = useState<TeamConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [enabledFields, setEnabledFields] = useState<string[]>([]);
    const [region, setRegion] = useState<string>('NorthAmerica');
    const [tyreAgeMode, setTyreAgeMode] = useState<'sessions' | 'laps'>('sessions');
    const [tyrePressureMode, setTyrePressureMode] = useState<'lowest' | 'four'>('lowest');
    const [lang, setLang] = useState<Language>('en');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberFirstName, setNewMemberFirstName] = useState('');
    const [newMemberLastName, setNewMemberLastName] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<'manager' | 'driver'>('driver');
    const [addingMember, setAddingMember] = useState(false);
    const [addMemberMessage, setAddMemberMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Superuser access toggle state
    const [superuserExpiresAt, setSuperuserExpiresAt] = useState<string | null>(null);
    const [superuserDuration, setSuperuserDuration] = useState<SuperuserAccessDuration>('24h');
    const [savingSuperuserAccess, setSavingSuperuserAccess] = useState(false);
    const [superuserMessage, setSuperuserMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [now, setNow] = useState<number>(Date.now());

    // Team members: managers (visible to owner/superadmin only) + drivers (visible to any manager)
    const [managers, setManagers] = useState<TeamManager[]>([]);
    const [managersLoading, setManagersLoading] = useState(false);
    const [drivers, setDrivers] = useState<TeamDriver[]>([]);
    const [driversLoading, setDriversLoading] = useState(false);
    const [memberActionId, setMemberActionId] = useState<string | null>(null);
    const [memberListMessage, setMemberListMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const canManageTeam = isOwner || isSuperAdmin;
    const superuserActive = !!superuserExpiresAt && new Date(superuserExpiresAt).getTime() > now;
    const expiryLabel = superuserActive ? formatExpiry(superuserExpiresAt) : null;

    useEffect(() => {
        const userStr = localStorage.getItem('managerUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.isDriver === true && user.isManager !== true) {
                    router.replace(`/${teamSlug}/manager/dashboard`);
                    return;
                }
                setIsSuperAdmin(user.isSuperAdmin === true);
                setIsOwner(user.isOwner === true);
                setCurrentUserId(user.id || null);
            } catch {}
        }
    }, []);

    // Tick the countdown once a minute while access is active
    useEffect(() => {
        if (!superuserActive) return;
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, [superuserActive]);

    // Auto-dismiss success messages after 5s so the page doesn't accumulate stale banners
    useEffect(() => {
        if (memberListMessage?.type !== 'success') return;
        const t = setTimeout(() => setMemberListMessage(null), 5000);
        return () => clearTimeout(t);
    }, [memberListMessage]);
    useEffect(() => {
        if (superuserMessage?.type !== 'success') return;
        const t = setTimeout(() => setSuperuserMessage(null), 5000);
        return () => clearTimeout(t);
    }, [superuserMessage]);
    useEffect(() => {
        if (addMemberMessage?.type !== 'success') return;
        const t = setTimeout(() => setAddMemberMessage(null), 5000);
        return () => clearTimeout(t);
    }, [addMemberMessage]);

    const loadManagers = async () => {
        if (!canManageTeam) return;
        setManagersLoading(true);
        try {
            const list = await listTeamManagers(teamSlug);
            setManagers(list);
        } catch (err: any) {
            console.error('Error loading managers:', err);
            setMemberListMessage({ type: 'error', text: err.message || 'Failed to load managers' });
        } finally {
            setManagersLoading(false);
        }
    };

    useEffect(() => {
        if (canManageTeam) loadManagers();
    }, [canManageTeam, teamSlug]);

    const handleToggleSuperuser = async (enable: boolean) => {
        setSavingSuperuserAccess(true);
        setSuperuserMessage(null);
        try {
            const result = await setSuperuserAccess(teamSlug, enable ? superuserDuration : null);
            setSuperuserExpiresAt(result.superuserAccessExpiresAt);
            setNow(Date.now());
            setSuperuserMessage({
                type: 'success',
                text: enable ? 'Superuser access enabled.' : 'Superuser access disabled.',
            });
        } catch (err: any) {
            setSuperuserMessage({ type: 'error', text: err.message || 'Failed to update access' });
        } finally {
            setSavingSuperuserAccess(false);
        }
    };

    const handleResendAccess = async (manager: TeamManager) => {
        if (!confirm(`Send a new password to ${manager.email}? Their current password will stop working.`)) return;
        setMemberActionId(manager.id);
        setMemberListMessage(null);
        try {
            const res = await resendManagerAccess(teamSlug, manager.id);
            setMemberListMessage({ type: 'success', text: res.message });
            await loadManagers();
        } catch (err: any) {
            setMemberListMessage({ type: 'error', text: err.message || 'Failed to resend access' });
        } finally {
            setMemberActionId(null);
        }
    };

    const handleDeleteManager = async (manager: TeamManager) => {
        if (!confirm(`Remove ${manager.firstName} ${manager.lastName} from this team? They will no longer be able to log in.`)) return;
        setMemberActionId(manager.id);
        setMemberListMessage(null);
        try {
            await deleteTeamManager(teamSlug, manager.id);
            setMemberListMessage({ type: 'success', text: `${manager.email} removed.` });
            await loadManagers();
        } catch (err: any) {
            setMemberListMessage({ type: 'error', text: err.message || 'Failed to remove manager' });
        } finally {
            setMemberActionId(null);
        }
    };

    const loadDrivers = async () => {
        setDriversLoading(true);
        try {
            const list = await listTeamDrivers(teamSlug);
            setDrivers(list);
        } catch (err: any) {
            console.error('Error loading drivers:', err);
            setMemberListMessage({ type: 'error', text: err.message || 'Failed to load drivers' });
        } finally {
            setDriversLoading(false);
        }
    };

    useEffect(() => {
        loadDrivers();
    }, [teamSlug]);

    const handleResendDriverAccess = async (driver: TeamDriver) => {
        if (!confirm(`Send a new password to ${driver.email}? Their current password will stop working.`)) return;
        setMemberActionId(driver.id);
        setMemberListMessage(null);
        try {
            const res = await resendDriverAccess(teamSlug, driver.id);
            setMemberListMessage({ type: 'success', text: res.message });
            await loadDrivers();
        } catch (err: any) {
            setMemberListMessage({ type: 'error', text: err.message || 'Failed to resend access' });
        } finally {
            setMemberActionId(null);
        }
    };

    const handleDeleteDriver = async (driver: TeamDriver) => {
        if (!confirm(`Remove ${driver.firstName} ${driver.lastName}'s dashboard access? Their setups stay visible to managers, but they will no longer be able to log in.`)) return;
        setMemberActionId(driver.id);
        setMemberListMessage(null);
        try {
            await deleteTeamDriver(teamSlug, driver.id);
            setMemberListMessage({ type: 'success', text: `${driver.email} removed.` });
            await loadDrivers();
        } catch (err: any) {
            setMemberListMessage({ type: 'error', text: err.message || 'Failed to remove driver' });
        } finally {
            setMemberActionId(null);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingMember(true);
        setAddMemberMessage(null);

        try {
            const memberData = {
                email: newMemberEmail,
                firstName: newMemberFirstName,
                lastName: newMemberLastName,
            };
            const result = newMemberRole === 'manager'
                ? await addTeamManager(teamSlug, memberData)
                : await addTeamDriver(teamSlug, memberData);
            setAddMemberMessage({ type: 'success', text: result.message });
            setNewMemberEmail('');
            setNewMemberFirstName('');
            setNewMemberLastName('');
            if (newMemberRole === 'manager') await loadManagers();
            else await loadDrivers();
        } catch (err: any) {
            setAddMemberMessage({ type: 'error', text: err.message || `Failed to add ${newMemberRole}` });
        } finally {
            setAddingMember(false);
        }
    };

    // Combined rows for the Team Access card. Managers are only listed for
    // owners/superadmins (the backend rejects the listing for anyone else).
    type MemberRow =
        | (TeamManager & { kind: 'manager' })
        | (TeamDriver & { kind: 'driver' });
    const members: MemberRow[] = [
        ...(canManageTeam ? managers.map((m) => ({ ...m, kind: 'manager' as const })) : []),
        ...drivers.map((d) => ({ ...d, kind: 'driver' as const })),
    ];
    const membersLoading = managersLoading || driversLoading;

    useEffect(() => {
        const savedLang = localStorage.getItem('preferred_language') as Language;
        if (savedLang && ['en', 'es', 'pt', 'it'].includes(savedLang)) {
            setLang(savedLang);
        }
    }, []);

    const handleLanguageChange = (newLang: Language) => {
        setLang(newLang);
        localStorage.setItem('preferred_language', newLang);
    };

    const t = TRANSLATIONS[lang];

    useEffect(() => {
        loadConfig();
    }, [teamSlug]);

    const loadConfig = async () => {
        try {
            const teamConfig = await getTeamConfig(teamSlug);
            if (teamConfig) {
                setConfig(teamConfig);

                // Start by assuming everything is checked if they haven't explicitly set up a builder config
                const hasExplicitBuilderConfig = teamConfig.formConfig && teamConfig.formConfig.enabledFields;

                if (hasExplicitBuilderConfig && teamConfig.formConfig.enabledFields.length > 0) {
                    setEnabledFields(teamConfig.formConfig.enabledFields);
                } else {
                    setEnabledFields(ALL_FIELD_KEYS);
                }

                if (teamConfig.region) {
                    setRegion(teamConfig.region);
                }

                setSuperuserExpiresAt(teamConfig.superuserAccessExpiresAt ?? null);

                if (teamConfig.formConfig?.tyreAgeMode) {
                    setTyreAgeMode(teamConfig.formConfig.tyreAgeMode);
                }
                if (teamConfig.formConfig?.tyrePressureMode) {
                    setTyrePressureMode(teamConfig.formConfig.tyrePressureMode);
                }
            }
        } catch (error) {
            console.error('Error loading config:', error);
            alert('Failed to load team configuration.');
        } finally {
            setLoading(false);
        }
    };

    const toggleField = (key: string) => {
        setEnabledFields((prev) =>
            prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!config) return;

        setSaving(true);
        try {
            const updatedFormConfig = {
                ...config.formConfig,
                enabledFields,
                tyreAgeMode,
                tyrePressureMode,
            };
            await updateTeamConfig(teamSlug, {
                formConfig: updatedFormConfig,
                region: region
            });
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Grouping the toggleable fields by section for better UX
    const fieldGroups = [
        {
            title: t.engineSetup,
            fields: [
                { key: 'engineNumber', label: t.engineNumber },
                { key: 'gearRatio', label: t.gearRatio },
                { key: 'driveSprocket', label: t.driveSprocket },
                { key: 'drivenSprocket', label: t.drivenSprocket },
                { key: 'carburatorNumber', label: t.carburatorNumber },
                { key: 'sessionLaps', label: t.sessionLaps },
                { key: 'sparkplugType', label: t.sparkplugType },
                { key: 'sparkplugGap', label: t.sparkplugGap }
            ]
        },
        {
            title: t.tyresData,
            fields: [
                { key: 'tyreModel', label: t.tyreModel },
                { key: 'tyreAge', label: t.tyreAge }
            ]
        },
        {
            title: t.kartSetup,
            fields: [
                { key: 'chassis', label: t.chassis },
                { key: 'axle', label: t.axle },
                { key: 'axleSize', label: t.axleSize },
                { key: 'rearHubsMaterial', label: t.rearHubsMaterial },
                { key: 'rearHubsLength', label: t.rearHubsLength },
                { key: 'kartRearWidth', label: t.kartRearWidth },
                { key: 'frontHeight', label: t.frontHeight },
                { key: 'backHeight', label: t.backHeight },
                { key: 'frontHubsMaterial', label: t.frontHubsMaterial },
                { key: 'frontHubsLength', label: t.frontHubsLength },
                { key: 'frontBar', label: t.frontBar },
                { key: 'spindle', label: t.spindle },
                { key: 'caster', label: t.caster },
                { key: 'camber', label: t.camber },
                { key: 'seatPosition', label: t.seatPosition },
                { key: 'seatInclination', label: t.seatInclination },
                { key: 'frontWheelType', label: t.frontWheelType }
            ]
        },
        {
            title: t.finalDetails,
            fields: [
                { key: 'dashSummaryPhoto', label: t.dashSummary }
            ]
        }
    ];

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
                <div className="text-center">
                    <div
                        className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-t-transparent"
                        style={{
                            borderTopColor: config?.primaryColor || '#dc2626',
                            borderRightColor: 'transparent',
                            borderBottomColor: config?.primaryColor || '#dc2626',
                            borderLeftColor: config?.primaryColor || '#dc2626',
                        }}
                    ></div>
                    <p className="text-lg text-gray-400">Loading settings...</p>
                </div>
            </div>
        );
    }

    const primaryColor = config?.primaryColor || '#dc2626';

    const floatingToast = memberListMessage?.type === 'success' ? memberListMessage : null;

    return (
        <div className="min-h-[calc(100vh-64px)] relative overflow-hidden">
            {floatingToast && (
                <div className="fixed top-6 right-6 z-50 max-w-sm rounded-xl border border-green-500/40 bg-green-500/15 px-5 py-4 shadow-2xl backdrop-blur-lg flex items-start gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                    <span className="text-xl">✅</span>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-green-200 uppercase tracking-wider">Done</p>
                        <p className="text-sm text-green-100 mt-1">{floatingToast.text}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMemberListMessage(null)}
                        className="text-green-200 hover:text-white text-lg leading-none"
                        aria-label="Dismiss"
                    >×</button>
                </div>
            )}
            <div className="relative z-10 mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white uppercase tracking-wider">
                            Team <span style={{ color: primaryColor }}>Settings</span>
                        </h1>
                        <p className="text-gray-400">Customize your tracking fields (Form Builder).</p>
                    </div>

                    {/* Language Switcher */}
                    <div className="flex bg-gray-900/80 rounded-lg border border-gray-700 backdrop-blur-md overflow-hidden">
                        <button
                            type="button"
                            onClick={() => handleLanguageChange('en')}
                            className={`px-4 py-2 text-sm font-bold transition-colors ${lang === 'en' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                            style={lang === 'en' ? { backgroundColor: `${primaryColor}4D` } : {}}
                        >
                            EN
                        </button>
                        <button
                            type="button"
                            onClick={() => handleLanguageChange('es')}
                            className={`px-4 py-2 text-sm font-bold border-l border-r border-gray-700 transition-colors ${lang === 'es' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                            style={lang === 'es' ? { backgroundColor: `${primaryColor}4D` } : {}}
                        >
                            ES
                        </button>
                        <button
                            type="button"
                            onClick={() => handleLanguageChange('pt')}
                            className={`px-4 py-2 text-sm font-bold border-r border-gray-700 transition-colors ${lang === 'pt' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                            style={lang === 'pt' ? { backgroundColor: `${primaryColor}4D` } : {}}
                        >
                            PT
                        </button>
                        <button
                            type="button"
                            onClick={() => handleLanguageChange('it')}
                            className={`px-4 py-2 text-sm font-bold transition-colors ${lang === 'it' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                            style={lang === 'it' ? { backgroundColor: `${primaryColor}4D` } : {}}
                        >
                            IT
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl backdrop-blur-xl p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                        <span>🏗️</span> Form Builder Toggles
                    </h2>
                    <p className="text-gray-400 mb-6 text-sm">
                        Select which fields your drivers need to fill out in their setup form. Disabled fields will be hidden.
                    </p>

                    <div className="mb-10 bg-gray-800/30 p-6 rounded-xl border border-gray-700/50">
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                            <span>🌎</span> {t.region}
                        </h3>
                        <div className="flex flex-wrap bg-gray-900/50 p-1 rounded-xl border border-gray-700 w-fit gap-1">
                            {([
                                { key: 'NorthAmerica', label: t.northAmerica },
                                { key: 'CentralAmerica', label: t.centralAmerica },
                                { key: 'Brazil', label: 'Brazil' },
                                { key: 'Europe', label: t.europe },
                            ] as const).map(({ key, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setRegion(key)}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${region === key ? 'text-white shadow-lg' : 'text-gray-400 hover:text-gray-300'}`}
                                    style={region === key ? { backgroundColor: primaryColor } : {}}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <p className="text-gray-500 text-xs mt-3">
                            Changing the region will adjust the default tracks and divisions available for your team.
                        </p>
                    </div>

                    <div className="flex gap-3 mb-8 pb-6 border-b border-gray-800">
                        <button
                            type="button"
                            onClick={() => setEnabledFields(ALL_FIELD_KEYS)}
                            className="rounded-lg px-4 py-2 text-sm font-bold uppercase tracking-wider hover:text-white transition-all shadow-lg flex items-center gap-2"
                            style={{ backgroundColor: `${primaryColor}33`, color: primaryColor, border: `1px solid ${primaryColor}4D` }}
                        >
                            <span className="text-lg">✓</span> Check All Fields
                        </button>
                        <button
                            type="button"
                            onClick={() => setEnabledFields([])}
                            className="rounded-lg bg-gray-800/50 text-gray-400 border border-gray-700 px-4 py-2 text-sm font-bold uppercase tracking-wider hover:bg-gray-700 hover:text-white transition-all flex items-center gap-2"
                        >
                            <span className="text-lg">✕</span> Uncheck All Fields
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-8">
                        {fieldGroups.map((group) => (
                            <div key={group.title} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                                <div className="flex justify-between items-center mb-5 border-b border-gray-700 pb-3">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                                        {group.title}
                                    </h3>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const groupKeys = group.fields.map(f => f.key);
                                                setEnabledFields(prev => Array.from(new Set([...prev, ...groupKeys])));
                                            }}
                                            className="text-xs font-bold uppercase tracking-wider transition-colors px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700"
                                            style={{ color: primaryColor }}
                                        >
                                            Check All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const groupKeys = group.fields.map(f => f.key);
                                                setEnabledFields(prev => prev.filter(k => !groupKeys.includes(k)));
                                            }}
                                            className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-colors px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700"
                                        >
                                            Uncheck
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {group.fields.map(({ key, label }) => (
                                        <label key={key} className="flex items-center space-x-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={enabledFields.includes(key)}
                                                onChange={() => toggleField(key)}
                                                className="w-5 h-5 rounded border-gray-500 bg-gray-700 focus:ring-offset-gray-900 transition-colors cursor-pointer"
                                                style={{ accentColor: primaryColor }}
                                            />
                                            <span className={`text-sm font-medium transition-colors ${enabledFields.includes(key) ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                                {label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Tyre Age Unit */}
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-1">Tyre Age Unit</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Choose whether tyre age is tracked in sessions or laps. This changes the label drivers see on the form.
                            </p>
                            <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-700 w-fit gap-1">
                                {(['sessions', 'laps'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setTyreAgeMode(mode)}
                                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tyreAgeMode === mode ? 'text-white shadow-lg' : 'text-gray-400 hover:text-gray-300'}`}
                                        style={tyreAgeMode === mode ? { backgroundColor: primaryColor } : {}}
                                    >
                                        {mode === 'sessions' ? 'Sessions' : 'Laps'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tyre Pressure Mode */}
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-1">Tyre Pressure Mode</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                "Lowest pressure" shows a single input. "All 4 tyres" shows separate RF, LF, RR, LR fields — the lowest value is saved as the summary pressure.
                            </p>
                            <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-700 w-fit gap-1">
                                {([
                                    { key: 'lowest', label: 'Lowest pressure' },
                                    { key: 'four', label: 'All 4 tyres' },
                                ] as const).map(({ key, label }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setTyrePressureMode(key)}
                                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tyrePressureMode === key ? 'text-white shadow-lg' : 'text-gray-400 hover:text-gray-300'}`}
                                        style={tyrePressureMode === key ? { backgroundColor: primaryColor } : {}}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-800 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg px-8 py-3 font-bold text-white uppercase tracking-wider transition-all hover:opacity-90 shadow-lg disabled:opacity-50 flex items-center gap-2"
                                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}4D` }}
                            >
                                {saving && (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                )}
                                {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Superuser Access — owner or superadmin */}
                {canManageTeam && (
                    <div className="mt-8 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl backdrop-blur-xl p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-2">
                            <span>🔒</span> Superuser Access
                        </h2>
                        <p className="text-gray-400 mb-6 text-sm">
                            By default, the Overcut superuser cannot view your team's submissions, photos, or PDFs.
                            Enable this only when you need our help with a specific issue. Access auto-expires.
                        </p>

                        {superuserMessage && (
                            <div
                                className={`rounded-xl border p-4 mb-6 ${superuserMessage.type === 'success' ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'}`}
                            >
                                {superuserMessage.text}
                            </div>
                        )}

                        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={superuserActive}
                                    onChange={(e) => handleToggleSuperuser(e.target.checked)}
                                    disabled={savingSuperuserAccess}
                                    className="w-5 h-5 mt-0.5 rounded border-gray-500 bg-gray-700 cursor-pointer"
                                    style={{ accentColor: primaryColor }}
                                />
                                <div>
                                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                                        Allow Overcut superuser to view this team's data
                                    </span>
                                    {superuserActive && expiryLabel && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Active — expires in <span className="text-white font-semibold">{expiryLabel}</span>
                                        </p>
                                    )}
                                    {!superuserActive && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Currently disabled. Submission list is visible but content is hidden.
                                        </p>
                                    )}
                                </div>
                            </label>

                            {!superuserActive && (
                                <div className="mt-5 pl-8">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Grant access for
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {(['24h', '7d', '30d'] as SuperuserAccessDuration[]).map((d) => (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => setSuperuserDuration(d)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${superuserDuration === d ? 'text-white shadow-lg' : 'text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700'}`}
                                                style={superuserDuration === d ? { backgroundColor: primaryColor } : {}}
                                            >
                                                {d === '24h' ? '24 hours' : d === '7d' ? '7 days' : '30 days'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {superuserActive && (
                                <div className="mt-5 pl-8">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleSuperuser(false)}
                                        disabled={savingSuperuserAccess}
                                        className="text-sm font-bold text-red-400 hover:text-red-300 uppercase tracking-wider disabled:opacity-50"
                                    >
                                        Disable now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Team Access — managers (owner-managed) and drivers in one card */}
                <div className="mt-8 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl backdrop-blur-xl p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-2">
                        <span>👥</span> Team Access
                    </h2>
                    <p className="text-gray-400 mb-6 text-sm">
                        Managers can log in and view every setup on this team's dashboard{canManageTeam ? '' : ' (only the team owner can manage them)'}. Drivers can view or edit only their own setups — no other drivers, no PDFs, no deleting, and no setup emails. Removing someone revokes their login; their setups stay visible to managers.
                    </p>

                    {memberListMessage && (
                        <div
                            className={`rounded-xl border p-4 mb-6 ${memberListMessage.type === 'success' ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'}`}
                        >
                            {memberListMessage.text}
                        </div>
                    )}

                    <div className="bg-gray-800/40 border border-gray-700 rounded-xl overflow-hidden">
                        {membersLoading ? (
                            <div className="p-6 text-center text-gray-400 text-sm">Loading team members...</div>
                        ) : members.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">{canManageTeam ? 'No team members yet.' : 'No drivers yet.'}</div>
                        ) : (
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-800/60 border-b border-gray-700">
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">Role</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {members.map((m) => {
                                        const isSelf = m.id === currentUserId;
                                        const busy = memberActionId === m.id;
                                        const isOwnerRow = m.kind === 'manager' && m.isOwner;
                                        return (
                                            <tr key={`${m.kind}-${m.id}`} className="hover:bg-gray-800/30 transition-colors">
                                                <td className="px-4 py-3 text-sm text-white font-semibold">{m.firstName} {m.lastName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-300">{m.email}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {isOwnerRow ? (
                                                        <span
                                                            className="inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
                                                            style={{ backgroundColor: `${primaryColor}33`, color: primaryColor }}
                                                        >
                                                            Owner
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">{m.kind === 'manager' ? 'Manager' : 'Driver'}</span>
                                                    )}
                                                    {m.mustChangePassword && (
                                                        <span className="ml-2 text-xs text-yellow-400" title="Hasn't logged in yet — must change password on first login">⏳</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => (m.kind === 'manager' ? handleResendAccess(m) : handleResendDriverAccess(m))}
                                                            disabled={busy}
                                                            className="px-3 py-1 rounded-lg bg-gray-700 text-gray-200 text-xs font-bold uppercase tracking-wider hover:bg-gray-600 disabled:opacity-50"
                                                        >
                                                            Resend
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => (m.kind === 'manager' ? handleDeleteManager(m) : handleDeleteDriver(m))}
                                                            disabled={busy || isOwnerRow || (m.kind === 'manager' && isSelf)}
                                                            title={isOwnerRow ? 'Cannot remove the team owner' : m.kind === 'manager' && isSelf ? 'You cannot remove yourself' : m.kind === 'manager' ? 'Remove manager' : 'Remove driver access'}
                                                            className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-800">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">{canManageTeam ? 'Add a manager or driver' : 'Add a new driver'}</h3>
                        <p className="text-gray-400 mb-4 text-sm">
                            They will receive an email with auto-generated credentials and must change their password on first login.{newMemberRole === 'driver' ? ' Use the same email the driver uses on the setup form so their existing setups appear in their dashboard.' : ''}
                        </p>

                        {addMemberMessage && (
                            <div
                                className={`rounded-xl border p-4 mb-6 ${addMemberMessage.type === 'success' ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'}`}
                            >
                                {addMemberMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleAddMember} className="space-y-4">
                            {canManageTeam && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Role
                                    </label>
                                    <select
                                        value={newMemberRole}
                                        onChange={(e) => setNewMemberRole(e.target.value as 'manager' | 'driver')}
                                        className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white transition-all focus:outline-none focus:ring-2 hover:border-gray-600 cursor-pointer"
                                    >
                                        <option value="driver">Driver — sees and edits only their own setups</option>
                                        <option value="manager">Manager — full access to the team dashboard</option>
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newMemberFirstName}
                                        onChange={(e) => setNewMemberFirstName(e.target.value)}
                                        required
                                        className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 hover:border-gray-600"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newMemberLastName}
                                        onChange={(e) => setNewMemberLastName(e.target.value)}
                                        required
                                        className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 hover:border-gray-600"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                    required
                                    className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 hover:border-gray-600"
                                    placeholder={newMemberRole === 'manager' ? 'manager@example.com' : 'driver@example.com'}
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={addingMember}
                                    className="rounded-lg px-8 py-3 font-bold text-white uppercase tracking-wider transition-all hover:opacity-90 shadow-lg disabled:opacity-50 flex items-center gap-2"
                                    style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}4D` }}
                                >
                                    {addingMember && (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    )}
                                    {addingMember ? 'Adding...' : newMemberRole === 'manager' ? 'Add Manager' : 'Add Driver'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
