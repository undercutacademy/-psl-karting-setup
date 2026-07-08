"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const NEW_CHAMPIONSHIPS = ['Club'];
const NEW_TRACKS = ['Badger Kart Club National', 'Badger Kart Club Classic', 'Norway Motorsports Park'];
async function main() {
    const teams = await prisma_1.prisma.team.findMany({
        where: { region: 'NorthAmerica' }
    });
    console.log(`Found ${teams.length} North America team(s)`);
    for (const team of teams) {
        const existingOptions = team.dropdownOptions || {};
        const existingChampionships = existingOptions.championships || [];
        const existingTracks = existingOptions.tracks || [];
        const championshipsToAdd = NEW_CHAMPIONSHIPS.filter(c => !existingChampionships.includes(c));
        const tracksToAdd = NEW_TRACKS.filter(t => !existingTracks.includes(t));
        if (championshipsToAdd.length === 0 && tracksToAdd.length === 0) {
            console.log(`${team.name}: already has all new options, skipping`);
            continue;
        }
        const updatedChampionships = [...existingChampionships, ...championshipsToAdd];
        const updatedTracks = [...existingTracks, ...tracksToAdd];
        await prisma_1.prisma.team.update({
            where: { id: team.id },
            data: {
                dropdownOptions: {
                    ...existingOptions,
                    championships: updatedChampionships,
                    tracks: updatedTracks
                }
            }
        });
        const added = [];
        if (championshipsToAdd.length)
            added.push(`championships: ${championshipsToAdd.join(', ')}`);
        if (tracksToAdd.length)
            added.push(`tracks: ${tracksToAdd.join(', ')}`);
        console.log(`${team.name}: added ${added.join(' | ')}`);
    }
    console.log('Done!');
}
main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma_1.prisma.$disconnect(); });
