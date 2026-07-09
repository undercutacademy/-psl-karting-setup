// Team configuration types for multi-team support

export interface FormConfig {
    enabledFields: string[];
    requiredFields: string[];
    tyreAgeMode?: 'sessions' | 'laps';
    tyrePressureMode?: 'lowest' | 'four';
}

export interface DropdownOptions {
    tracks: string[];
    championships: string[];
    divisions: string[];
    tyreModels: string[];
}

export interface TeamConfig {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    formConfig: FormConfig;
    dropdownOptions: DropdownOptions;
    customLabels?: Record<string, string>;
    region?: string;
    defaultLanguage?: string;
    superuserAccessExpiresAt?: string | null;
}

export type SuperuserAccessDuration = '24h' | '7d' | '30d';

export interface TeamManager {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isOwner: boolean;
    mustChangePassword: boolean;
    createdAt: string;
}

export interface TeamDriver {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mustChangePassword: boolean;
    createdAt: string;
}

export interface TeamInfo {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string;
}
