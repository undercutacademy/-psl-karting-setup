import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
    console.log('🔄 Syncing all manager accounts...');

    // 1. Get Teams
    const pslTeam = await prisma.team.findUnique({ where: { slug: 'psl-karting' } });
    const tkgTeam = await prisma.team.findUnique({ where: { slug: 'tkg-birelart' } });

    if (!pslTeam || !tkgTeam) {
        console.error('❌ Error: Teams not found. Please run team config scripts first.');
        return;
    }

    // 2. Define Users
    const managers = [
        // PSL Karting
        {
            email: 'kevin@pslkarting.com',
            password: 'pslkarting@4140',
            firstName: 'Kevin',
            lastName: 'PSL',
            teamId: pslTeam.id
        },
        {
            email: 'pslkartingdata@gmail.com',
            password: '2fast4you@48',
            firstName: 'PSL',
            lastName: 'Data',
            teamId: pslTeam.id
        },
        {
            email: 'franzparmentier@gmail.com',
            password: 'pslkarting@4140',
            firstName: 'Franz',
            lastName: 'Parmentier',
            teamId: pslTeam.id
        },
        // TKG Birelart
        {
            email: 'data@tkgbirelartusa.com',
            password: 'tkgbirelartusa@setup',
            firstName: 'TKG',
            lastName: 'Data',
            teamId: tkgTeam.id
        },
        {
            email: 'fbayliff@tkgbirelartusa.com',
            password: 'tkgbirelartusa@setup',
            firstName: 'F',
            lastName: 'Bayliff',
            teamId: tkgTeam.id
        },
        {
            email: 'gbayliff@trinitykartinggroup.com',
            password: 'tkgbirelartusa@setup',
            firstName: 'G',
            lastName: 'Bayliff',
            teamId: tkgTeam.id
        }
    ];

    // 3. Upsert Users
    for (const manager of managers) {
        const hashedPassword = hashPassword(manager.password);

        await prisma.user.upsert({
            where: { email: manager.email },
            update: {
                isManager: true,
                password: hashedPassword,
                teamId: manager.teamId,
                firstName: manager.firstName,
                lastName: manager.lastName
            },
            create: {
                email: manager.email,
                password: hashedPassword,
                firstName: manager.firstName,
                lastName: manager.lastName,
                isManager: true,
                teamId: manager.teamId
            }
        });

        console.log(`✅ Synced manager: ${manager.email}`);
    }

    console.log('\n🎉 All manager accounts have been synced successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
