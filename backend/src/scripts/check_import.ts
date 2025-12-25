
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.submission.count();
    console.log(`Total submissions in DB: ${count}`);

    const recent = await prisma.submission.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
            user: {
                firstName: 'Samuel',
                lastName: { contains: 'Chaverri' }
            }
        },
        select: {
            division: true,
            user: true
        }
    });

    console.log('Recent submissions (Division column check):');
    console.log(recent);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
