import {
  User,
  EvidenceItem,
  RelationshipInvite,
  TrustReceipt,
  ProfessionalReference,
  DisputeReport,
  InAppNotification,
  BusinessEntity,
  ReputationBreakdown,
  TrustCommitment,
} from '../types/trust.js';

let currentSessionUserId = localStorage.getItem('aegis_session_user_id') || 'usr_allen_001';

export function setSessionUserId(id: string) {
  currentSessionUserId = id;
  localStorage.setItem('aegis_session_user_id', id);
}

export function getSessionUserId(): string {
  return currentSessionUserId;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': currentSessionUserId,
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Network response was not ok' }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  async getCurrentUser(): Promise<{ user: User }> {
    return request('/api/auth/me');
  },
  async signIn(login: string, targetUserId?: string): Promise<{ user: User; message: string }> {
    const res = await request<{ user: User; message: string }>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ login, targetUserId }),
    });
    setSessionUserId(res.user.id);
    return res;
  },
  async signUp(data: Record<string, any>): Promise<{ user: User; message: string }> {
    const res = await request<{ user: User; message: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setSessionUserId(res.user.id);
    return res;
  },
  async updateProfile(updates: Partial<User>): Promise<{ user: User; message: string }> {
    return request('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  },
  async resetPassword(email: string): Promise<{ message: string }> {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  async getUsersList(): Promise<{ users: Array<{ id: string; username: string; fullName: string; accountType: string; category: string; avatarUrl: string }> }> {
    return request('/api/users/list');
  },

  // Public Profiles
  async getProfiles(params: { q?: string; category?: string; verified?: boolean } = {}): Promise<{ profiles: any[] }> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.category) query.set('category', params.category);
    if (params.verified) query.set('verified', 'true');
    return request(`/api/profiles?${query.toString()}`);
  },
  async getProfileByUsername(username: string): Promise<{
    user: User;
    relationshipCounts: any;
    publicEndorsers: any[];
    publicEvidence: EvidenceItem[];
    publicReceipts: any[];
    references: ProfessionalReference[];
    reputation: ReputationBreakdown;
  }> {
    return request(`/api/profiles/${username}`);
  },

  // Evidence
  async getEvidence(): Promise<{ evidence: EvidenceItem[] }> {
    return request('/api/evidence');
  },
  async addEvidence(data: Partial<EvidenceItem>): Promise<{ item: EvidenceItem }> {
    return request('/api/evidence', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateEvidence(id: string, updates: { isPublic?: boolean; simulateVerification?: boolean }): Promise<{ item: EvidenceItem }> {
    return request(`/api/evidence/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  async deleteEvidence(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/evidence/${id}`, {
      method: 'DELETE',
    });
  },
  async sendPhoneOtp(phone: string): Promise<{ phone: string; sent: boolean; demoOtp: string; message: string }> {
    return request('/api/evidence/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },
  async verifyPhoneOtp(phone: string, code: string): Promise<{ success: boolean; message: string }> {
    return request('/api/evidence/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  },
  async initiateIdentity(method: string, documentNumber: string): Promise<{ success: boolean; status: string; message: string }> {
    return request('/api/evidence/initiate-identity', {
      method: 'POST',
      body: JSON.stringify({ method, documentNumber }),
    });
  },

  // Relationships
  async getRelationships(): Promise<{ relationships: RelationshipInvite[] }> {
    return request('/api/relationships');
  },
  async inviteRelationship(data: {
    recipientName: string;
    recipientContact: string;
    relationshipCategory: string;
    personalNote?: string;
  }): Promise<{ invite: RelationshipInvite; inviteUrl: string; message: string }> {
    return request('/api/relationships/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async getInviteByToken(token: string): Promise<{
    invite: RelationshipInvite;
    inviter: { fullName: string; username: string; avatarUrl: string; headline: string; category: string; identityStatus: string } | null;
  }> {
    return request(`/api/relationships/invite/${token}`);
  },
  async respondToInvite(
    token: string,
    data: {
      decision: 'confirm' | 'reject';
      hasEndorsement?: boolean;
      endorsementText?: string;
      endorsementContext?: string;
      isEndorserPublic?: boolean;
    }
  ): Promise<{ message: string; hasEndorsement?: boolean }> {
    return request(`/api/relationships/invite/${token}/respond`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async deleteRelationship(id: string): Promise<{ message: string }> {
    return request(`/api/relationships/${id}`, {
      method: 'DELETE',
    });
  },

  async getReceipts(): Promise<{ receipts: TrustReceipt[] }> {
    return request('/api/receipts');
  },
  async getPublicReceipts(): Promise<{ receipts: TrustReceipt[] }> {
    return request('/api/receipts?public=true');
  },
  async toggleReceiptVisibility(id: string, isPublic: boolean): Promise<{ receipt: TrustReceipt; message: string }> {
    return request(`/api/receipts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublic }),
    });
  },
  async getReceiptById(id: string): Promise<{ receipt: TrustReceipt }> {
    return request(`/api/receipts/${id}`);
  },
  async createReceipt(data: Partial<TrustReceipt>): Promise<{ receipt: TrustReceipt }> {
    return request('/api/receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async confirmReceipt(id: string): Promise<{ receipt: TrustReceipt; message: string }> {
    return request(`/api/receipts/${id}/confirm`, {
      method: 'POST',
    });
  },
  async completeReceipt(id: string): Promise<{ receipt: TrustReceipt; message: string }> {
    return request(`/api/receipts/${id}/complete`, {
      method: 'POST',
    });
  },
  async disputeReceipt(id: string, reason: string, description: string): Promise<{ receipt: TrustReceipt; message: string }> {
    return request(`/api/receipts/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    });
  },

  // References
  async getReferences(): Promise<{ references: ProfessionalReference[] }> {
    return request('/api/references');
  },
  async submitReference(data: Partial<ProfessionalReference>): Promise<{ reference: ProfessionalReference }> {
    return request('/api/references', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Reputation
  async getReputation(userId: string): Promise<{ breakdown: ReputationBreakdown }> {
    return request(`/api/reputation/${userId}`);
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: InAppNotification[] }> {
    return request('/api/notifications');
  },
  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return request(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  // Business
  async getBusiness(): Promise<{ business: BusinessEntity | null }> {
    return request('/api/business');
  },
  async inviteBusinessTeamMember(name: string, email: string, role: string): Promise<{ business: BusinessEntity; message: string }> {
    return request('/api/business/team', {
      method: 'POST',
      body: JSON.stringify({ name, email, role }),
    });
  },

  // Disputes
  async getDisputes(): Promise<{ disputes: DisputeReport[] }> {
    return request('/api/disputes');
  },
  async submitDispute(data: {
    targetType: 'profile' | 'receipt' | 'endorsement' | 'evidence';
    targetId: string;
    reason: string;
    description: string;
  }): Promise<{ dispute: DisputeReport; message: string }> {
    return request('/api/disputes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Time-Locked Commitments & Trust Pacts
  async getCommitments(filter: 'all' | 'mine' = 'mine'): Promise<{ commitments: TrustCommitment[] }> {
    return request(`/api/commitments?filter=${filter}`);
  },
  async getPublicCommitments(): Promise<{ commitments: TrustCommitment[] }> {
    return request('/api/commitments?public=true');
  },
  async toggleCommitmentVisibility(id: string, isPublic: boolean): Promise<{ commitment: TrustCommitment; message: string }> {
    return request(`/api/commitments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublic }),
    });
  },
  async getCommitment(id: string): Promise<{ commitment: TrustCommitment }> {
    return request(`/api/commitments/${id}`);
  },
  async createCommitment(data: {
    title: string;
    description: string;
    category: string;
    committerId?: string;
    committerUsername?: string;
    deadline: string;
    trustRewardPoints?: number;
    isPublic?: boolean;
  }): Promise<{ commitment: TrustCommitment; message: string }> {
    return request('/api/commitments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async acceptCommitment(
    id: string,
    pledgeNote: string,
    confirmedDeadline?: string
  ): Promise<{ commitment: TrustCommitment; message: string }> {
    return request(`/api/commitments/${id}/accept`, {
      method: 'PUT',
      body: JSON.stringify({ pledgeNote, confirmedDeadline }),
    });
  },
  async fulfillCommitment(id: string): Promise<{ commitment: TrustCommitment; message: string }> {
    return request(`/api/commitments/${id}/fulfill`, {
      method: 'PUT',
    });
  },
  async checkoutCommitment(id: string): Promise<{
    commitment: TrustCommitment;
    receipt: TrustReceipt;
    pointsAwarded: number;
    onTime: boolean;
    message: string;
  }> {
    return request(`/api/commitments/${id}/checkout`, {
      method: 'PUT',
    });
  },

  // GitHub Continuous Repository Sync
  async getGitStatus(): Promise<{
    clean: boolean;
    uncommittedCount: number;
    uncommittedFiles: string[];
    lastCommit: { hash: string; message: string; relativeTime: string; author: string };
    branch: string;
    remoteUrl: string;
    repoName: string;
    lastSyncTime: string | null;
    lastSyncStatus: 'synced' | 'syncing' | 'error';
    lastSyncMessage: string | null;
    pulledCount?: number;
  }> {
    return request('/api/git/status');
  },
  async syncGitRepo(commitMessage?: string): Promise<{
    success: boolean;
    clean: boolean;
    uncommittedCount: number;
    uncommittedFiles: string[];
    lastCommit: { hash: string; message: string; relativeTime: string; author: string };
    branch: string;
    remoteUrl: string;
    repoName: string;
    lastSyncTime: string | null;
    lastSyncStatus: 'synced' | 'syncing' | 'error';
    lastSyncMessage: string | null;
    pulledCount?: number;
  }> {
    return request('/api/git/sync', {
      method: 'POST',
      body: JSON.stringify({ commitMessage }),
    });
  },
  async pullGitRepo(): Promise<{
    success: boolean;
    clean: boolean;
    uncommittedCount: number;
    uncommittedFiles: string[];
    lastCommit: { hash: string; message: string; relativeTime: string; author: string };
    branch: string;
    remoteUrl: string;
    repoName: string;
    lastSyncTime: string | null;
    lastSyncStatus: 'synced' | 'syncing' | 'error';
    lastSyncMessage: string | null;
    pulledCount?: number;
  }> {
    return request('/api/git/pull', {
      method: 'POST',
    });
  },
};

