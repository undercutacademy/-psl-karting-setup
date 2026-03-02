import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const team = await prisma.team.update({
        where: { slug: 'bravar-sports' },
        data: { defaultLanguage: 'pt' } as any,
    });
    console.log(`Updated ${team.name} to language: pt`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
