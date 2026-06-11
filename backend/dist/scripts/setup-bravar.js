"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const csv_parse_1 = require("csv-parse");
const prisma = new client_1.PrismaClient();
function hashPassword(password) {
    return crypto_1.default.createHash('sha256').update(password).digest('hex');
}
// Maps Portuguese CSV values to Enum values if needed
function mapMaterial(pt) {
    if (!pt)
        return null;
    const lpt = pt.toLowerCase().trim();
    if (lpt === 'magnesio')
        return 'Magnesium';
    if (lpt === 'aluminio')
        return 'Aluminium';
    return null;
}
function mapHeight(pt) {
    if (!pt)
        return null;
    const lpt = pt.toLowerCase().trim();
    if (lpt === 'baixo')
        return 'Low';
    if (lpt === 'meio')
        return 'Medium';
    if (lpt === 'alto')
        return 'High';
    return 'Standard';
}
function mapBar(pt) {
    if (!pt)
        return null;
    const lpt = pt.toLowerCase().trim();
    if (lpt === 'sem barra' || lpt === '')
        return 'None';
    if (lpt === 'nylon')
        return 'Nylon';
    if (lpt === 'standard')
        return 'Standard';
    return 'None';
}
function mapSessionType(pt) {
    if (!pt)
        return 'Practice1';
    const mapper = {
        'practice 1': 'Practice1',
        'practice 2': 'Practice2',
        'practice 3': 'Practice3',
        'practice 4': 'Practice4',
        'practice 5': 'Practice5',
        'practice 6': 'Practice6',
        'qualifying': 'Qualifying',
        'warm-up': 'WarmUp',
        'race 1': 'Race1',
        'race 2': 'Race2',
        'pre-final': 'PreFinal',
        'final': 'Final',
        'heat 1': 'Heat1',
        'heat 2': 'Heat2',
        'heat 3': 'Heat3',
        'heat 4': 'Heat4',
        'heat 5': 'Heat5',
        'heat 6': 'Heat6',
        'heat 7': 'Heat7',
        'super-heat 1': 'SuperHeat1',
        'super-heat 2': 'SuperHeat2'
    };
    return mapper[pt.toLowerCase().trim()] || 'Practice1';
}
async function main() {
    console.log('--- Setting up Bravar Sports ---');
    console.log('1. Creating team...');
    const logoUrl = '/LOGO_BRAVAR_SPORTS.png';
    const managerEmail = 'onsmotorsport@gmail.com';
    const defaultLanguage = 'PT';
    const teamSlug = 'bravar-sports';
    const team = await prisma.team.upsert({
        where: { slug: teamSlug },
        update: {
            name: 'Bravar Sports',
            logoUrl: logoUrl,
            primaryColor: '#0047AB', // Some blue or default
            region: 'Brazil',
            managerEmails: [managerEmail],
            // fields to be setup later
            formConfig: {
                enabledFields: ['sessionType', 'track', 'championship', 'division', 'engineNumber', 'drivenSprocket', 'tyreModel', 'carburatorNumber', 'tyreColdPressure', 'chassis', 'axle', 'axleSize', 'rearHubsMaterial', 'rearHubsLength', 'frontHeight', 'backHeight', 'frontHubsMaterial', 'frontBar', 'caster', 'camber', 'seatPosition', 'lapTime', 'observation', 'rearTrackWidth', 'frontHubsLength', 'seatInclination', 'sessionLaps'],
                requiredFields: ['sessionType', 'track', 'championship', 'division']
            }
        },
        create: {
            slug: teamSlug,
            name: 'Bravar Sports',
            logoUrl: logoUrl,
            primaryColor: '#0047AB',
            region: 'Brazil',
            managerEmails: [managerEmail],
            formConfig: {
                enabledFields: ['sessionType', 'track', 'championship', 'division', 'engineNumber', 'drivenSprocket', 'tyreModel', 'carburatorNumber', 'tyreColdPressure', 'chassis', 'axle', 'axleSize', 'rearHubsMaterial', 'rearHubsLength', 'frontHeight', 'backHeight', 'frontHubsMaterial', 'frontBar', 'caster', 'camber', 'seatPosition', 'lapTime', 'observation', 'rearTrackWidth', 'frontHubsLength', 'seatInclination', 'sessionLaps'],
                requiredFields: ['sessionType', 'track', 'championship', 'division']
            }
        }
    });
    console.log(`Team created/updated: ${team.slug}`);
    console.log('2. Creating manager...');
    const hashedPassword = hashPassword('setup@onsmotorsport');
    const manager = await prisma.user.upsert({
        where: { email: managerEmail },
        update: {
            isManager: true,
            password: hashedPassword,
            teamId: team.id
        },
        create: {
            email: managerEmail,
            firstName: 'ONS',
            lastName: 'Motorsport',
            password: hashedPassword,
            isManager: true,
            teamId: team.id
        }
    });
    console.log(`Manager created/updated: ${manager.email}`);
    console.log('3. Clearing existing submissions for Bravar Sports to avoid duplicates...');
    await prisma.submission.deleteMany({
        where: { teamId: team.id }
    });
    console.log('4. Importing CSV data...');
    const csvPath = "c:/Users/lucas/OneDrive/Desktop/Cursor Projects/Setup app/Old database/Bravar_Setups2026-03-02_10_44_40.csv";
    if (!fs_1.default.existsSync(csvPath)) {
        console.error(`CSV file not found at: ${csvPath}`);
        return;
    }
    const fileContent = fs_1.default.readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '');
    const parser = (0, csv_parse_1.parse)(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
    });
    let successCount = 0;
    let errorCount = 0;
    for await (const record of parser) {
        try {
            const driverName = record['Piloto'] || 'Unknown Driver';
            const nameParts = driverName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || 'Driver';
            const emailSlug = driverName.toLowerCase().replace(/[^a-z0-9]/g, '');
            // Use plus addressing to map to the exact same mailbox but as distinct users
            const driverEmail = `onsmotorsport+${emailSlug}@gmail.com`;
            // Upsert the dummy user so they have their own name
            const user = await prisma.user.upsert({
                where: { email: driverEmail },
                update: {
                    firstName,
                    lastName,
                    teamId: team.id
                },
                create: {
                    email: driverEmail,
                    firstName,
                    lastName,
                    isManager: false,
                    teamId: team.id
                }
            });
            await prisma.submission.create({
                data: {
                    userId: user.id,
                    teamId: team.id,
                    sessionType: mapSessionType(record['Tipo de sessão']),
                    track: record['Pista'] || 'Unknown',
                    championship: record['Campeonato'] || 'Unknown',
                    division: record['Categoria'] || 'Unknown',
                    engineNumber: record['Numero do motor'] || null,
                    driveSprocket: record['Pinhão'] || null,
                    drivenSprocket: record['Coroa'] || null,
                    carburatorNumber: record['Carburador'] || null,
                    tyreModel: record['Modelo do Pneu'] || 'Unknown',
                    tyreColdPressure: record['Pressão Frio'] || '0',
                    chassis: record['Chassis'] || null,
                    axle: record['Eixo'] || null,
                    axleSize: record['Tamanho do eixo'] || null,
                    rearHubsMaterial: mapMaterial(record['Cubo Traseiro']),
                    rearHubsLength: record['Tamanho Cubo Traseiro'] || null,
                    frontHeight: mapHeight(record['Altura Frente']),
                    backHeight: mapHeight(record['Altura Traseira']),
                    frontHubsMaterial: mapMaterial(record['Cubo Dianteiro']),
                    frontBar: mapBar(record['Barra Dianteira']),
                    caster: record['Caster'] || null,
                    camber: record['Camber'] || null,
                    seatPosition: record['Posição do banco [cm]'] || null,
                    lapTime: record['Tempo'] || null,
                    observation: record['Observação'] || null,
                    kartRearWidth: record['Bitola Traseira'] || null,
                    frontHubsLength: record['Tamanho Cubo Dianteiro'] || null,
                    seatInclination: record['Inclinação do banco [cm]'] || null,
                    sessionLaps: record['Número de voltas da sessão'] || record['Número de voltas'] || null,
                    customData: {
                        originalDriver: record['Piloto']
                    },
                    createdAt: record['Submission Date'] ? new Date(record['Submission Date']) : new Date(),
                }
            });
            successCount++;
        }
        catch (e) {
            console.error('Error importing row:', record, e);
            errorCount++;
        }
    }
    console.log(`✅ Successfully imported: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
