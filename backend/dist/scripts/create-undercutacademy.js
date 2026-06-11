"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const slugs = ['demo', 'primepowerteam', 'psl-karting', 'tkg-birelart'];
    for (const slug of slugs) {
        await prisma.team.update({
            where: { slug },
            data: { region: 'NorthAmerica' },
        });
        console.log(`✅ Set ${slug} -> NorthAmerica`);
    }
    // Remove the accidentally created team
    try {
        await prisma.team.delete({ where: { slug: 'undercutacademy' } });
        console.log('🗑️  Deleted undercutacademy team');
    }
    catch {
        console.log('ℹ️  undercutacademy already removed or not found');
    }
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
