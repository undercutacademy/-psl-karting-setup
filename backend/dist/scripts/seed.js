"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
// Simple password hashing (matches auth.ts)
function hashPassword(password) {
    return crypto_1.default.createHash('sha256').update(password).digest('hex');
}
async function main() {
    // Get manager credentials from environment or use defaults
    const managerEmail = process.env.MANAGER_EMAIL || 'manager@example.com';
    const managerPassword = process.env.MANAGER_PASSWORD || 'pslkarting2024';
    const hashedPassword = hashPassword(managerPassword);
    const manager = await prisma.user.upsert({
        where: { email: managerEmail },
        update: {
            isManager: true,
            password: hashedPassword,
        },
        create: {
            email: managerEmail,
            firstName: 'Manager',
            lastName: 'User',
            password: hashedPassword,
            isManager: true,
        },
    });
    console.log('Manager user created/updated:', {
        id: manager.id,
        email: manager.email,
        firstName: manager.firstName,
        lastName: manager.lastName,
        isManager: manager.isManager,
    });
    console.log('\n=== Manager Login Credentials ===');
    console.log(`Email: ${managerEmail}`);
    console.log(`Password: ${managerPassword}`);
    console.log('=================================\n');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
