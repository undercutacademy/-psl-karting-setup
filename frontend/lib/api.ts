import { Submission, User } from '@/types/submission';
import { TeamConfig, TeamInfo, TeamManager, SuperuserAccessDuration } from '@/types/team';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type SubmissionAccessLevel = 'full' | 'list';

function managerAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const email = localStorage.getItem('managerEmail') || '';
  return email ? { 'x-manager-email': email } : {};
}

export async function getUserByEmail(email: string, teamSlug: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/users/email/${encodeURIComponent(email)}?teamSlug=${encodeURIComponent(teamSlug)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function getLastSubmissionByEmail(email: string, teamSlug: string): Promise<Submission | null> {
  try {
    const response = await fetch(`${API_URL}/submissions/last/${encodeURIComponent(email)}?teamSlug=${encodeURIComponent(teamSlug)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching last submission:', error);
    return null;
  }
}

export async function createSubmission(submission: Submission, userEmail: string, firstName: string, lastName: string, teamSlug: string): Promise<Submission> {
  try {
    const response = await fetch(`${API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...submission,
        userEmail,
        firstName,
        lastName,
        teamSlug,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create submission' }));
      throw new Error(error.error || 'Failed to create submission');
    }

    return await response.json();
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error('Network error. Please check your connection and try again.');
  }
}

export async function getAllSubmissions(
  teamSlug: string
): Promise<{ submissions: Submission[]; accessLevel: SubmissionAccessLevel }> {
  try {
    const response = await fetch(`${API_URL}/submissions?teamSlug=${encodeURIComponent(teamSlug)}`, {
      headers: managerAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch submissions');
    }
    return await response.json();
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error('Network error. Please check your connection and try again.');
  }
}

export class SuperuserAccessDisabledError extends Error {
  constructor() {
    super('superuser_access_disabled');
    this.name = 'SuperuserAccessDisabledError';
  }
}

export async function getSubmissionById(id: string, teamSlug: string): Promise<Submission> {
  try {
    const response = await fetch(`${API_URL}/submissions/${id}?teamSlug=${encodeURIComponent(teamSlug)}`, {
      headers: managerAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch submission' }));
      if (response.status === 403 && error.error === 'superuser_access_disabled') {
        throw new SuperuserAccessDisabledError();
      }
      throw new Error(error.error || 'Failed to fetch submission');
    }
    return await response.json();
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error('Network error. Please check your connection and try again.');
  }
}

export async function updateSubmission(id: string, submission: Partial<Submission>, teamSlug: string): Promise<Submission> {
  try {
    const response = await fetch(`${API_URL}/submissions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...managerAuthHeaders(),
      },
      body: JSON.stringify({ ...submission, teamSlug }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update submission' }));
      throw new Error(error.error || 'Failed to update submission');
    }

    return await response.json();
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error('Network error. Please check your connection and try again.');
  }
}

// Team API functions
export async function getTeamConfig(teamSlug: string): Promise<TeamConfig | null> {
  try {
    const response = await fetch(`${API_URL}/teams/${encodeURIComponent(teamSlug)}/config`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching team config:', error);
    return null;
  }
}

export async function updateTeamConfig(teamSlug: string, configData: Partial<TeamConfig>): Promise<TeamConfig | null> {
  try {
    const response = await fetch(`${API_URL}/teams/${encodeURIComponent(teamSlug)}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update team config' }));
      throw new Error(error.error || 'Failed to update team config');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating team config:', error);
    throw error;
  }
}

export async function getTeamInfo(teamSlug: string): Promise<TeamInfo | null> {
  try {
    const response = await fetch(`${API_URL}/teams/${encodeURIComponent(teamSlug)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching team info:', error);
    return null;
  }
}

export async function getAllTeams(): Promise<TeamInfo[]> {
  try {
    const response = await fetch(`${API_URL}/teams`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

export async function addTeamManager(
  teamSlug: string,
  managerData: { email: string; firstName: string; lastName: string }
): Promise<{ success: boolean; message: string; manager?: { id: string; email: string; firstName: string; lastName: string; isOwner?: boolean } }> {
  const response = await fetch(`${API_URL}/teams/${encodeURIComponent(teamSlug)}/managers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...managerAuthHeaders(),
    },
    body: JSON.stringify(managerData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to add manager');
  }
  return data;
}

export async function listTeamManagers(teamSlug: string): Promise<TeamManager[]> {
  const response = await fetch(`${API_URL}/teams/${encodeURIComponent(teamSlug)}/managers`, {
    headers: managerAuthHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load managers');
  }
  return data.managers as TeamManager[];
}

export async function deleteTeamManager(teamSlug: string, userId: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/teams/${encodeURIComponent(teamSlug)}/managers/${encodeURIComponent(userId)}`,
    { method: 'DELETE', headers: managerAuthHeaders() }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to remove manager');
  }
}

export async function resendManagerAccess(
  teamSlug: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_URL}/teams/${encodeURIComponent(teamSlug)}/managers/${encodeURIComponent(userId)}/resend-access`,
    { method: 'POST', headers: managerAuthHeaders() }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to resend access');
  }
  return data;
}

export async function setSuperuserAccess(
  teamSlug: string,
  duration: SuperuserAccessDuration | null
): Promise<{ success: boolean; superuserAccessExpiresAt: string | null }> {
  const response = await fetch(`${API_URL}/teams/${encodeURIComponent(teamSlug)}/superuser-access`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...managerAuthHeaders(),
    },
    body: JSON.stringify({ duration }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update superuser access');
  }
  return data;
}

export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const managerEmail = localStorage.getItem('managerEmail');
  const response = await fetch(`${API_URL}/auth/manager/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-manager-email': managerEmail || '',
    },
    body: JSON.stringify({ email, currentPassword, newPassword }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to change password');
  }
  return data;
}
