import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * CSV Import Script for Submissions
 * 
 * Usage:
 * 1. Place your CSV file in backend/data/import.csv
 * 2. Run: npx ts-node src/scripts/import-csv.ts
 * 
 * CSV Format (columns):
 * - Email, First Name, Last Name, Team Slug
 * - Session Type, Track, Championship, Division
 * - Engine Number, Gear Ratio, Drive Sprocket, Driven Sprocket, Carburator Number
 * - Tyre Model, Tyre Age, Tyre Cold Pressure
 * - Chassis, Axle, Rear Hubs Material, Rear Hubs Length
 * - Front Height, Back Height, Front Hubs Material, Front Bar
 * - Spindle, Caster, Seat Position
 * - Lap Time, Observation, Submission Date
 */

async function importCSV() {
    const csvPath = path.join(process.cwd(), 'data', 'import.csv');

    if (!fs.existsSync(csvPath)) {
        console.error(`CSV file not found at: ${csvPath}`);
        console.log('Please create a data/import.csv file first.');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');

    let successCount = 0;
    let errorCount = 0;

    const parser = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    for await (const record of parser) {
        try {
            // Find or create user
            const email = record['Email']?.toLowerCase().trim();
            const firstName = record['First Name'] || 'Unknown';
            const lastName = record['Last Name'] || 'User';
            const teamSlug = record['Team Slug'] || 'psl-karting';

            if (!email) {
                console.error('Skipping row: missing email', record);
                errorCount++;
                continue;
            }

            // Find team
            const team = await prisma.team.findUnique({
                where: { slug: teamSlug }
            });

            if (!team) {
                console.error(`Team not found: ${teamSlug}`);
                errorCount++;
                continue;
            }

            // Find or create user
            let user = await prisma.user.findFirst({
                where: {
                    email,
                    teamId: team.id
                }
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email,
                        firstName,
                        lastName,
                        teamId: team.id,
                        isManager: false,
                    }
                });
            }

            // Create submission
            await prisma.submission.create({
                data: {
                    userId: user.id,
                    teamId: team.id,
                    sessionType: record['Session Type'] || 'Practice 1',
                    track: record['Track'] || 'Unknown',
                    championship: record['Championship'] || 'Unknown',
                    division: record['Division'] || 'Unknown',
                    engineNumber: record['Engine Number'] || '',
                    gearRatio: record['Gear Ratio'] || null,
                    driveSprocket: record['Drive Sprocket'] || null,
                    drivenSprocket: record['Driven Sprocket'] || null,
                    carburatorNumber: record['Carburator Number'] || null,
                    tyreModel: record['Tyre Model'] || 'Unknown',
                    tyreAge: record['Tyre Age'] || '',
                    tyreColdPressure: record['Tyre Cold Pressure'] || '',
                    chassis: record['Chassis'] || 'Unknown',
                    axle: record['Axle'] || '',
                    rearHubsMaterial: record['Rear Hubs Material'] || 'Aluminium',
                    rearHubsLength: record['Rear Hubs Length'] || '',
                    frontHeight: record['Front Height'] || 'Standard',
                    backHeight: record['Back Height'] || 'Standard',
                    frontHubsMaterial: record['Front Hubs Material'] || 'Aluminium',
                    frontBar: record['Front Bar'] || 'Standard',
                    spindle: record['Spindle'] || 'Standard',
                    caster: record['Caster'] || '',
                    seatPosition: record['Seat Position'] || '',
                    lapTime: record['Lap Time'] || null,
                    observation: record['Observation'] || null,
                    createdAt: record['Submission Date'] ? new Date(record['Submission Date']) : new Date(),
                }
            });

            successCount++;
            if (successCount % 10 === 0) {
                process.stdout.write('.');
            }
        } catch (e: any) {
            console.error(`\\nError processing row: ${e.message}`);
            console.error('Record:', record);
            errorCount++;
        }
    }

    console.log('\\n\\n=== Import Complete ===');
    console.log(`✅ Successfully imported: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
}

importCSV()
    .catch(e => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
