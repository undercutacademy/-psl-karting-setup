import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'pslkartingdata@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
    });

    console.log('User found:', user);

    if (user) {
        console.log('isManager:', user.isManager);
        console.log('Has password:', !!user.password);
    } else {
        console.log('User not found in database.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
