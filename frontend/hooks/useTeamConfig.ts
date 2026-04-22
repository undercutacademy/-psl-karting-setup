'use client';

import { useTeamConfigContext } from '@/components/TeamConfigProvider';

export function useTeamConfig(_teamSlug?: string) {
    const config = useTeamConfigContext();
    return { config, loading: false, error: null as string | null };
}

export default useTeamConfig;
