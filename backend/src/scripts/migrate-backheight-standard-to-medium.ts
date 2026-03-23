import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Migrating BackHeight Standard → Medium...');

    // Update all submissions that have backHeight = 'Standard' to 'Medium'
    const result = await prisma.$executeRawUnsafe(
        `UPDATE "Submission" SET "backHeight" = 'Medium' WHERE "backHeight" = 'Standard'`
    );

    console.log(`✅ Updated ${result} submissions from Standard to Medium`);

    // Now remove the 'Standard' value from the BackHeight enum
    // This must be done after all data is migrated
    try {
        await prisma.$executeRawUnsafe(
            `ALTER TYPE "BackHeight" RENAME VALUE 'Standard' TO 'Standard_DEPRECATED'`
        );
        console.log('✅ Renamed Standard enum value to Standard_DEPRECATED');
        console.log('ℹ️  Note: Run "npx prisma db push" after this to fully sync the schema');
    } catch (e: any) {
        if (e.message?.includes('does not exist')) {
            console.log('ℹ️  Standard value already removed from BackHeight enum');
        } else {
            console.error('⚠️  Could not rename enum value (this is expected if already migrated):', e.message);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
