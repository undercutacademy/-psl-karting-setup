"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const NEW_CHAMPIONSHIPS = ['USPKS'];
async function main() {
    const teams = await prisma.team.findMany({
        where: { region: 'NorthAmerica' }
    });
    console.log(`Found ${teams.length} North America team(s)`);
    for (const team of teams) {
        const existingOptions = team.dropdownOptions || {};
        const existingChampionships = existingOptions.championships || [];
        const toAdd = NEW_CHAMPIONSHIPS.filter(c => !existingChampionships.includes(c));
        if (toAdd.length === 0) {
            console.log(`${team.name}: already has all championships, skipping`);
            continue;
        }
        const updatedChampionships = [...existingChampionships, ...toAdd];
        await prisma.team.update({
            where: { id: team.id },
            data: {
                dropdownOptions: {
                    ...existingOptions,
                    championships: updatedChampionships
                }
            }
        });
        console.log(`${team.name}: added ${toAdd.join(', ')}`);
    }
    console.log('Done!');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
