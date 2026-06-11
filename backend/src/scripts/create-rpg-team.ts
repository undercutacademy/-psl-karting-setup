import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Branding extracted from https://rolisonperformancegroup.com/
// (pink #ec008c is the dominant accent; navy #2c337b and black carried by logo/icon)
const RPG_CONFIG = {
    managerEmails: [] as string[],
    logoUrl: '/RPG_Logo.png',
    primaryColor: '#ec008c',
    emailFromName: 'Rolison Performance Group Setups',
    region: 'NorthAmerica',
    defaultLanguage: 'en',
};

async function main() {
    console.log('Creating/Updating RPG (Rolison Performance Group) team...');

    // Same fields as HOTZ for now — copy its live form configuration
    const hotz = await prisma.team.findUnique({ where: { slug: 'hotz' } });
    if (!hotz) {
        throw new Error("Team 'hotz' not found — cannot copy its form configuration");
    }

    const copied = {
        formConfig: (hotz.formConfig ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        dropdownOptions: (hotz.dropdownOptions ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        customLabels: (hotz.customLabels ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    };

    const team = await prisma.team.upsert({
        where: { slug: 'rpg' },
        update: {
            ...RPG_CONFIG,
            ...copied,
        },
        create: {
            name: 'Rolison Performance Group',
            slug: 'rpg',
            ...RPG_CONFIG,
            ...copied,
        },
    });

    console.log(`✅ Team '${team.name}' ready (Slug: ${team.slug})`);
    console.log(`   primaryColor: ${team.primaryColor}, logo: ${team.logoUrl}`);
    console.log(`   formConfig copied from HOTZ:`, JSON.stringify(team.formConfig));
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
