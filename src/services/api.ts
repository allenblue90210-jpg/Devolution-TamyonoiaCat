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

let currentSessionUserId = localStorage.getItem('aegis_session_user_id') || 'usr_allen_006';

export function setSessionUserId(id: string) {
  currentSessionUserId = id;
  localStorage.setItem('aegis_session_user_id', id);
}

export function clearSessionUserId() {
  currentSessionUserId = 'guest';
  localStorage.setItem('aegis_session_user_id', 'guest');
}

export function getSessionUserId(): string {
  return currentSessionUserId;
}

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': currentSessionUserId,
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(endpoint, {
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
    setSessionUserId(res.user.id);
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
    setSessionUserId(res.user.id);
    return res;
  },
  async loginWithSupabaseEmail(email: string, password?: string): Promise<{ user: User; message: string }> {
    const res = await request<{ user: User; message: string }>('/api/auth/supabase-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setSessionUserId(res.user.id);
    return res;
  },
  async assignRealUser(email = 'allenkinetic004@gmail.com'): Promise<{ user: User; message: string }> {
    const res = await request<{ user: User; message: string }>('/api/auth/assign-real-user', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setSessionUserId(res.user.id);
    return res;
  },
  async sendMagicLink(email: string): Promise<{ success: boolean; message: string }> {
    return request('/api/auth/send-magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
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
  async uploadAvatar(avatarUrl: string): Promise<{ success: boolean; user: User; message: string }> {
    return request('/api/user/upload-avatar', {
      method: 'POST',
      body: JSON.stringify({ avatarUrl }),
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
    return request(`/api/receipts${q}`);
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
};

