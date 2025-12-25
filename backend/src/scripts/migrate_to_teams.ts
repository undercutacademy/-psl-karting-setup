import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting multi-tenancy migration...');

    // 1. Create or finding the default PSL Karting team
    const pslTeam = await prisma.team.upsert({
        where: { slug: 'pslkartingsetup' },
        update: {},
        create: {
            name: 'PSL Karting',
            slug: 'pslkartingsetup',
        },
    });

    console.log(`Team '${pslTeam.name}' (ID: ${pslTeam.id}) ready.`);

    // 2. Migrate Users
    const usersToUpdate = await prisma.user.count({
        where: { teamId: null },
    });

    if (usersToUpdate > 0) {
        console.log(`Found ${usersToUpdate} users without a team. Assigning to PSL Karting...`);
        await prisma.user.updateMany({
            where: { teamId: null },
            data: { teamId: pslTeam.id },
        });
        console.log('Users updated.');
    } else {
        console.log('No orphan users found.');
    }

    // 3. Migrate Submissions
    const submissionsToUpdate = await prisma.submission.count({
        where: { teamId: null },
    });

    if (submissionsToUpdate > 0) {
        console.log(`Found ${submissionsToUpdate} submissions without a team. Assigning to PSL Karting...`);
        await prisma.submission.updateMany({
            where: { teamId: null },
            data: { teamId: pslTeam.id },
        });
        console.log('Submissions updated.');
    } else {
        console.log('No orphan submissions found.');
    }

    console.log('Migration complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
