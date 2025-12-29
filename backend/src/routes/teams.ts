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
        'spindle', 'caster', 'seatPosition', 'lapTime', 'observation'
    ],
    requiredFields: [
        'sessionType', 'track', 'championship', 'division',
        'engineNumber', 'tyreModel', 'tyreAge', 'tyreColdPressure',
        'chassis', 'axle', 'rearHubsMaterial', 'rearHubsLength',
        'frontHeight', 'backHeight', 'frontBar', 'spindle', 'caster', 'seatPosition'
    ]
};

// Default dropdown options (used when team doesn't have custom options)
const DEFAULT_DROPDOWN_OPTIONS = {
    tracks: [
        'AMR Motorplex', 'AMR Motorplex CCW', 'Orlando', 'Orlando CCW', 'Speedsportz Piquet',
        'St Pete', 'New Castle', 'New Castle Sharkfin', 'New Castle CCW', 'ROK Rio 2024',
        'Las Vegas Motor Speedway 2023', 'Charlotte Speedway', 'MCC Cinccinati', 'PittRace Trackhouse',
        'Supernats 2024', 'Quaker City', 'ROK Rio 2025', 'Supernats 2025',
        'Hamilton', 'Tremblant', 'Icar SH Karting', 'Mosport', 'Portimao'
    ],
    championships: [
        'Skusa Winter Series', 'Florida Winter Tour', 'Rotax Winter Trophy', 'Pro Tour',
        'Skusa Vegas', 'ROK Vegas', 'Stars Championship Series', 'Rotax US East Trophy',
        'Rotax US Final', 'Canada National', 'Champions of the Future', 'World Championship',
        'Supernats 2024', 'Coupe de Montreal', 'Canadian Open', 'Supernats 2025'
    ],
    divisions: [
        'Micro', 'Mini', 'KA100 Jr', 'KA100 Sr', 'KA100 Master', 'Pro Shifter', 'Shifter Master',
        'X30 Junior', 'X30 Senior', 'ROK Micro', 'ROK Mini', 'VLR Junior', 'VLR Senior',
        'VLR Master', 'ROK Shifter', 'ROK Master', 'ROK Junior', 'ROK PRO GP',
        'ROK SV', 'Micro Max', 'Mini Max', 'Junior Max', 'Senior Max', 'Master Max', 'DD2',
        'DD2 Master', '206 Cadet', '206 Junior', '206 Senior', 'OKN', 'OKNJ', 'KZ2', 'KZ1', 'KZM', 'OK', 'OKJ'
    ],
    tyreModels: [
        'Mg Red', 'Mg Yellow', 'MG Wet', 'Evinco Blue', 'Evinco Blue SKH2', 'Evinco Red SKM2',
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
            },
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Merge team-specific config with defaults
        const formConfig = team.formConfig
            ? { ...DEFAULT_FORM_CONFIG, ...(team.formConfig as object) }
            : DEFAULT_FORM_CONFIG;

        const dropdownOptions = team.dropdownOptions
            ? { ...DEFAULT_DROPDOWN_OPTIONS, ...(team.dropdownOptions as object) }
            : DEFAULT_DROPDOWN_OPTIONS;

        res.json({
            id: team.id,
            slug: team.slug,
            name: team.name,
            logoUrl: team.logoUrl,
            primaryColor: team.primaryColor,
            formConfig,
            dropdownOptions,
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

export default router;
