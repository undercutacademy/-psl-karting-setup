"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
function hashPassword(password) {
    return crypto_1.default.createHash('sha256').update(password).digest('hex');
}
async function main() {
    const email = 'pslkartingdata@gmail.com';
    const password = '2fast4you@48';
    const hashedPassword = hashPassword(password);
    console.log(`Setting up manager: ${email}`);
    // First ensure the Team "psl-karting" exists as we might need it
    const teamSlug = 'psl-karting';
    let team = await prisma.team.findUnique({
        where: { slug: teamSlug }
    });
    if (!team) {
        console.log(`Creating default team: ${teamSlug}`);
        team = await prisma.team.create({
            data: {
                slug: teamSlug,
                name: 'PSL Karting',
            }
        });
    }
    const manager = await prisma.user.upsert({
        where: { email },
        update: {
            isManager: true,
            password: hashedPassword,
            teamId: team.id
        },
        create: {
            email,
            firstName: 'PSL',
            lastName: 'Data',
            password: hashedPassword,
            isManager: true,
            teamId: team.id
        },
    });
    console.log('Manager updated/created successfully:');
    console.log(manager);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
