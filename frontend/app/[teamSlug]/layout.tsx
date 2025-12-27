import { Metadata } from 'next';

type Props = {
    params: Promise<{ teamSlug: string }>;
    children: React.ReactNode;
};

export async function generateMetadata({ params }: { params: Promise<{ teamSlug: string }> }): Promise<Metadata> {
    const { teamSlug } = await params;

    if (teamSlug === 'psl-karting') {
        return {
            title: 'PSL Karting Setup',
            icons: {
                icon: '/psl-icon.png',
                apple: '/psl-icon.png',
            },
        };
    }

    return {
        title: `${teamSlug.charAt(0).toUpperCase() + teamSlug.slice(1)} Setup App`,
    };
}

export default async function TeamLayout({ children, params }: Props) {
    await params; // Ensure params is resolved if needed, though we don't use teamSlug directly here yet
    return <>{children}</>;
}
