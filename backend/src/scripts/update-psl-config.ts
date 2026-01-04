import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PSL Karting team configuration with all dropdown options and form config
const PSL_KARTING_CONFIG = {
    managerEmails: ['kevin@pslkarting.com', 'franzparmentier@gmail.com'],
    logoUrl: '/psl-logo.png',
    primaryColor: '#dc2626',
    emailFromName: 'PSL Karting Setups',
    formConfig: {
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
    },
    dropdownOptions: {
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
    console.log('Updating PSL Karting team with multi-tenant configuration...');

    // Create or update the PSL Karting team with configuration
    const team = await prisma.team.upsert({
        where: { slug: 'psl-karting' },
        update: {
            ...PSL_KARTING_CONFIG,
        },
        create: {
            name: 'PSL Karting',
            slug: 'psl-karting',
            ...PSL_KARTING_CONFIG,
        },
    });

    console.log(`✅ Team '${team.name}' updated with configuration:`);
    console.log(`   - Manager emails: ${team.managerEmails.join(', ')}`);
    console.log(`   - Logo URL: ${team.logoUrl}`);
    console.log(`   - Primary color: ${team.primaryColor}`);
    console.log(`   - Form config: ${JSON.stringify(team.formConfig).substring(0, 50)}...`);
    console.log(`   - Dropdown options: ${JSON.stringify(team.dropdownOptions).substring(0, 50)}...`);
}

main()
    .catch((e) => {
        console.error('Error updating team:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
