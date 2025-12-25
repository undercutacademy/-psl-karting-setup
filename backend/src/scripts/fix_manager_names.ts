
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

async function main() {
    const csvPath = 'c:\\Users\\lucas\\OneDrive\\Desktop\\Cursor Projects\\Setup app\\Old database\\PSL_Karting_App2025-12-24_21_47_21.csv';
    const fileContent = fs.readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '');

    // 1. Get ALL records from CSV to build a lookup map of Email -> Driver Name
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    console.log(`Analyzing ${records.length} records for driver names...`);

    // We only care about records where the email is 'pslkartingdata@gmail.com' (the manager email)
    // AND there is a distinct driver name in the "Driver" column.

    // However, the current schema links Submission -> User (via userId).
    // The User model has 'firstName', 'lastName', 'email'.
    // If multiple submissions point to the same User (pslkartingdata@gmail.com), 
    // we CANNOT simply update the User's name, because that would change it for ALL submissions owned by that user.

    // PROBLEM: The data model assumes 1 User = 1 Driver.
    // The legacy data has 1 User (Manager) submitting for MANY Drivers.

    // SOLUTION:
    // We need to create NEW User accounts for these drivers if they don't exist, 
    // and move the submissions to these new users.

    // Let's filter for the manager email
    const MANAGER_EMAIL = 'pslkartingdata@gmail.com';

    // Find the manager user first
    const managerUser = await prisma.user.findUnique({
        where: { email: MANAGER_EMAIL }
    });

    if (!managerUser) {
        console.error('Manager user not found! Aborting.');
        return;
    }

    console.log(`Found Manager User: ${managerUser.id} (${managerUser.email})`);

    let updatedCount = 0;

    for (const record of records) {
        const recordEmail = record['Email'];
        const driverName = record['Driver'];
        const submissionDate = record['Submission Date'] ? new Date(record['Submission Date']) : null;

        // We are looking for rows where the email used was the manager's email,
        // BUT the driver name listed is NOT "PSL Manager".
        if (recordEmail === MANAGER_EMAIL && driverName && !driverName.toLowerCase().includes('manager')) {

            // 1. Check if we can find the specific submission in the DB to re-assign
            // We'll use a combination of fields to identify the row (since we don't have the original ID)
            // Using: userId (manager), sessionType (mapped), track, createdAt (approx match?)

            // Actually, simpler approach:
            // We imported these recently. We can try to match by exact timestamp if possible,
            // or we might have to iterate all submissions for this user and try to match details.

            // Let's create the dummy email for this driver
            const parts = driverName.split(' ');
            const firstName = parts[0];
            const lastName = parts.slice(1).join(' ') || '';
            const newDriverEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s/g, '')}.legacy@example.com`;

            // 2. Find or Create the User for this Driver
            let driverUser = await prisma.user.findUnique({
                where: { email: newDriverEmail }
            });

            if (!driverUser) {
                // Check if a user exists with the REAL name but different email (unlikely for this specific task scope, but good to check)
                // For now, just create the specific legacy user
                driverUser = await prisma.user.create({
                    data: {
                        email: newDriverEmail,
                        firstName: firstName,
                        lastName: lastName,
                        isManager: false,
                        password: null
                    }
                });
                console.log(`Created new legacy user: ${driverName} (${newDriverEmail})`);
            }

            // 3. Find the submission to move
            // We need to find a submission that:
            // - Belongs to Manager
            // - Matches Track
            // - Matches Session Type (we have to map it first to string match)
            // - Matches CreatedAt (exact match from CSV string parsing)

            if (submissionDate) {
                const submissions = await prisma.submission.findMany({
                    where: {
                        userId: managerUser.id,
                        track: record['Track'],
                        createdAt: submissionDate
                    }
                });

                // If we find one (or more) that match this exact criteria, move them.
                for (const sub of submissions) {
                    await prisma.submission.update({
                        where: { id: sub.id },
                        data: { userId: driverUser.id }
                    });
                    updatedCount++;
                    process.stdout.write('.');
                }
            }
        }
    }

    console.log(`\n\nProcess Complete.`);
    console.log(`Moved ${updatedCount} submissions from Manager to actual Drivers.`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
