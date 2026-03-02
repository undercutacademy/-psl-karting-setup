import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Default form configuration (used when team doesn't have custom config)
const DEFAULT_FORM_CONFIG = {
    enabledFields: [
        'sessionType', 'track', 'championship', 'division',
        'engineNumber', 'gearRatio', 'driveSprocket', 'drivenSprocket', 'carburatorNumber',
        'tyreModel', 'tyreAge', 'tyreColdPressure',
        'chassis', 'axle', 'rearHubsMaterial', 'rearHubsLength',
        'frontHeight', 'backHeight', 'frontHubsMaterial', 'frontBar',
        'spindle', 'caster', 'seatPosition', 'seatInclination', 'lapTime', 'observation'
    ],
    requiredFields: [
        'sessionType', 'track', 'championship', 'division',
        'engineNumber', 'tyreModel', 'tyreAge', 'tyreColdPressure',
        'chassis', 'axle', 'rearHubsMaterial', 'rearHubsLength',
        'frontHeight', 'backHeight', 'frontBar', 'spindle', 'caster', 'seatPosition'
    ]
};

// Default dropdown options (used when team doesn't have custom options)
const REGION_DROPDOWN_OPTIONS: Record<string, { tracks: string[], championships: string[], divisions?: string[] }> = {
    NorthAmerica: {
        tracks: [
            'AMR Motorplex', 'AMR Motorplex CCW', 'Orlando', 'Orlando CCW', 'Speedsportz', 'Speedsportz CCW', 'Piquet',
            'St Pete', 'New Castle', 'New Castle Sharkfin', 'New Castle CCW', 'ROK Rio 2024',
            'Las Vegas Motor Speedway 2023', 'Charlotte Speedway', 'MCC Cinccinati', 'PittRace', 'Trackhouse',
            'Supernats 2024', 'Quaker City', 'ROK Rio 2025', 'Supernats 2025',
            'Hamilton', 'Tremblant', 'Tremblant CCW', 'Icar', 'SH Karting', 'Mosport', 'Supernats 2026', 'T4 Kartplex', 'Portimao'
        ],
        championships: [
            'Skusa Winter Series', 'Florida Winter Tour', 'Rotax Winter Trophy', 'Pro Tour',
            'Skusa Vegas', 'ROK Vegas', 'Stars Championship Series', 'Rotax US East Trophy',
            'Rotax US Final', 'Canada National', 'Champions of the Future', 'World Championship',
            'Supernats 2024', 'Coupe de Montreal', 'Canadian Open', 'Supernats 2025'
        ]
    },
    Brazil: {
        tracks: [
            'Granja Viana (SP)',
            'Nova Odessa (SP)',
            'Interlagos',
            'Aldeia da Serra (SP)',
            'San Marino (SP)',
            'Speed Park (SP)',
            'Itu (SP)',
            'Beto Carrero (SC)',
            'Velopark (RS)',
            'Volta Redonda (RJ)',
            'Raceland (PR)',
            'Serra (ES)',
            'Tarumã (RS)',
            'Guapimirim (RJ)',
            'RBC Racing (MG)',
            'Paladino (PB)',
            'Luigi Borghesi - Londrina (PR)',
            'Imperatriz (MA)'
        ],
        championships: [
            'Copa SP Light', 'Copa SP Granja Viana', 'Copa do Brasil', 'Copa SpeedPark',
            'Campeonato Brasileiro', 'Open BRK', 'Open Copa', 'V11 Cup', 'Copa Beto Carrero', 'Campeonato Mineiro'
        ],
        divisions: [
            'Mirim', 'Cadete', 'Mini 2T', 'F4 Junior', 'OKNJ', 'OKN', 'F4 Graduados', 'F4 Senior',
            'Shifter', 'Shifter Master', 'Sprinter', 'Senior Am', 'Senior Pro', 'Super Senior', 'S60'
        ]
    }
};

const COMMON_DROPDOWN_OPTIONS = {
    divisions: [
        'Micro', 'Mini', 'KA100 Jr', 'KA100 Sr', 'KA100 Master', 'Pro Shifter', 'Shifter Master',
        'X30 Junior', 'X30 Senior', 'ROK Micro', 'ROK Mini', 'VLR Junior', 'VLR Senior',
        'VLR Master', 'ROK Shifter', 'ROK Master', 'ROK Junior', 'ROK PRO GP',
        'ROK SV', 'Micro Max', 'Mini Max', 'Junior Max', 'Senior Max', 'Master Max', 'DD2',
        'DD2 Master', '206 Cadet', '206 Junior', '206 Senior', 'OKN', 'OKNJ', 'KZ2', 'KZ1', 'KZM', 'OK', 'OKJ'
    ],
    tyreModels: [
        'Mg Red', 'MG Cadet', 'Mg Yellow', 'MG Wet', 'Evinco Blue', 'Evinco Blue SKH2', 'Evinco Red SKM2',
        'Evinco WET', 'Levanto', 'Levanto WET', 'Bridgestone', 'Vega Red', 'Vega Blue',
        'Vega Yellow', 'Mojo D5', 'Mojo D2', 'Dunlop', 'Dunlop WET'
    ]
};

// Get team configuration by slug
router.get('/:slug/config', async (req, res) => {
    try {
        const { slug } = req.params;

        const team = await prisma.team.findUnique({
            where: { slug },
            select: {
                id: true,
                slug: true,
                name: true,
                logoUrl: true,
                primaryColor: true,
                formConfig: true,
                dropdownOptions: true,
                customLabels: true,
                region: true,
                defaultLanguage: true,
            },
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Merge team-specific config with defaults
        const formConfig = team.formConfig
            ? { ...DEFAULT_FORM_CONFIG, ...(team.formConfig as object) }
            : DEFAULT_FORM_CONFIG;

        const teamRegion = team.region || 'NorthAmerica';
        const regionOptions = REGION_DROPDOWN_OPTIONS[teamRegion] || REGION_DROPDOWN_OPTIONS.NorthAmerica;
        const baseDropdownOptions = { ...COMMON_DROPDOWN_OPTIONS, ...regionOptions };

        const dropdownOptions = team.dropdownOptions
            ? { ...baseDropdownOptions, ...(team.dropdownOptions as object) }
            : baseDropdownOptions;

        res.json({
            id: team.id,
            slug: team.slug,
            name: team.name,
            logoUrl: team.logoUrl,
            primaryColor: team.primaryColor,
            formConfig,
            dropdownOptions,
            customLabels: team.customLabels || {},
            region: teamRegion,
            defaultLanguage: team.defaultLanguage || 'en',
        });
    } catch (error) {
        console.error('Error fetching team config:', error);
        res.status(500).json({ error: 'Failed to fetch team configuration' });
    }
});

// Get basic team info by slug (public)
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const team = await prisma.team.findUnique({
            where: { slug },
            select: {
                id: true,
                slug: true,
                name: true,
                logoUrl: true,
                primaryColor: true,
            },
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json(team);
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// List all teams (for team selection page)
router.get('/', async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            select: {
                id: true,
                slug: true,
                name: true,
                logoUrl: true,
                primaryColor: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        res.json(teams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Update team configuration
router.put('/:slug/config', async (req, res) => {
    try {
        const { slug } = req.params;
        const { customLabels, formConfig: newFormConfig } = req.body;

        const team = await prisma.team.findUnique({
            where: { slug },
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const updatedTeam = await prisma.team.update({
            where: { slug },
            data: {
                customLabels: customLabels !== undefined ? customLabels : team.customLabels,
                formConfig: newFormConfig !== undefined ? newFormConfig : team.formConfig,
            },
            select: {
                id: true,
                slug: true,
                name: true,
                logoUrl: true,
                primaryColor: true,
                formConfig: true,
                dropdownOptions: true,
                customLabels: true,
                region: true,
                defaultLanguage: true,
            }
        });

        // Merge team-specific config with defaults for response
        const formConfig = updatedTeam.formConfig
            ? { ...DEFAULT_FORM_CONFIG, ...(updatedTeam.formConfig as object) }
            : DEFAULT_FORM_CONFIG;

        const teamRegion = updatedTeam.region || 'NorthAmerica';
        const regionOptions = REGION_DROPDOWN_OPTIONS[teamRegion] || REGION_DROPDOWN_OPTIONS.NorthAmerica;
        const baseDropdownOptions = { ...COMMON_DROPDOWN_OPTIONS, ...regionOptions };

        const dropdownOptions = updatedTeam.dropdownOptions
            ? { ...baseDropdownOptions, ...(updatedTeam.dropdownOptions as object) }
            : baseDropdownOptions;

        res.json({
            id: updatedTeam.id,
            slug: updatedTeam.slug,
            name: updatedTeam.name,
            logoUrl: updatedTeam.logoUrl,
            primaryColor: updatedTeam.primaryColor,
            formConfig,
            dropdownOptions,
            customLabels: updatedTeam.customLabels || {},
            region: teamRegion,
            defaultLanguage: updatedTeam.defaultLanguage || 'en',
        });
    } catch (error) {
        console.error('Error updating team config:', error);
        res.status(500).json({ error: 'Failed to update team configuration' });
    }
});

export default router;
