import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
    const email = 'undercutacademy@gmail.com';
    const password = 'Undercut@7748';
    const hashedPassword = hashPassword(password);

    console.log(`Creating superuser: ${email}`);

    const superuser = await prisma.user.upsert({
        where: { email },
        update: {
            isManager: true,
            isSuperAdmin: true,
            password: hashedPassword,
        },
        create: {
            email,
            firstName: 'Undercut',
            lastName: 'Academy',
            password: hashedPassword,
            isManager: true,
            isSuperAdmin: true,
            // No teamId - superadmin can access all teams
        },
    });

    console.log('✅ Superuser created/updated successfully:');
    console.log(`   Email: ${superuser.email}`);
    console.log(`   Name: ${superuser.firstName} ${superuser.lastName}`);
    console.log(`   isSuperAdmin: ${superuser.isSuperAdmin}`);
    console.log('\n=== Login Credentials ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('=========================\n');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
