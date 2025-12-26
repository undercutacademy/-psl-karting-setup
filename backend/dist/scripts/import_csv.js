"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
// import { parse } from 'csv-parse/sync';
const { parse } = require('csv-parse/sync');
const prisma = new client_1.PrismaClient();
// Mappings
const mapSessionType = (val) => {
    const norm = val.replace(/[\s-]/g, '').toLowerCase();
    // Map typical values
    if (norm === 'practice6')
        return client_1.SessionType.Practice6; // Special check for numbering
    if (norm === 'practice5')
        return client_1.SessionType.Practice5;
    if (norm === 'practice4')
        return client_1.SessionType.Practice4;
    if (norm === 'practice3')
        return client_1.SessionType.Practice3;
    if (norm === 'practice2')
        return client_1.SessionType.Practice2;
    if (norm === 'practice1')
        return client_1.SessionType.Practice1;
    if (norm === 'qualifying')
        return client_1.SessionType.Qualifying;
    if (norm === 'final')
        return client_1.SessionType.Final;
    if (norm === 'prefinal')
        return client_1.SessionType.PreFinal;
    if (norm === 'heat1')
        return client_1.SessionType.Heat1;
    if (norm === 'heat2')
        return client_1.SessionType.Heat2;
    if (norm === 'heat3')
        return client_1.SessionType.Heat3;
    if (norm === 'heat4')
        return client_1.SessionType.Heat4;
    if (norm === 'heat5')
        return client_1.SessionType.Heat5;
    if (norm === 'heat6')
        return client_1.SessionType.Heat6;
    if (norm === 'heat7')
        return client_1.SessionType.Heat7;
    if (norm === 'warmup')
        return client_1.SessionType.WarmUp;
    if (norm === 'happyhour')
        return client_1.SessionType.HappyHour;
    if (norm === 'race1')
        return client_1.SessionType.Race1;
    if (norm === 'race2')
        return client_1.SessionType.Race2;
    // Fallback or fuzzy
    if (norm.includes('warm'))
        return client_1.SessionType.WarmUp;
    if (norm.includes('qual'))
        return client_1.SessionType.Qualifying;
    if (norm.includes('final'))
        return client_1.SessionType.Final;
    if (norm.includes('heat'))
        return client_1.SessionType.Heat1; // Default to heat 1 if unknown?
    if (norm.includes('race'))
        return client_1.SessionType.Race1;
    if (norm.includes('practice'))
        return client_1.SessionType.Practice1;
    return null;
};
const mapClassCode = (val) => {
    const norm = val.toLowerCase();
    if (norm.includes('micro'))
        return client_1.ClassCode.Micro;
    if (norm.includes('mini'))
        return client_1.ClassCode.Mini;
    if (norm.includes('shifter') || norm.includes('kz') || norm.includes('dd2'))
        return client_1.ClassCode.Kz;
    if (norm.includes('ka100') || thisIsKA(norm))
        return client_1.ClassCode.Ka;
    if (norm.includes('junior') || norm.includes('jr'))
        return client_1.ClassCode.Jr;
    // Default to Sr for Senior, Master, etc.
    return client_1.ClassCode.Sr;
};
function thisIsKA(norm) {
    return norm === 'ka';
}
const mapMaterials = (val) => {
    if (!val)
        return 'Aluminium'; // Default
    if (val.toLowerCase().includes('mag'))
        return 'Magnesium';
    return 'Aluminium';
};
const mapHeight = (val) => {
    if (!val)
        return 'Standard';
    if (val.toLowerCase() === 'low')
        return 'Low';
    if (val.toLowerCase() === 'medium')
        return 'Medium';
    if (val.toLowerCase() === 'high')
        return 'High';
    return 'Standard';
};
const mapBar = (val) => {
    if (!val)
        return 'Standard';
    const v = val.toLowerCase();
    if (v.includes('nylon'))
        return 'Nylon';
    if (v.includes('black'))
        return 'Black';
    if (v.includes('none'))
        return 'None';
    return 'Standard';
};
const mapSpindle = (val) => {
    if (!val)
        return 'Standard';
    const v = val.toLowerCase();
    if (v.includes('blue'))
        return 'Blue';
    if (v.includes('red'))
        return 'Red';
    if (v.includes('green'))
        return 'Green';
    if (v.includes('gold'))
        return 'Gold';
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
            if (successCount % 50 === 0)
                process.stdout.write('.');
        }
        catch (e) {
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
