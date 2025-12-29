// Team configuration types for multi-team support

export interface FormConfig {
    enabledFields: string[];
    requiredFields: string[];
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
}

export interface TeamInfo {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string;
}
