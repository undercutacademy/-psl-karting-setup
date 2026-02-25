import { PrismaClient, SessionType, ClassCode, RearHubsMaterial, FrontHeight, BackHeight, FrontHubsMaterial, FrontBar, Spindle } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

const DEMO_CONFIG = {
    managerEmails: ['demo@overcut.com'],
    logoUrl: '/demo.png',
    primaryColor: '#dc2626', // Standard Red focus
    emailFromName: 'Demo Motorsport Setups',
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
    console.log('Creating Demo Motorsport team...');

    const team = await prisma.team.upsert({
        where: { slug: 'demo' },
        update: {
            ...DEMO_CONFIG,
            name: 'Demo Motorsport'
        },
        create: {
            name: 'Demo Motorsport',
            slug: 'demo',
            ...DEMO_CONFIG,
        },
    });

    console.log(`✅ Team '${team.name}' ready (Slug: ${team.slug})`);

    const email = 'demo@overcut.com';
    const password = 'setupdemo';
    const hashedPassword = hashPassword(password);

    console.log(`Setting up manager: ${email}`);

    const manager = await prisma.user.upsert({
        where: { email },
        update: {
            isManager: true,
            password: hashedPassword,
            teamId: team.id
        },
        create: {
            email,
            firstName: 'Demo',
            lastName: 'Manager',
            password: hashedPassword,
            isManager: true,
            teamId: team.id
        },
    });

    console.log(`✅ Manager ready`);

    console.log('Creating demo submissions...');

    // Create a mock driver user for submissions
    const driverEmail = 'driver@demo.com';
    const driver = await prisma.user.upsert({
        where: { email: driverEmail },
        update: { teamId: team.id },
        create: {
            email: driverEmail,
            firstName: 'Demo',
            lastName: 'Driver',
            isManager: false,
            teamId: team.id
        }
    });

    const dummySubmissions = [
        {
            userId: driver.id,
            teamId: team.id,
            sessionType: SessionType.Practice1,
            classCode: ClassCode.Sr,
            track: 'Orlando',
            championship: 'Florida Winter Tour',
            division: 'KA100 Sr',
            engineNumber: '1234',
            gearRatio: '10/82',
            driveSprocket: '10',
            drivenSprocket: '82',
            carburatorNumber: 'C12',
            tyreModel: 'Evinco Red SKM2',
            tyreAge: 'New',
            tyreColdPressure: '12',
            chassis: 'BirelArt RY30',
            axle: 'M',
            rearHubsMaterial: RearHubsMaterial.Aluminium,
            rearHubsLength: '90mm',
            frontHeight: FrontHeight.Standard,
            backHeight: BackHeight.Medium,
            frontHubsMaterial: FrontHubsMaterial.Magnesium,
            frontBar: FrontBar.Standard,
            spindle: Spindle.Standard,
            caster: 'Neutral',
            seatPosition: 'Standard',
            lapTime: '55.234',
            observation: 'Kart was a bit loose on exit of turn 3 but good top speed.'
        },
        {
            userId: driver.id,
            teamId: team.id,
            sessionType: SessionType.Qualifying,
            classCode: ClassCode.Sr,
            track: 'Orlando',
            championship: 'Florida Winter Tour',
            division: 'KA100 Sr',
            engineNumber: '1234',
            gearRatio: '10/82',
            driveSprocket: '10',
            drivenSprocket: '82',
            carburatorNumber: 'C12',
            tyreModel: 'Evinco Red SKM2',
            tyreAge: 'New',
            tyreColdPressure: '12',
            chassis: 'BirelArt RY30',
            axle: 'M',
            rearHubsMaterial: RearHubsMaterial.Aluminium,
            rearHubsLength: '90mm',
            frontHeight: FrontHeight.Standard,
            backHeight: BackHeight.Medium,
            frontHubsMaterial: FrontHubsMaterial.Magnesium,
            frontBar: FrontBar.Nylon,
            spindle: Spindle.Standard,
            caster: 'Neutral',
            seatPosition: 'Standard',
            lapTime: '54.912',
            observation: 'Nylon bar helped the kart rotate better.'
        },
        {
            userId: driver.id,
            teamId: team.id,
            sessionType: SessionType.Final,
            classCode: ClassCode.Sr,
            track: 'Orlando',
            championship: 'Florida Winter Tour',
            division: 'KA100 Sr',
            engineNumber: '1234',
            gearRatio: '10/83',
            driveSprocket: '10',
            drivenSprocket: '83',
            carburatorNumber: 'C12',
            tyreModel: 'Evinco Red SKM2',
            tyreAge: '15 Laps',
            tyreColdPressure: '13',
            chassis: 'BirelArt RY30',
            axle: 'M',
            rearHubsMaterial: RearHubsMaterial.Magnesium,
            rearHubsLength: '90mm',
            frontHeight: FrontHeight.Standard,
            backHeight: BackHeight.Medium,
            frontHubsMaterial: FrontHubsMaterial.Magnesium,
            frontBar: FrontBar.Nylon,
            spindle: Spindle.Standard,
            caster: 'Full Caster',
            seatPosition: 'Standard',
            lapTime: '55.001',
            observation: 'Changed ratio, top speed slightly lower but better jump out of the slow tight corners.'
        }
    ];

    // Delete existing demo submissions to avoid duplicates on re-runs
    await prisma.submission.deleteMany({
        where: { teamId: team.id }
    });

    for (const sub of dummySubmissions) {
        await prisma.submission.create({ data: sub });
    }

    console.log(`✅ Added ${dummySubmissions.length} demo submissions`);
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
