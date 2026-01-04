import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient, ClassCode, SessionType, RearHubsMaterial, FrontHubsMaterial, FrontHeight, BackHeight, FrontBar, Spindle } from '@prisma/client';

const prisma = new PrismaClient();

const CSV_PATH = path.resolve(__dirname, '../../../Old database/Trinity_Karting_App2026-01-04_09_46_58.csv');

// Helper to map SessionType
function mapSessionType(type: string): SessionType {
    const normalized = type.replace(/[\s-]/g, '').toLowerCase(); // remove spaces and dashes
    // e.g. "Pre Final" -> "prefinal" -> match "PreFinal" (case insensitive logic below or manual map)

    const map: Record<string, SessionType> = {
        'practice6': 'Practice6',
        'practice5': 'Practice5',
        'practice4': 'Practice4',
        'practice3': 'Practice3',
        'practice2': 'Practice2',
        'practice1': 'Practice1',
        'happyhour': 'HappyHour',
        'warmup': 'WarmUp',
        'qualifying': 'Qualifying',
        'race1': 'Race1',
        'race2': 'Race2',
        'prefinal': 'PreFinal',
        'final': 'Final',
        'heat1': 'Heat1',
        'heat2': 'Heat2',
        'heat3': 'Heat3',
        'heat4': 'Heat4',
        'heat5': 'Heat5',
        'heat6': 'Heat6',
        'heat7': 'Heat7',
        'superheat1': 'SuperHeat1',
        'superheat2': 'SuperHeat2'
    };

    const key = Object.keys(map).find(k => k === normalized);
    if (key) return map[key];

    console.warn(`Unknown SessionType: ${type}, defaulting to Practice1`);
    return 'Practice1';
}

// Helper to map ClassCode
function mapClassCode(division: string): ClassCode {
    const d = division.toLowerCase();
    if (d.includes('micro')) return 'Micro';
    if (d.includes('mini')) return 'Mini';
    if (d.includes('x30 junior') || d.includes('ka100 jr') || d.includes('oknj')) return 'Jr';
    if (d.includes('x30 senior') || d.includes('ka100 sr') || d.includes('okn')) return 'Sr';
    if (d.includes('shifter') || d.includes('kz')) return 'Kz';
    return 'Sr'; // Default
}

function mapMaterial(mat: string): RearHubsMaterial | undefined {
    if (!mat) return undefined;
    if (mat.toLowerCase().includes('magnesium')) return 'Magnesium';
    if (mat.toLowerCase().includes('aluminium')) return 'Aluminium';
    return undefined; // Or default?
}

function mapFrontHubsMaterial(mat: string): FrontHubsMaterial | undefined {
    if (!mat) return undefined;
    if (mat.toLowerCase().includes('magnesium')) return 'Magnesium';
    if (mat.toLowerCase().includes('aluminium')) return 'Aluminium';
    return undefined;
}

function mapHeight(h: string): FrontHeight {
    // Enum values: Low, Medium, High, Standard
    // CSV values: Low, Medium, High, Standard
    const val = h.trim();
    if (['Low', 'Medium', 'High', 'Standard'].includes(val)) return val as FrontHeight;

    // Safe default? Standard is safe.
    if (val.toLowerCase() === 'standard') return 'Standard';
    if (val.toLowerCase() === 'low') return 'Low';
    if (val.toLowerCase() === 'medium') return 'Medium';
    if (val.toLowerCase() === 'high') return 'High';

    return 'Standard';
}

function mapBackHeight(h: string): BackHeight {
    const val = h.trim();
    if (['Low', 'Medium', 'High', 'Standard'].includes(val)) return val as BackHeight;

    if (val.toLowerCase() === 'standard') return 'Standard';
    if (val.toLowerCase() === 'low') return 'Low';
    if (val.toLowerCase() === 'medium') return 'Medium';
    if (val.toLowerCase() === 'high') return 'High';

    return 'Standard';
}

function mapFrontBar(bar: string): FrontBar {
    // CSV: "Standard", "Black", "Nylon", "None", "Blue"?
    // Schema: Nylon, Standard, Black, None
    const b = bar.toLowerCase();
    if (b.includes('nylon')) return 'Nylon';
    if (b.includes('black')) return 'Black';
    if (b.includes('none')) return 'None';
    return 'Standard';
}

function mapSpindle(s: string): Spindle {
    // CSV: Green, Blue, Standard, Gold
    // Schema: Blue, Standard, Red, Green, Gold
    const val = s.trim();
    if (['Blue', 'Standard', 'Red', 'Green', 'Gold'].includes(val)) return val as Spindle;
    return 'Standard';
}

async function main() {
    console.log('Starting import...');

    // 1. Create Team
    const teamSlug = 'tkg-birelart';
    const teamName = 'TKG Birelart';

    let team = await prisma.team.findUnique({ where: { slug: teamSlug } });
    if (!team) {
        console.log(`Creating team: ${teamName}`);
        team = await prisma.team.create({
            data: {
                slug: teamSlug,
                name: teamName,
                managerEmails: [], // User said they will provide emails later
                primaryColor: '#ff0000', // Default red? Birelart is Red.
            }
        });
    } else {
        console.log(`Team found: ${teamName}`);
    }

    // 2. Read CSV
    if (!fs.existsSync(CSV_PATH)) {
        throw new Error(`CSV file not found at ${CSV_PATH}`);
    }
    const fileContent = fs.readFileSync(CSV_PATH, 'utf8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        bom: true
    });

    console.log(`Found ${records.length} records.`);

    // 3. Process records
    let successDates = 0;

    for (const record of records as any[]) {
        // "Submission Date",Driver,Track,Championship,Division,"Session Type","Engine Number","Gear Ratio (Shifter Only)","Drive Sprocket (Engine)","Driven Sprocket (Gear)","Tyre model","Tyre age","Tyre Cold Pressure",Chassis,Axle,"Rear Hubs Material","Rear Hubs length","Front Height","Back Height","Front Hubs Material","Front Bar",Spindle,Caster,"Seat Position [cm]","Lap time",Observation

        const driverName: string = record['Driver'] || 'Unknown Driver';
        const parts = driverName.split(' ');
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ') || '';

        // Generate an email for the user. 
        // Format: firstname.lastname.tkg@placeholder.com (remove special chars)
        const emailName = (firstName + '.' + lastName).toLowerCase().replace(/[^a-z0-9.]/g, '');
        const email = `${emailName}@tkg.placeholder`; // Unique enough?

        // Ensure user exists
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    teamId: team.id
                }
            });
            console.log(`Created user: ${firstName} ${lastName} (${email})`);
        } else {
            // If user exists but no team, or different team? 
            // User requested "make sure to use the teamid correctly so the other teams cant see this data"
            // If user exists, we probably should associate them with this team if they aren't already.
            if (!user.teamId) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { teamId: team.id }
                });
            }
        }

        // Parse Date
        // Format: "Jul 13, 2025" or "Jun 8, 2025"
        let createdAt = new Date(record['Submission Date']);
        if (isNaN(createdAt.getTime())) {
            console.warn(`Invalid date: ${record['Submission Date']}, using now.`);
            createdAt = new Date();
        } else {
            // Because the CSV date is just a date, we might want to add some time if we want to sort nicely, 
            // but existing dates are likely fine as midnight or local.
            // We can just use the date.
        }

        try {
            await prisma.submission.create({
                data: {
                    userId: user.id,
                    teamId: team.id,
                    sessionType: mapSessionType(record['Session Type']),
                    classCode: mapClassCode(record['Division']),
                    track: record['Track'] || '',
                    championship: record['Championship'] || '',
                    division: record['Division'] || '',
                    engineNumber: record['Engine Number'] || '',
                    gearRatio: record['Gear Ratio (Shifter Only)'] || '',
                    driveSprocket: record['Drive Sprocket (Engine)'] || '',
                    drivenSprocket: record['Driven Sprocket (Gear)'] || '',
                    // carburatorNumber missing in CSV
                    tyreModel: record['Tyre model'] || '',
                    tyreAge: record['Tyre age'] || '',
                    tyreColdPressure: record['Tyre Cold Pressure'] || '',
                    chassis: record['Chassis'] || '',
                    axle: record['Axle'] || '',
                    rearHubsMaterial: mapMaterial(record['Rear Hubs Material']) || 'Aluminium',
                    rearHubsLength: record['Rear Hubs length'] || '',
                    frontHeight: mapHeight(record['Front Height']),
                    backHeight: mapBackHeight(record['Back Height']),
                    frontHubsMaterial: mapFrontHubsMaterial(record['Front Hubs Material']),
                    frontBar: mapFrontBar(record['Front Bar']),
                    spindle: mapSpindle(record['Spindle']),
                    caster: record['Caster'] || '',
                    seatPosition: record['Seat Position [cm]'] || '',
                    lapTime: record['Lap time'] || '',
                    observation: record['Observation'] || '',
                    createdAt: createdAt
                }
            });
            process.stdout.write('.');
        } catch (e) {
            console.error(`Error creating submission for ${driverName} on ${record['Submission Date']}:`, e);
        }
    }

    console.log('\nImport finished.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
