'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTeamConfig, updateTeamConfig } from '@/lib/api';
import { TeamConfig } from '@/types/team';
import { TRANSLATIONS, Language } from '@/lib/translations';

const ALL_FIELD_KEYS = [
    'engineNumber', 'gearRatio', 'driveSprocket', 'drivenSprocket', 'carburatorNumber', 'sessionLaps',
    'tyreModel', 'tyreAge',
    'chassis', 'axle', 'axleSize', 'rearHubsMaterial', 'rearHubsLength', 'rearTrackWidth', 'frontHeight', 'backHeight',
    'frontHubsMaterial', 'frontHubsLength', 'frontBar', 'spindle', 'caster', 'camber', 'seatPosition', 'seatInclination'
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
    const [lang, setLang] = useState<Language>('en');

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
                enabledFields
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
                { key: 'sessionLaps', label: t.sessionLaps }
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
                { key: 'rearTrackWidth', label: t.rearTrackWidth },
                { key: 'frontHeight', label: t.frontHeight },
                { key: 'backHeight', label: t.backHeight },
                { key: 'frontHubsMaterial', label: t.frontHubsMaterial },
                { key: 'frontHubsLength', label: t.frontHubsLength },
                { key: 'frontBar', label: t.frontBar },
                { key: 'spindle', label: t.spindle },
                { key: 'caster', label: t.caster },
                { key: 'camber', label: t.camber },
                { key: 'seatPosition', label: t.seatPosition },
                { key: 'seatInclination', label: t.seatInclination }
            ]
        }
    ];

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
                <div className="text-center">
                    <div
                        className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-t-transparent"
                        style={{ borderColor: config?.primaryColor || '#dc2626', borderRightColor: 'transparent' }}
                    ></div>
                    <p className="text-lg text-gray-400">Loading settings...</p>
                </div>
            </div>
        );
    }

    const primaryColor = config?.primaryColor || '#dc2626';

    return (
        <div className="min-h-[calc(100vh-64px)] relative overflow-hidden">
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
            </div>
        </div>
    );
}
