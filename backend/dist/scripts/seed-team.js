"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding PSL Karting team...');
    // 1. Create the Team
    // Use 'psl-karting' to match the URL you are using locally
    const team = await prisma.team.upsert({
        where: { slug: 'psl-karting' },
        update: {},
        create: {
            name: 'PSL Karting',
            slug: 'psl-karting',
        },
    });
    console.log(`Team '${team.name}' (slug: ${team.slug}) ready with ID: ${team.id}`);
    // 2. Assign all current users to this team (if not already assigned)
    const usersUpdate = await prisma.user.updateMany({
        where: { teamId: null },
        data: { teamId: team.id },
    });
    console.log(`Updated ${usersUpdate.count} users to '${team.name}'.`);
    // 3. Assign all current submissions to this team
    const submissionsUpdate = await prisma.submission.updateMany({
        where: { teamId: null },
        data: { teamId: team.id },
    });
    console.log(`Updated ${submissionsUpdate.count} submissions to '${team.name}'.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
