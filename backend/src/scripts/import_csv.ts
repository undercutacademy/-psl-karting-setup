
import { PrismaClient, Submission, ClassCode, SessionType, RearHubsMaterial, FrontHeight, BackHeight, FrontBar, Spindle } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
// import { parse } from 'csv-parse/sync';
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

// Mappings
const mapSessionType = (val: string): SessionType | null => {
    const norm = val.replace(/[\s-]/g, '').toLowerCase();
    // Map typical values
    if (norm === 'practice6') return SessionType.Practice6; // Special check for numbering
    if (norm === 'practice5') return SessionType.Practice5;
    if (norm === 'practice4') return SessionType.Practice4;
    if (norm === 'practice3') return SessionType.Practice3;
    if (norm === 'practice2') return SessionType.Practice2;
    if (norm === 'practice1') return SessionType.Practice1;
    if (norm === 'qualifying') return SessionType.Qualifying;
    if (norm === 'final') return SessionType.Final;
    if (norm === 'prefinal') return SessionType.PreFinal;
    if (norm === 'heat1') return SessionType.Heat1;
    if (norm === 'heat2') return SessionType.Heat2;
    if (norm === 'heat3') return SessionType.Heat3;
    if (norm === 'heat4') return SessionType.Heat4;
    if (norm === 'heat5') return SessionType.Heat5;
    if (norm === 'heat6') return SessionType.Heat6;
    if (norm === 'heat7') return SessionType.Heat7;
    if (norm === 'warmup') return SessionType.WarmUp;
    if (norm === 'happyhour') return SessionType.HappyHour;
    if (norm === 'race1') return SessionType.Race1;
    if (norm === 'race2') return SessionType.Race2;
    // Fallback or fuzzy
    if (norm.includes('warm')) return SessionType.WarmUp;
    if (norm.includes('qual')) return SessionType.Qualifying;
    if (norm.includes('final')) return SessionType.Final;
    if (norm.includes('heat')) return SessionType.Heat1; // Default to heat 1 if unknown?
    if (norm.includes('race')) return SessionType.Race1;
    if (norm.includes('practice')) return SessionType.Practice1;

    return null;
};

const mapClassCode = (val: string): ClassCode => {
    const norm = val.toLowerCase();

    if (norm.includes('micro')) return ClassCode.Micro;
    if (norm.includes('mini')) return ClassCode.Mini;
    if (norm.includes('shifter') || norm.includes('kz') || norm.includes('dd2')) return ClassCode.Kz;
    if (norm.includes('ka100') || thisIsKA(norm)) return ClassCode.Ka;
    if (norm.includes('junior') || norm.includes('jr')) return ClassCode.Jr;
    // Default to Sr for Senior, Master, etc.
    return ClassCode.Sr;
};

function thisIsKA(norm: string) {
    return norm === 'ka';
}

const mapMaterials = (val: string): any => {
    if (!val) return 'Aluminium'; // Default
    if (val.toLowerCase().includes('mag')) return 'Magnesium';
    return 'Aluminium';
};

const mapHeight = (val: string): any => {
    if (!val) return 'Standard';
    if (val.toLowerCase() === 'low') return 'Low';
    if (val.toLowerCase() === 'medium') return 'Medium';
    if (val.toLowerCase() === 'high') return 'High';
    return 'Standard';
};

const mapBar = (val: string): any => {
    if (!val) return 'Standard';
    const v = val.toLowerCase();
    if (v.includes('nylon')) return 'Nylon';
    if (v.includes('black')) return 'Black';
    if (v.includes('none')) return 'None';
    return 'Standard';
};

const mapSpindle = (val: string): any => {
    if (!val) return 'Standard';
    const v = val.toLowerCase();
    if (v.includes('blue')) return 'Blue';
    if (v.includes('red')) return 'Red';
    if (v.includes('green')) return 'Green';
    if (v.includes('gold')) return 'Gold';
    return 'Standard';
};

async function main() {
    const csvPath = 'c:\\Users\\lucas\\OneDrive\\Desktop\\Cursor Projects\\Setup app\\Old database\\PSL_Karting_App2025-12-24_21_47_21.csv';

    console.log(`Reading CSV from ${csvPath}...`);
    const fileContent = fs.readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '');

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    console.log(`Found ${records.length} records. Processing...`);

    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
        try {
            // Find or create user
            const email = record['Email'];
            const driverName = record['Driver'] || 'Unknown Driver';
            let user = null;

            if (email) {
                user = await prisma.user.findUnique({ where: { email } });
            }

            if (!user) {
                // Create user
                // Split name
                const parts = driverName.split(' ');
                const firstName = parts[0];
                const lastName = parts.slice(1).join(' ') || '';

                // If no email, generate a fake one or skip? 
                // Generating fake email based on name to allow import
                const userEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s/g, '')}@example.com`;

                // Check again if fake email exists
                user = await prisma.user.findUnique({ where: { email: userEmail } });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            email: userEmail,
                            firstName: firstName || 'Unknown',
                            lastName: lastName || 'User',
                            password: null, // Not a manager
                            isManager: false
                        }
                    });
                    // console.log(`Created user: ${driverName} (${userEmail})`);
                }
            }

            const sessionType = mapSessionType(record['Session Type']);
            if (!sessionType) {
                // console.warn(`Skipping record for ${driverName}: Unknown session type "${record['Session Type']}"`);
                continue;
            }

            const classCode = mapClassCode(record['Division'] || '');

            // Create submission
            await prisma.submission.create({
                data: {
                    userId: user.id,
                    sessionType: sessionType,
                    classCode: classCode,
                    track: record['Track'] || 'Unknown',
                    championship: record['Championship'] || 'Unknown',
                    division: record['Division'] || '',
                    engineNumber: record['Engine Number'] || '',
                    gearRatio: record['Gear Ratio (Shifter Only)'] || null,
                    driveSprocket: record['Drive Sprocket (Engine)'] || null,
                    drivenSprocket: record['Driven Sprocket (Gear)'] || null,
                    carburatorNumber: record['Carburator Number'] || null,
                    tyreModel: record['Tyre model'] || 'Unknown',
                    tyreAge: record['Tyre age'] || '',
                    tyreColdPressure: record['Tyre Cold Pressure'] || '',
                    chassis: record['Chassis'] || 'Unknown',
                    axle: record['Axle'] || '',
                    rearHubsMaterial: mapMaterials(record['Rear Hubs Material']),
                    rearHubsLength: record['Rear Hubs length'] || '',
                    frontHeight: mapHeight(record['Front Height']),
                    backHeight: mapHeight(record['Back Height']),
                    frontHubsMaterial: undefined, // Let it be null (or default if I can't set null) - Schema is optional now
                    frontBar: mapBar(record['Front Bar']),
                    spindle: mapSpindle(record['Spindle']),
                    caster: record['Caster'] || '',
                    seatPosition: record['Seat Position [cm]'] || '',
                    lapTime: record['Lap time'] || null,
                    observation: record['Observation'] || null,
                    createdAt: record['Submission Date'] ? new Date(record['Submission Date']) : new Date(),
                }
            });
            successCount++;
            if (successCount % 50 === 0) process.stdout.write('.');

        } catch (e: any) {
            console.error(`Error processing row: ${e.message}`, record);
            errorCount++;
        }
    }

    console.log(`\nImport complete.`);
    console.log(`Successfully imported: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
