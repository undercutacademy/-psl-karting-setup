'use client';

import { createContext, useContext } from 'react';
import { TeamConfig } from '@/types/team';

const TeamConfigContext = createContext<TeamConfig | null>(null);

export function TeamConfigProvider({
  config,
  children,
}: {
  config: TeamConfig | null;
  children: React.ReactNode;
}) {
  return (
    <TeamConfigContext.Provider value={config}>
      {children}
    </TeamConfigContext.Provider>
  );
}

export function useTeamConfigContext() {
  return useContext(TeamConfigContext);
}
