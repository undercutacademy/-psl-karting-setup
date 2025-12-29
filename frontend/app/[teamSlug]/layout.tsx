import { Metadata } from 'next';
import { getTeamInfo } from '@/lib/api';
import fs from 'fs';
import path from 'path';

type Props = {
    params: Promise<{ teamSlug: string }>;
    children: React.ReactNode;
};

export async function generateMetadata({ params }: { params: Promise<{ teamSlug: string }> }): Promise<Metadata> {
    const { teamSlug } = await params;

    // Fetch dynamic team info
    const teamInfo = await getTeamInfo(teamSlug);
    const teamName = teamInfo?.name || teamSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Check if a specific icon exists for this team (e.g., public/tkg-birelart-icon.png)
    const iconFileName = `${teamSlug}-icon.png`;
    const iconPath = path.join(process.cwd(), 'public', iconFileName);
    let iconUrl = '/icon.png'; // Default global icon

    try {
        if (fs.existsSync(iconPath)) {
            iconUrl = `/${iconFileName}`;
        } else {
            // Fallback: check for jpg
            const jpgPath = path.join(process.cwd(), 'public', `${teamSlug}-icon.jpg`);
            if (fs.existsSync(jpgPath)) {
                iconUrl = `/${teamSlug}-icon.jpg`;
            }
        }
    } catch (e) {
        // Ignore file system errors
    }

    if (teamSlug === 'psl-karting') {
        return {
            title: 'PSL Karting Setup',
            icons: {
                icon: '/psl-karting-icon.png',
                apple: '/psl-karting-icon.png',
            },
            openGraph: {
                title: 'PSL Karting Setup',
                description: 'Manage your PSL Karting setups with ease.',
                images: [
                    {
                        url: '/opengraph-image.jpg',
                        width: 800,
                        height: 600,
                        alt: 'PSL Karting Logo',
                    },
                ],
            },
            twitter: {
                card: 'summary_large_image',
                title: 'PSL Karting Setup',
                description: 'Manage your PSL Karting setups with ease.',
                images: ['/opengraph-image.jpg'],
            },
        };
    }

    // We'll try to fetch team info, or fallback to capitalized slug
    // Note: In a layout we might not want to make an async API call if we can avoid it, 
    // but for correct titles it's better. For now simple capitalization is okay as requested.

    // Format slug for display (e.g. tkg-birelart -> Tkg Birelart Setup App)
    const formattedName = teamSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return {
        title: `${teamName} Setup App`,
        icons: {
            icon: iconUrl,
        },
        openGraph: {
            title: `${teamName} Setup App`,
            description: `Manage your ${teamName} setups.`,
        }
    };
}

export default async function TeamLayout({ children, params }: Props) {
    await params; // Ensure params is resolved if needed, though we don't use teamSlug directly here yet
    return <>{children}</>;
}
