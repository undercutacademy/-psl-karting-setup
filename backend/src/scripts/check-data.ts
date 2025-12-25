import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking database status...');

    // 1. Check Team
    const team = await prisma.team.findUnique({
        where: { slug: 'psl-karting' },
        include: {
            _count: {
                select: { submissions: true, users: true }
            }
        }
    });

    if (!team) {
        console.log('❌ ERROR: Team "psl-karting" not found!');
    } else {
        console.log(`✅ Team Found: ${team.name}`);
        console.log(`   - ID: ${team.id}`);
        console.log(`   - Users count: ${team._count.users}`);
        console.log(`   - Submissions count: ${team._count.submissions}`);
    }

    // 2. Check Unassigned Data
    const unassignedSubmissions = await prisma.submission.count({
        where: { teamId: null }
    });

    if (unassignedSubmissions > 0) {
        console.log(`⚠️ WARNING: Found ${unassignedSubmissions} submissions not assigned to any team.`);
    } else {
        console.log('✅ All submissions are correctly assigned to a team.');
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
