import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HOTZ_CONFIG = {
    managerEmails: [] as string[],
    logoUrl: '/HDD_Logo_2025.png',
    primaryColor: '#C9A227',
    emailFromName: 'HOTZ Driver Development Setups',
    region: 'NorthAmerica',
    defaultLanguage: 'en',
    formConfig: {
        enabledFields: [
            'sessionType', 'track', 'championship', 'division',
            'engineNumber', 'gearRatio', 'driveSprocket', 'drivenSprocket', 'carburatorNumber',
            'tyreModel', 'tyreAge', 'tyreColdPressure',
            'chassis', 'axle', 'rearHubsMaterial', 'rearHubsLength',
            'frontHeight', 'backHeight', 'frontHubsMaterial', 'frontBar',
            'spindle', 'caster', 'seatPosition', 'lapTime', 'observation',
            'dashSummaryPhoto'
        ],
        requiredFields: [
            'sessionType', 'track', 'championship', 'division',
            'engineNumber', 'tyreModel', 'tyreAge', 'tyreColdPressure',
            'chassis', 'axle', 'rearHubsMaterial', 'rearHubsLength',
            'frontHeight', 'backHeight', 'frontBar', 'spindle', 'caster', 'seatPosition'
        ]
    },
    dropdownOptions: {
        tracks: [
            'AMR Motorplex', 'AMR Motorplex CCW', 'Orlando', 'Orlando CCW', 'Speedsportz', 'Speedsportz CCW', 'Piquet',
            'St Pete', 'New Castle', 'New Castle Sharkfin', 'New Castle CCW', 'ROK Rio 2024',
            'Las Vegas Motor Speedway 2023', 'Charlotte Speedway', 'MCC Cinccinati', 'PittRace', 'Trackhouse',
            'Supernats 2024', 'Quaker City', 'ROK Rio 2025', 'Supernats 2025',
            'Hamilton', 'Tremblant', 'Tremblant CCW', 'Icar', 'SH Karting', 'Mosport', 'Supernats 2026', 'T4 Kartplex', 'Portimao',
            'Tucson', 'Lorraine', 'K1 Circuit', 'Monticello Karting', 'Bushnell Motorsport Park', 'Jacksonville NFKC'
        ],
        championships: [
            'Skusa Winter Series', 'Florida Winter Tour', 'Rotax Winter Trophy', 'Pro Tour',
            'Skusa Vegas', 'ROK Vegas', 'Stars Championship Series', 'Rotax US East Trophy',
            'Rotax US Final', 'Canada National', 'Champions of the Future', 'World Championship',
            'Supernats 2024', 'Coupe de Montreal', 'Canadian Open', 'Supernats 2025', 'USPKS',
            'Champions of the Future Americas', 'Route 66 Sprint Series',
            'FLKC - Florida Karting Championship'
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
    }
};

async function main() {
    console.log('Creating/Updating HOTZ Driver Development team...');

    const team = await prisma.team.upsert({
        where: { slug: 'hotz' },
        update: {
            ...HOTZ_CONFIG,
        },
        create: {
            name: 'HOTZ Driver Development',
            slug: 'hotz',
            ...HOTZ_CONFIG,
        },
    });

    console.log(`✅ Team '${team.name}' ready (Slug: ${team.slug})`);
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
