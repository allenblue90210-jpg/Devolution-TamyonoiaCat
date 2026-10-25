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
  GoodFaithRating,
  ProfileImpressions,
  PactComment,
  PactRating,
  ReceiptRating,
  ReceiptComment,
  RememberRecord,
  RememberCorroboration,
  RecordedLedgerEntry,
  LedgerStats,
} from '../types/trust.js';

let currentSessionUserId = localStorage.getItem('aegis_session_user_id') || 'guest';

export function setSessionUserId(id: string) {
  currentSessionUserId = id;
  localStorage.setItem('aegis_session_user_id', id);
}

export function saveActiveUser(user: User | null) {
  if (user && user.id) {
    currentSessionUserId = user.id;
    localStorage.setItem('aegis_session_user_id', user.id);
    try {
      localStorage.setItem('devolution_active_user', JSON.stringify(user));
    } catch {
      // ignore
    }
  } else {
    clearSessionUserId();
  }
}

export function getCachedActiveUser(): User | null {
  try {
    const raw = localStorage.getItem('devolution_active_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.id !== 'guest') {
      currentSessionUserId = parsed.id;
      return parsed as User;
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearSessionUserId() {
  currentSessionUserId = 'guest';
  localStorage.setItem('aegis_session_user_id', 'guest');
  localStorage.removeItem('devolution_active_user');
}

export function getSessionUserId(): string {
  return currentSessionUserId;
}

// Clean slate: purge any stale test/mock pacts and receipts from browser storage
if (typeof window !== 'undefined') {
  try {
    const purgeFlag = localStorage.getItem('devolution_vault_purged_mock_v2');
    if (!purgeFlag) {
      localStorage.removeItem('devolution_vault_commitments');
      localStorage.removeItem('devolution_vault_receipts');
      localStorage.setItem('devolution_vault_purged_mock_v2', 'true');
    }
  } catch {
    // ignore
  }
}

function cacheVaultItems(key: string, items: any[]) {
  try {
    const raw = localStorage.getItem(key);
    const existing = raw ? JSON.parse(raw) : {};
    for (const it of items) {
      if (it && it.id) {
        existing[it.id] = it;
      }
    }
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

function getCachedVaultList(key: string): any[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const obj = JSON.parse(raw);
    return Object.values(obj);
  } catch {
    return [];
  }
}

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const customUrl = localStorage.getItem('devolution_api_server_url');
  if (customUrl) return customUrl.replace(/\/$/, '');
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  return '';
}

export function setApiBaseUrl(url: string) {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('devolution_api_server_url');
    } else {
      localStorage.setItem('devolution_api_server_url', url.trim());
    }
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': currentSessionUserId,
    ...(options.headers as Record<string, string>),
  };

  const baseUrl = getApiBaseUrl();
  const targetUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  try {
    const res = await fetch(targetUrl, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    const rawText = await res.text();

    // Check if the response is HTML (happens when dev server or proxy returns index.html)
    const isHtml =
      contentType.includes('text/html') ||
      rawText.trim().startsWith('<!doctype') ||
      rawText.trim().startsWith('<html');

    if (isHtml) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return request<T>(endpoint, options, retries - 1);
      }
      throw new Error(`Server returned HTML instead of JSON for ${endpoint}. Backend service may still be warming up.`);
    }

    let parsedData: any = {};
    if (rawText.trim()) {
      try {
        parsedData = JSON.parse(rawText);
      } catch {
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          return request<T>(endpoint, options, retries - 1);
        }
        throw new Error(`Invalid JSON response from ${endpoint}: ${rawText.slice(0, 100)}`);
      }
    }

    if (!res.ok) {
      throw new Error(parsedData?.error || `HTTP error ${res.status}`);
    }

    return parsedData as T;
  } catch (err: any) {
    if (retries > 0 && (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('HTML instead of JSON'))) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return request<T>(endpoint, options, retries - 1);
    }
    throw err;
  }
}

export const api = {
  // Auth
  async getCurrentUser(): Promise<{ user: User | null }> {
    return request('/api/auth/me');
  },
  async logout(): Promise<{ success: boolean; message: string }> {
    clearSessionUserId();
    return request('/api/auth/logout', { method: 'POST' });
  },
  async switchUser(userId: string): Promise<{ user: User; message: string }> {
    const res = await request<{ user: User; message: string }>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ targetUserId: userId }),
    });
    saveActiveUser(res.user);
    return res;
  },
  async signIn(login: string, passwordOrTargetUserId?: string, targetUserId?: string): Promise<{ user: User; message: string }> {
    let resolvedPassword = '';
    let resolvedTargetUserId = targetUserId;

    // Overloaded call: signIn('', 'usr_xxx')
    if (passwordOrTargetUserId && (!targetUserId && (!login || passwordOrTargetUserId.startsWith('usr_')))) {
      resolvedTargetUserId = passwordOrTargetUserId;
    } else {
      resolvedPassword = passwordOrTargetUserId || '';
    }

    const res = await request<{ user: User; message: string }>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        login: login || undefined,
        password: resolvedPassword || undefined,
        targetUserId: resolvedTargetUserId,
      }),
    });
    saveActiveUser(res.user);
    return res;
  },
  async loginWithSupabaseEmail(email: string, password?: string): Promise<{ user: User; message: string }> {
    const res = await request<{ user: User; message: string }>('/api/auth/supabase-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveActiveUser(res.user);
    return res;
  },
  async assignRealUser(email = 'allenkinetic004@gmail.com'): Promise<{ user: User; message: string }> {
    const res = await request<{ user: User; message: string }>('/api/auth/assign-real-user', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    saveActiveUser(res.user);
    return res;
  },
  async sendMagicLink(email: string): Promise<{ success: boolean; message: string }> {
    return request('/api/auth/send-magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  async sessionFromToken(accessToken: string): Promise<{ user: User; message: string }> {
    const res = await request<{ user: User; message: string }>('/api/auth/session-from-token', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });
    saveActiveUser(res.user);
    return res;
  },
  async signUp(data: Record<string, any>): Promise<{ user: User; message: string }> {
    const res = await request<{ user: User; message: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    saveActiveUser(res.user);
    return res;
  },
  async updateProfile(updates: Partial<User>): Promise<{ user: User; message: string }> {
    const res = await request<{ user: User; message: string }>('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
    if (res?.user) {
      saveActiveUser(res.user);
    }
    return res;
  },
  async uploadAvatar(avatarUrl: string): Promise<{ success: boolean; user: User; message: string }> {
    const res = await request<{ success: boolean; user: User; message: string }>('/api/user/upload-avatar', {
      method: 'POST',
      body: JSON.stringify({ avatarUrl }),
    });
    if (res?.user) {
      saveActiveUser(res.user);
    }
    return res;
  },
  async resetPassword(email: string): Promise<{ message: string }> {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; message: string }>('/api/users/me', {
      method: 'DELETE',
    });
    clearSessionUserId();
    return res;
  },
  async reportContent(targetType: string, targetId: string, reason: string, description?: string): Promise<{ success: boolean; message: string }> {
    return request('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId, reason, description }),
    });
  },
  async blockUser(blockedUserId: string): Promise<{ success: boolean; message: string }> {
    return request('/api/users/block', {
      method: 'POST',
      body: JSON.stringify({ blockedUserId }),
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
  async quickVerifyIdentity(method?: string): Promise<{ success: boolean; user: User; message: string }> {
    return request('/api/users/quick-verify', {
      method: 'POST',
      body: JSON.stringify({ method }),
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

  async getReceipts(filter?: string): Promise<{ receipts: TrustReceipt[] }> {
    const q = filter ? `?filter=${encodeURIComponent(filter)}` : '';
    const res = await request<{ receipts: TrustReceipt[] }>(`/api/receipts${q}`);
    if (res && res.receipts) {
      cacheVaultItems('devolution_vault_receipts', res.receipts);
      const cached = getCachedVaultList('devolution_vault_receipts');
      if (cached.length > res.receipts.length) {
        request('/api/vault/reconcile', {
          method: 'POST',
          body: JSON.stringify({ receipts: cached }),
        }).catch(() => {});
      }
    }
    return res;
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
    const res = await request<{ receipt: TrustReceipt }>('/api/receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res && res.receipt) {
      cacheVaultItems('devolution_vault_receipts', [res.receipt]);
    }
    return res;
  },
  async updateReceipt(id: string, data: any): Promise<{ receipt: TrustReceipt; message: string }> {
    return request(`/api/receipts/${id}`, {
      method: 'PATCH',
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
  async markAllNotificationsRead(): Promise<{ success: boolean; message: string }> {
    return request('/api/notifications/read-all', {
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
    const res = await request<{ commitments: TrustCommitment[] }>(`/api/commitments?filter=${filter}`);
    if (res && res.commitments) {
      cacheVaultItems('devolution_vault_commitments', res.commitments);
      const cached = getCachedVaultList('devolution_vault_commitments');
      if (cached.length > res.commitments.length) {
        request('/api/vault/reconcile', {
          method: 'POST',
          body: JSON.stringify({ commitments: cached }),
        }).catch(() => {});
      }
    }
    return res;
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
  async updateCommitment(id: string, data: any): Promise<{ commitment: TrustCommitment; message: string }> {
    return request(`/api/commitments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  async getCommitment(id: string): Promise<{ commitment: TrustCommitment }> {
    return request(`/api/commitments/${id}`);
  },
  async createCommitment(data: {
    title: string;
    description: string;
    category: string;
    otherCategoryDetails?: string;
    committerId?: string;
    committerUsername?: string;
    committerName?: string;
    deadline: string;
    trustRewardPoints?: number;
    creatorRole?: 'promisor' | 'requester';
    pledgeNote?: string;
    promisedUserId?: string;
    isPublic?: boolean;
  }): Promise<{ commitment: TrustCommitment; message: string }> {
    const res = await request<{ commitment: TrustCommitment; message: string }>('/api/commitments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res && res.commitment) {
      cacheVaultItems('devolution_vault_commitments', [res.commitment]);
    }
    return res;
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
  async checkoutCommitment(
    id: string,
    ratingPercent: number = 100,
    ratingBadge?: string,
    extra?: {
      starRating?: number;
      comment?: string;
      ratedUserId?: string;
    }
  ): Promise<{
    commitment: TrustCommitment;
    receipt: TrustReceipt;
    pointsAwarded: number;
    onTime: boolean;
    message: string;
  }> {
    return request(`/api/commitments/${id}/checkout`, {
      method: 'PUT',
      body: JSON.stringify({ ratingPercent, ratingBadge, ...extra }),
    });
  },
  async addCommitmentComment(
    id: string,
    text: string,
    ratingPercent?: 100 | 50 | null
  ): Promise<{
    comment: PactComment;
    commitment: TrustCommitment;
    message: string;
  }> {
    return request(`/api/commitments/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, ratingPercent }),
    });
  },
  async rateCommitment(
    id: string,
    ratingPercent: 100 | 50,
    ratingBadge?: string
  ): Promise<{
    commitment: TrustCommitment;
    message: string;
  }> {
    return request(`/api/commitments/${id}/rate`, {
      method: 'PUT',
      body: JSON.stringify({ ratingPercent, ratingBadge }),
    });
  },
  async recordCommitmentImpression(
    id: string,
    action: 'view' | 'witness' = 'witness'
  ): Promise<{ commitment: TrustCommitment; message: string }> {
    return request(`/api/commitments/${id}/impression`, {
      method: 'POST',
      body: JSON.stringify({ action }),
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
    hasToken?: boolean;
    tokenMasked?: string | null;
  }> {
    return request('/api/git/status');
  },
  async setGitToken(token: string): Promise<{
    success: boolean;
    message: string;
    hasToken?: boolean;
    tokenMasked?: string | null;
  }> {
    return request('/api/git/token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
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
    hasToken?: boolean;
    tokenMasked?: string | null;
  }> {
    return request('/api/git/sync', {
      method: 'POST',
      body: JSON.stringify({ commitMessage }),
    });
  },
  async syncGit(commitMessage?: string) {
    return this.syncGitRepo(commitMessage);
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
    hasToken?: boolean;
    tokenMasked?: string | null;
  }> {
    return request('/api/git/pull', {
      method: 'POST',
    });
  },
  async getRatings(target?: string): Promise<{
    ratings: GoodFaithRating[];
    averageRating: number;
    totalRatings: number;
    impressions: number;
    witnessCount: number;
  }> {
    const q = target ? `?target=${encodeURIComponent(target)}` : '';
    return request(`/api/ratings${q}`);
  },
  async createRating(data: {
    targetUserId?: string;
    targetUsername?: string;
    authorName?: string;
    authorTitle?: string;
    rating: number;
    goodFaithBadge?: string;
    comment: string;
    context?: string;
  }): Promise<{ rating: GoodFaithRating; message: string }> {
    return request('/api/ratings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async markRatingHelpful(id: string): Promise<{ rating: GoodFaithRating; message: string }> {
    return request(`/api/ratings/${id}/helpful`, {
      method: 'POST',
    });
  },
  async recordImpression(
    targetId: string = 'network',
    isWitness: boolean = false
  ): Promise<ProfileImpressions> {
    return request('/api/impressions', {
      method: 'POST',
      body: JSON.stringify({ targetId, isWitness }),
    });
  },
  async getImpressions(targetId: string = 'network'): Promise<ProfileImpressions> {
    return request(`/api/impressions/${encodeURIComponent(targetId)}`);
  },

  // Trust Receipts Rating & Reviews
  async rateReceipt(
    id: string,
    rating: number,
    badge?: string,
    comment?: string
  ): Promise<{ rating: ReceiptRating; receipt: TrustReceipt; message: string }> {
    return request(`/api/receipts/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, badge, comment }),
    });
  },

  async addReceiptComment(
    id: string,
    text: string,
    ratingPercent?: 100 | 50 | null
  ): Promise<{ comment: ReceiptComment; receipt: TrustReceipt; message: string }> {
    return request(`/api/receipts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, ratingPercent }),
    });
  },

  // Comprehensive Pact Review & Rating
  async ratePactReview(
    id: string,
    rating: number,
    ratingPercent?: number,
    badge?: string,
    comment?: string
  ): Promise<{ rating: PactRating; commitment: TrustCommitment; message: string }> {
    return request(`/api/commitments/${id}/rate-review`, {
      method: 'POST',
      body: JSON.stringify({ rating, ratingPercent, badge, comment }),
    });
  },

  // Remember & Evidence Ledger API
  async getRememberRecords(params: { tag?: string; filter?: string; q?: string } = {}): Promise<{
    records: RememberRecord[];
    count: number;
  }> {
    const q = new URLSearchParams();
    if (params.tag && params.tag !== 'all') q.set('tag', params.tag);
    if (params.filter) q.set('filter', params.filter);
    if (params.q) q.set('q', params.q);
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request(`/api/remember${queryStr}`);
  },

  async getRememberRecordById(id: string): Promise<{ record: RememberRecord }> {
    return request(`/api/remember/${id}`);
  },

  async createRememberRecord(data: Partial<RememberRecord>): Promise<{
    record: RememberRecord;
    message: string;
  }> {
    return request('/api/remember', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reviewRememberRecord(
    id: string,
    verdict: 'verified_corroborated' | 'contested' | 'under_review',
    verdictComment: string,
    ratingScore?: number
  ): Promise<{ record: RememberRecord; message: string }> {
    return request(`/api/remember/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ verdict, verdictComment, ratingScore }),
    });
  },

  async corroborateRememberRecord(
    id: string,
    verdict: 'corroborated' | 'neutral' | 'refuted',
    note: string,
    evidenceName?: string
  ): Promise<{ record: RememberRecord; corroboration: RememberCorroboration; message: string }> {
    return request(`/api/remember/${id}/corroborate`, {
      method: 'POST',
      body: JSON.stringify({ verdict, note, evidenceName }),
    });
  },

  // Supabase Cloud Backend Management
  async getSupabaseStatus(): Promise<{
    url: string;
    key: string;
    configured: boolean;
    status: 'connected' | 'unconfigured' | 'error' | 'syncing';
    lastSyncTime: string | null;
    lastMessage: string | null;
    testResult?: { success: boolean; message: string; hasStateTable?: boolean };
  }> {
    return request('/api/supabase/status');
  },
  async configureSupabase(url: string, key?: string): Promise<{
    success: boolean;
    url: string;
    key: string;
    configured: boolean;
    status: 'connected' | 'unconfigured' | 'error' | 'syncing';
    lastSyncTime: string | null;
    lastMessage: string | null;
  }> {
    return request('/api/supabase/config', {
      method: 'POST',
      body: JSON.stringify({ url, key }),
    });
  },
  async testSupabase(): Promise<{
    success: boolean;
    message: string;
    hasStateTable?: boolean;
  }> {
    return request('/api/supabase/test', {
      method: 'POST',
    });
  },
  async syncToSupabase(): Promise<{
    success: boolean;
    message: string;
    syncedAt?: string;
  }> {
    return request('/api/supabase/sync', {
      method: 'POST',
    });
  },
  async pullFromSupabase(): Promise<{
    success: boolean;
    message: string;
  }> {
    return request('/api/supabase/pull', {
      method: 'POST',
    });
  },
  async getSupabaseSchema(): Promise<string> {
    const res = await fetch('/api/supabase/schema');
    return res.text();
  },

  // Immutable Recorded Ledger API
  async getLedgerRecords(params?: {
    type?: string;
    isPublicOnly?: boolean;
    targetId?: string;
    search?: string;
    limit?: number;
  }): Promise<{ records: RecordedLedgerEntry[]; total: number }> {
    const q = new URLSearchParams();
    if (params?.type && params.type !== 'all') q.set('type', params.type);
    if (params?.isPublicOnly) q.set('public', 'true');
    if (params?.targetId) q.set('targetId', params.targetId);
    if (params?.search) q.set('q', params.search);
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request(`/api/ledger/records${qs}`);
  },

  async getLedgerStats(): Promise<{ stats: LedgerStats }> {
    return request('/api/ledger/stats');
  },

  async recordLedgerAttestation(data: {
    targetId?: string;
    targetTitle: string;
    category?: string;
    summary: string;
    isPublic?: boolean;
    metadata?: Record<string, any>;
  }): Promise<{ record: RecordedLedgerEntry; message: string }> {
    return request('/api/ledger/record', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getVaultStats(): Promise<{
    vaultStatus: string;
    totalPacts: number;
    totalReceipts: number;
    permanentStorage: string;
    gitSyncActive: boolean;
    lastSyncTime: string;
    lastSyncStatus: string;
    lastSyncMessage: string;
  }> {
    return request('/api/vault/stats');
  },

  async reconcileVault(): Promise<{
    success: boolean;
    restoredPacts: number;
    restoredReceipts: number;
    totalCommitments: number;
    totalReceipts: number;
  }> {
    const commitments = getCachedVaultList('devolution_vault_commitments');
    const receipts = getCachedVaultList('devolution_vault_receipts');
    return request('/api/vault/reconcile', {
      method: 'POST',
      body: JSON.stringify({ commitments, receipts }),
    });
  },

  async clearMockPactsAndReceipts(): Promise<{ success: boolean; message: string }> {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('devolution_vault_commitments');
        localStorage.removeItem('devolution_vault_receipts');
      } catch {
        // ignore
      }
    }
    return request('/api/vault/clear-mocks', {
      method: 'POST',
    });
  },
};

