"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const NEW_CHAMPIONSHIPS = ['Latinoamericano'];
const NEW_TRACKS = ['Autodromo Panama - 2', 'P1 Speedway', 'P1 Speedway Rev'];
async function main() {
    const teams = await prisma.team.findMany({
        where: { region: 'CentralAmerica' }
    });
    console.log(`Found ${teams.length} Central America team(s)`);
    for (const team of teams) {
        const existingOptions = team.dropdownOptions || {};
        const existingChampionships = existingOptions.championships || [];
        const existingTracks = existingOptions.tracks || [];
        const championshipsToAdd = NEW_CHAMPIONSHIPS.filter(c => !existingChampionships.includes(c));
        const tracksToAdd = NEW_TRACKS.filter(t => !existingTracks.includes(t));
        if (championshipsToAdd.length === 0 && tracksToAdd.length === 0) {
            console.log(`${team.name}: already up to date, skipping`);
            continue;
        }
        const updatedChampionships = [...existingChampionships, ...championshipsToAdd];
        const updatedTracks = [...existingTracks, ...tracksToAdd];
        await prisma.team.update({
            where: { id: team.id },
            data: {
                dropdownOptions: {
                    ...existingOptions,
                    championships: updatedChampionships,
                    tracks: updatedTracks
                }
            }
        });
        const added = [
            ...championshipsToAdd.map(c => `championship: ${c}`),
            ...tracksToAdd.map(t => `track: ${t}`)
        ];
        console.log(`${team.name}: added ${added.join(', ')}`);
    }
    console.log('Done!');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
