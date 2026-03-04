import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEAMS_CONFIG = [
    {
        name: 'PSL Karting',
        slug: 'psl-karting',
        managerEmails: ['kevin@pslkarting.com', 'pslkartingdata@gmail.com', 'franzparmentier@gmail.com'],
        logoUrl: '/psl-logo.png',
        primaryColor: '#dc2626',
        emailFromName: 'PSL Karting Setups',
        region: 'NorthAmerica'
    },
    {
        name: 'TKG BirelArt',
        slug: 'tkg-birelart',
        managerEmails: ['gavinbayliff@icloud.com', 'finnbayliff@icloud.com', 'data@tkgbirelartusa.com'],
        logoUrl: '/tkg-logo.png',
        primaryColor: '#22c55e',
        emailFromName: 'TKG BirelArt Setups',
        region: 'NorthAmerica'
    },
    {
        name: 'GPM Racing / EmiliaKart',
        slug: 'gpm-emilia',
        managerEmails: ['Birelartpanama@gmail.com'],
        logoUrl: '/GPM_Emilia_logo.png',
        primaryColor: '#dc2626',
        emailFromName: 'GPM Racing / EmiliaKart Setups',
        region: 'CentralAmerica'
    },
    {
        name: 'Demo Motorsport',
        slug: 'demo',
        managerEmails: ['demo@overcut.com'],
        logoUrl: '/demo.png',
        primaryColor: '#dc2626',
        emailFromName: 'Demo Motorsport Setups',
        region: 'NorthAmerica'
    },
    {
        name: 'Bravar Sports',
        slug: 'bravar-sports',
        managerEmails: ['onsmotorsport@gmail.com'],
        logoUrl: '/LOGO_BRAVAR_SPORTS.png',
        primaryColor: '#0047AB',
        emailFromName: 'Bravar Sports Setups',
        region: 'Brazil'
    }
];

async function main() {
    console.log('🔄 Syncing all teams configuration...');

    for (const config of TEAMS_CONFIG) {
        const team = await prisma.team.upsert({
            where: { slug: config.slug },
            update: {
                managerEmails: config.managerEmails,
                emailFromName: config.emailFromName,
                logoUrl: config.logoUrl,
                primaryColor: config.primaryColor,
                region: config.region
            },
            create: {
                ...config
            }
        });
        console.log(`✅ Synced team: ${team.name} (${team.slug})`);
    }

    console.log('\n🎉 Teams sync completed!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
