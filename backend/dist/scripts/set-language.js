"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const team = await prisma.team.update({
        where: { slug: 'bravar-sports' },
        data: { defaultLanguage: 'pt' },
    });
    console.log(`Updated ${team.name} to language: pt`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
