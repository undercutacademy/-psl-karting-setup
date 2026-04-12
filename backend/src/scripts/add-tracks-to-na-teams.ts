import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_TRACKS = ['Tucson', 'Lorraine'];

async function main() {
    // Find all NorthAmerica teams (or teams without a region, which default to NorthAmerica)
    const teams = await prisma.team.findMany({
        where: { region: 'NorthAmerica' }
    });

    console.log(`Found ${teams.length} North America team(s)`);

    for (const team of teams) {
        const existingOptions = (team.dropdownOptions as any) || {};
        const existingTracks: string[] = existingOptions.tracks || [];

        const tracksToAdd = NEW_TRACKS.filter(t => !existingTracks.includes(t));

        if (tracksToAdd.length === 0) {
            console.log(`${team.name}: already has all tracks, skipping`);
            continue;
        }

        const updatedTracks = [...existingTracks, ...tracksToAdd];

        await prisma.team.update({
            where: { id: team.id },
            data: {
                dropdownOptions: {
                    ...existingOptions,
                    tracks: updatedTracks
                }
            }
        });

        console.log(`${team.name}: added ${tracksToAdd.join(', ')}`);
    }

    console.log('Done!');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
