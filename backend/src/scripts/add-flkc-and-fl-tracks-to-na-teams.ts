import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_CHAMPIONSHIPS = ['FLKC - Florida Karting Championship'];
const NEW_TRACKS = ['Monticello Karting', 'Bushnell Motorsport Park', 'Jacksonville NFKC'];

async function main() {
    const teams = await prisma.team.findMany({
        where: { region: 'NorthAmerica' }
    });

    console.log(`Found ${teams.length} North America team(s)`);

    for (const team of teams) {
        const existingOptions = (team.dropdownOptions as any) || {};
        const existingChampionships: string[] = existingOptions.championships || [];
        const existingTracks: string[] = existingOptions.tracks || [];

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
