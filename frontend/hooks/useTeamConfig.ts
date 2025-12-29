'use client';

import { useState, useEffect } from 'react';
import { TeamConfig } from '@/types/team';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useTeamConfig(teamSlug: string) {
    const [config, setConfig] = useState<TeamConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!teamSlug) {
            setLoading(false);
            return;
        }

        const fetchConfig = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${API_URL}/teams/${teamSlug}/config`);

                if (!response.ok) {
                    throw new Error('Failed to fetch team configuration');
                }

                const data = await response.json();
                setConfig(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                console.error('Error fetching team config:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, [teamSlug]);

    return { config, loading, error };
}

export default useTeamConfig;
