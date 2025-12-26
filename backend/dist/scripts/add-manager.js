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
async function addManager() {
    // Get manager info from command line arguments
    const args = process.argv.slice(2);
    if (args.length < 4) {
        console.log('\n=== Add New Manager ===');
        console.log('Usage: npx ts-node src/scripts/add-manager.ts <email> <password> <firstName> <lastName>');
        console.log('\nExample:');
        console.log('  npx ts-node src/scripts/add-manager.ts john@example.com mypassword123 John Doe');
        console.log('');
        process.exit(1);
    }
    const [email, password, firstName, lastName] = args;
    const hashedPassword = hashPassword(password);
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            // Update existing user to be a manager
            const manager = await prisma.user.update({
                where: { email },
                data: {
                    isManager: true,
                    password: hashedPassword,
                    firstName,
                    lastName,
                },
            });
            console.log('\n✅ Existing user upgraded to manager:');
            console.log(`   Email: ${manager.email}`);
            console.log(`   Name: ${manager.firstName} ${manager.lastName}`);
        }
        else {
            // Create new manager
            const manager = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    isManager: true,
                },
            });
            console.log('\n✅ New manager created:');
            console.log(`   Email: ${manager.email}`);
            console.log(`   Name: ${manager.firstName} ${manager.lastName}`);
        }
        console.log('\n=== Login Credentials ===');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('=========================\n');
    }
    catch (error) {
        console.error('Error creating manager:', error);
        process.exit(1);
    }
}
addManager()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
