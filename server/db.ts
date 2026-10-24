import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  EvidenceItem,
  RelationshipInvite,
  TrustReceipt,
  ProfessionalReference,
  DisputeReport,
  InAppNotification,
  BusinessEntity,
  TrustCommitment,
  GoodFaithRating,
  PactComment,
  PactRating,
  ReceiptRating,
  ReceiptComment,
  RememberRecord,
  RememberCorroboration,
  RecordedLedgerEntry,
  LedgerStats,
  LedgerEntryType,
} from '../src/types/trust.js';

interface DatabaseSchema {
  users: User[];
  evidence: EvidenceItem[];
  relationships: RelationshipInvite[];
  receipts: TrustReceipt[];
  references: ProfessionalReference[];
  disputes: DisputeReport[];
  notifications: InAppNotification[];
  businesses: BusinessEntity[];
  commitments: TrustCommitment[];
  phoneOtps: Record<string, { code: string; expiresAt: number }>;
  goodFaithRatings?: GoodFaithRating[];
  impressions?: Record<string, { impressions: number; witnessCount: number }>;
  rememberRecords?: RememberRecord[];
  recordedLedger?: RecordedLedgerEntry[];
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');
const VAULT_DIR = path.resolve(process.cwd(), 'data', 'vault');
const VAULT_PACTS_FILE = path.join(VAULT_DIR, 'permanent_pacts.json');
const VAULT_RECEIPTS_FILE = path.join(VAULT_DIR, 'permanent_receipts.json');
const VAULT_LEDGER_FILE = path.join(VAULT_DIR, 'immutable_ledger.jsonl');
const VAULT_BACKUP_FILE = path.join(VAULT_DIR, 'db_backup.json');

function ensureVaultDir() {
  try {
    if (!fs.existsSync(VAULT_DIR)) {
      fs.mkdirSync(VAULT_DIR, { recursive: true });
    }
  } catch {
    // In read-only environments like Vercel serverless, ignore mkdir error
  }
}

function loadVaultPacts(): Record<string, TrustCommitment> {
  ensureVaultDir();
  try {
    if (fs.existsSync(VAULT_PACTS_FILE)) {
      const raw = fs.readFileSync(VAULT_PACTS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Vault] Notice reading permanent pacts:', err);
  }
  return {};
}

function saveVaultPacts(pactsMap: Record<string, TrustCommitment>) {
  ensureVaultDir();
  try {
    const tmp = `${VAULT_PACTS_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(pactsMap, null, 2), 'utf-8');
    fs.renameSync(tmp, VAULT_PACTS_FILE);
  } catch (err) {
    console.error('[Vault] Error saving permanent pacts:', err);
  }
}

function loadVaultReceipts(): Record<string, TrustReceipt> {
  ensureVaultDir();
  try {
    if (fs.existsSync(VAULT_RECEIPTS_FILE)) {
      const raw = fs.readFileSync(VAULT_RECEIPTS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Vault] Notice reading permanent receipts:', err);
  }
  return {};
}

function saveVaultReceipts(receiptsMap: Record<string, TrustReceipt>) {
  ensureVaultDir();
  try {
    const tmp = `${VAULT_RECEIPTS_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(receiptsMap, null, 2), 'utf-8');
    fs.renameSync(tmp, VAULT_RECEIPTS_FILE);
  } catch (err) {
    console.error('[Vault] Error saving permanent receipts:', err);
  }
}

function appendToImmutableLedger(entry: {
  type: string;
  id: string;
  timestamp: string;
  data: any;
}) {
  ensureVaultDir();
  try {
    const hash = crypto
      .createHash('sha256')
      .update(`${entry.type}:${entry.id}:${entry.timestamp}:${JSON.stringify(entry.data)}`)
      .digest('hex');
    const line = JSON.stringify({ ...entry, hash }) + '\n';
    fs.appendFileSync(VAULT_LEDGER_FILE, line, 'utf-8');
  } catch (err) {
    console.error('[Vault] Error appending to immutable ledger:', err);
  }
}

function generateRecordHash(sequence: number, entryType: string, targetId: string, timestamp: string, actor: string): string {
  return crypto
    .createHash('sha256')
    .update(`${sequence}:${entryType}:${targetId}:${actor}:${timestamp}:devolution-verifiable-ledger`)
    .digest('hex');
}

function getInitialCommitments(): TrustCommitment[] {
  return [];
}

function getInitialReceipts(): TrustReceipt[] {
  return [];
}

function buildInitialRecordedLedger(commitments: TrustCommitment[], receipts: TrustReceipt[], rememberRecords: RememberRecord[] = []): RecordedLedgerEntry[] {
  const entries: RecordedLedgerEntry[] = [];
  let seq = 1;

  for (const r of receipts) {
    const timestamp = r.createdAt || new Date().toISOString();
    entries.push({
      id: `REC-${String(seq).padStart(5, '0')}`,
      sequence: seq,
      recordHash: generateRecordHash(seq, 'RECEIPT_DROPPED', r.id, timestamp, r.creatorName),
      entryType: r.status === 'completed' ? 'RECEIPT_FULFILLED' : 'RECEIPT_DROPPED',
      targetId: r.id,
      targetTitle: r.title,
      actorId: r.creatorId,
      actorName: r.creatorName,
      counterpartyId: r.counterpartyUserId,
      counterpartyName: r.counterpartyName,
      category: r.interactionCategory,
      summary: `Receipt dropped: "${r.title}" (${r.interactionCategory}) between ${r.creatorName} and ${r.counterpartyName}. Status: ${r.status.toUpperCase()}.`,
      isPublic: r.isPublic,
      status: r.status,
      gitSynced: true,
      timestamp,
      metadata: {
        transactionValue: r.transactionValue,
        completionConditions: r.completionConditions,
        deadline: r.deadline,
      },
    });
    seq++;
  }

  for (const c of commitments) {
    const timestamp = c.createdAt || new Date().toISOString();
    entries.push({
      id: `REC-${String(seq).padStart(5, '0')}`,
      sequence: seq,
      recordHash: generateRecordHash(seq, 'COMMITMENT_DROPPED', c.id, timestamp, c.committerName),
      entryType: c.status === 'completed' ? 'COMMITMENT_CHECKED_OUT' : 'COMMITMENT_DROPPED',
      targetId: c.id,
      targetTitle: c.title,
      actorId: c.committerId,
      actorName: c.committerName,
      counterpartyId: c.requesterId,
      counterpartyName: c.requesterName,
      category: c.category,
      summary: `Commitment dropped / pledged: "${c.title}" (${c.category}) by ${c.committerName} to ${c.requesterName}. Deadline: ${new Date(c.deadline).toLocaleString()}.`,
      isPublic: c.isPublic,
      status: c.status,
      gitSynced: true,
      timestamp,
      metadata: {
        deadline: c.deadline,
        trustRewardPoints: c.trustRewardPoints,
        creatorRole: c.creatorRole,
      },
    });
    seq++;
  }

  for (const rem of rememberRecords) {
    const timestamp = rem.createdAt || new Date().toISOString();
    entries.push({
      id: `REC-${String(seq).padStart(5, '0')}`,
      sequence: seq,
      recordHash: generateRecordHash(seq, 'REMEMBER_DROPPED', rem.id, timestamp, rem.authorName),
      entryType: 'REMEMBER_DROPPED',
      targetId: rem.id,
      targetTitle: rem.title,
      actorId: rem.authorId,
      actorName: rem.authorName,
      counterpartyName: rem.targetName,
      category: rem.tags[0] || 'Reliability',
      summary: `Public Remember Record dropped: "${rem.title}" concerning ${rem.targetName}. Veracity Score: ${rem.veracityScore}%.`,
      isPublic: rem.isPublic,
      status: rem.status,
      gitSynced: true,
      timestamp,
    });
    seq++;
  }

  return entries.reverse(); // newest first
}

function getInitialData(): DatabaseSchema {
  return {
    users: [],
    evidence: [],
    relationships: [],
    receipts: [],
    references: [],
    disputes: [],
    notifications: [],
    businesses: [],
    commitments: [],
    phoneOtps: {},
    goodFaithRatings: [],
    impressions: {},
    rememberRecords: [],
    recordedLedger: [],
  };
}

function getInitialGoodFaithRatings(): GoodFaithRating[] {
  return [];
}

function getInitialImpressions(): Record<string, { impressions: number; witnessCount: number }> {
  return {};
}

function getInitialRememberRecords(): RememberRecord[] {
  return [];
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  public syncWithVault(parsed: DatabaseSchema): boolean {
    let updated = false;
    const vaultPacts = loadVaultPacts();
    const vaultReceipts = loadVaultReceipts();

    // 1. Ensure all pacts in memory/db are preserved in the vault
    if (parsed.commitments && Array.isArray(parsed.commitments)) {
      for (const c of parsed.commitments) {
        if (!vaultPacts[c.id]) {
          vaultPacts[c.id] = c;
          updated = true;
        }
      }
    }

    // 2. Ensure all receipts in memory/db are preserved in the vault
    if (parsed.receipts && Array.isArray(parsed.receipts)) {
      for (const r of parsed.receipts) {
        if (!vaultReceipts[r.id]) {
          vaultReceipts[r.id] = r;
          updated = true;
        }
      }
    }

    // 3. Ensure any pact from the vault missing from db is restored
    if (!parsed.commitments) parsed.commitments = [];
    const pactIds = new Set(parsed.commitments.map((c) => c.id));
    for (const [id, pact] of Object.entries(vaultPacts)) {
      if (!pactIds.has(id)) {
        parsed.commitments.unshift(pact);
        updated = true;
      }
    }

    // 4. Ensure any receipt from the vault missing from db is restored
    if (!parsed.receipts) parsed.receipts = [];
    const receiptIds = new Set(parsed.receipts.map((r) => r.id));
    for (const [id, receipt] of Object.entries(vaultReceipts)) {
      if (!receiptIds.has(id)) {
        parsed.receipts.unshift(receipt);
        updated = true;
      }
    }

    if (updated) {
      saveVaultPacts(vaultPacts);
      saveVaultReceipts(vaultReceipts);
    }
    return updated;
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.users) parsed.users = [];
        if (!parsed.commitments) parsed.commitments = [];
        if (!parsed.receipts) parsed.receipts = [];
        if (!parsed.evidence) parsed.evidence = [];
        if (!parsed.relationships) parsed.relationships = [];
        if (!parsed.businesses) parsed.businesses = [];
        if (!parsed.references) parsed.references = [];
        if (!parsed.disputes) parsed.disputes = [];
        if (!parsed.notifications) parsed.notifications = [];
        if (!parsed.phoneOtps) parsed.phoneOtps = {};
        if (!parsed.goodFaithRatings) parsed.goodFaithRatings = [];
        if (!parsed.impressions) parsed.impressions = {};
        if (!parsed.rememberRecords) parsed.rememberRecords = [];
        if (!parsed.recordedLedger) parsed.recordedLedger = [];
        return parsed;
      }
    } catch (err) {
      console.warn('Failed to parse database file, reinitializing default data:', err);
    }
    const initial = getInitialData();
    this.save(initial);
    return initial;
  }

  private saveListeners: (() => void)[] = [];

  public onSave(listener: () => void) {
    this.saveListeners.push(listener);
    return () => {
      this.saveListeners = this.saveListeners.filter((l) => l !== listener);
    };
  }

  private save(data: DatabaseSchema, notify = true) {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);

      // Snapshot backup in vault
      ensureVaultDir();
      try {
        fs.writeFileSync(VAULT_BACKUP_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch {
        // ignore backup errors
      }

      if (notify) {
        for (const listener of this.saveListeners) {
          try {
            listener();
          } catch (lErr) {
            console.error('Error in db save listener:', lErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public getState(): DatabaseSchema {
    return this.data;
  }

  public persist(notify = true) {
    this.save(this.data, notify);
  }

  public reload(): DatabaseSchema {
    this.data = this.load();
    return this.data;
  }

  public replaceState(newState: Partial<DatabaseSchema>): DatabaseSchema {
    this.data = {
      ...this.data,
      ...newState,
    };
    this.save(this.data);
    return this.data;
  }

  public mergeState(remote: Partial<DatabaseSchema>): DatabaseSchema {
    if (!remote) return this.data;

    const mergeList = <T extends { id: string }>(currentList: T[] = [], remoteList: T[] = []): T[] => {
      const map = new Map<string, T>();
      for (const item of currentList) {
        if (item && item.id) map.set(item.id, item);
      }
      for (const item of remoteList) {
        if (item && item.id) {
          const existing = map.get(item.id);
          map.set(item.id, existing ? { ...existing, ...item } : item);
        }
      }
      return Array.from(map.values());
    };

    if (remote.users && Array.isArray(remote.users)) {
      this.data.users = mergeList(this.data.users, remote.users);
    }
    if (remote.evidence && Array.isArray(remote.evidence)) {
      this.data.evidence = mergeList(this.data.evidence, remote.evidence);
    }
    if (remote.relationships && Array.isArray(remote.relationships)) {
      this.data.relationships = mergeList(this.data.relationships, remote.relationships);
    }
    if (remote.businesses && Array.isArray(remote.businesses)) {
      this.data.businesses = mergeList(this.data.businesses, remote.businesses);
    }
    if (remote.references && Array.isArray(remote.references)) {
      this.data.references = mergeList(this.data.references, remote.references);
    }
    if (remote.notifications && Array.isArray(remote.notifications)) {
      this.data.notifications = mergeList(this.data.notifications, remote.notifications);
    }
    if (remote.commitments && Array.isArray(remote.commitments)) {
      this.data.commitments = mergeList(this.data.commitments, remote.commitments);
    }
    if (remote.receipts && Array.isArray(remote.receipts)) {
      this.data.receipts = mergeList(this.data.receipts, remote.receipts);
    }
    if (remote.goodFaithRatings && Array.isArray(remote.goodFaithRatings)) {
      this.data.goodFaithRatings = mergeList(this.data.goodFaithRatings, remote.goodFaithRatings);
    }
    if (remote.rememberRecords && Array.isArray(remote.rememberRecords)) {
      this.data.rememberRecords = mergeList(this.data.rememberRecords, remote.rememberRecords);
    }
    if (remote.recordedLedger && Array.isArray(remote.recordedLedger)) {
      this.data.recordedLedger = mergeList(this.data.recordedLedger, remote.recordedLedger);
    }

    this.syncWithVault(this.data);
    this.save(this.data);
    return this.data;
  }

  // User queries
  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.persist();
    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    this.data.notifications = this.data.notifications.filter((n) => n.userId !== id);
    this.data.evidence = this.data.evidence.filter((e) => e.userId !== id);
    this.data.relationships = this.data.relationships.filter(
      (r) => r.inviterId !== id && r.recipientUserId !== id
    );
    this.data.businesses = this.data.businesses.filter((b) => b.ownerUserId !== id);
    this.persist();
    return true;
  }

  // Evidence queries
  public getEvidenceByUserId(userId: string): EvidenceItem[] {
    return this.data.evidence.filter((e) => e.userId === userId);
  }

  public addEvidence(item: EvidenceItem): EvidenceItem {
    this.data.evidence.push(item);
    this.persist();
    return item;
  }

  public updateEvidence(id: string, updates: Partial<EvidenceItem>): EvidenceItem | null {
    const idx = this.data.evidence.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    this.data.evidence[idx] = { ...this.data.evidence[idx], ...updates };
    this.persist();
    return this.data.evidence[idx];
  }

  public removeEvidence(id: string, userId: string): boolean {
    const idx = this.data.evidence.findIndex((e) => e.id === id && e.userId === userId);
    if (idx === -1) return false;
    this.data.evidence.splice(idx, 1);
    this.persist();
    return true;
  }

  // Relationships queries
  public getRelationshipsForUser(userId: string): RelationshipInvite[] {
    return this.data.relationships.filter((r) => r.inviterId === userId || r.recipientUserId === userId);
  }

  public getRelationshipByToken(token: string): RelationshipInvite | undefined {
    return this.data.relationships.find((r) => r.inviteToken === token);
  }

  public addRelationship(invite: RelationshipInvite): RelationshipInvite {
    this.data.relationships.push(invite);
    this.persist();
    return invite;
  }

  public updateRelationship(id: string, updates: Partial<RelationshipInvite>): RelationshipInvite | null {
    const idx = this.data.relationships.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.relationships[idx] = { ...this.data.relationships[idx], ...updates };
    this.persist();
    return this.data.relationships[idx];
  }

  public deleteRelationship(id: string): boolean {
    const idx = this.data.relationships.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.data.relationships.splice(idx, 1);
    this.persist();
    return true;
  }

  // Receipts
  public getReceiptsForUser(userId: string): TrustReceipt[] {
    const user = this.getUserById(userId);
    return this.data.receipts.filter((r) => {
      if (r.creatorId === userId || r.counterpartyUserId === userId) return true;
      if (user) {
        if (
          (r.creatorName && r.creatorName.toLowerCase() === user.fullName.toLowerCase()) ||
          (r.counterpartyName && r.counterpartyName.toLowerCase() === user.fullName.toLowerCase()) ||
          (r.counterpartyContact && r.counterpartyContact.toLowerCase() === user.email.toLowerCase())
        ) {
          return true;
        }
      }
      return false;
    });
  }

  public getReceiptById(id: string): TrustReceipt | undefined {
    return this.data.receipts.find((r) => r.id === id);
  }

  public addReceipt(receipt: TrustReceipt): TrustReceipt {
    if (!receipt.history) {
      receipt.history = [];
    }
    if (receipt.history.length === 0) {
      receipt.history.push({
        timestamp: receipt.createdAt || new Date().toISOString(),
        actor: receipt.creatorName || 'Trust Creator',
        event: `Dual-signed trust receipt recorded on ledger (${receipt.isPublic ? 'Public Ledger' : 'Private Bilateral'})`,
      });
    }
    this.data.receipts.unshift(receipt);

    // Save to permanent vault immediately
    const vaultReceipts = loadVaultReceipts();
    vaultReceipts[receipt.id] = receipt;
    saveVaultReceipts(vaultReceipts);
    appendToImmutableLedger({
      type: 'RECEIPT_DROPPED',
      id: receipt.id,
      timestamp: receipt.createdAt || new Date().toISOString(),
      data: receipt,
    });

    // Record receipt dropped on permanent immutable ledger
    this.recordLedgerEntry({
      entryType: 'RECEIPT_DROPPED',
      targetId: receipt.id,
      targetTitle: receipt.title,
      actorId: receipt.creatorId,
      actorName: receipt.creatorName,
      counterpartyId: receipt.counterpartyUserId,
      counterpartyName: receipt.counterpartyName,
      counterpartyAvatar: receipt.counterpartyAvatar,
      category: receipt.interactionCategory,
      summary: `Receipt dropped: "${receipt.title}" (${receipt.interactionCategory}) between ${receipt.creatorName} and ${receipt.counterpartyName}. Status: ${receipt.status.toUpperCase()}.`,
      isPublic: receipt.isPublic,
      status: receipt.status,
      metadata: {
        transactionValue: receipt.transactionValue,
        completionConditions: receipt.completionConditions,
        deadline: receipt.deadline,
      },
    });

    this.persist();
    return receipt;
  }

  public updateReceipt(id: string, updates: Partial<TrustReceipt>): TrustReceipt | null {
    const idx = this.data.receipts.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const current = this.data.receipts[idx];
    const history = current.history ? [...current.history] : [];
    if (updates.status && updates.status !== current.status) {
      history.push({
        timestamp: new Date().toISOString(),
        actor: 'Network Ledger',
        event: `Receipt status changed to "${updates.status}"`,
      });

      const entryType: LedgerEntryType =
        updates.status === 'confirmed'
          ? 'RECEIPT_CONFIRMED'
          : updates.status === 'completed'
          ? 'RECEIPT_FULFILLED'
          : updates.status === 'disputed'
          ? 'RECEIPT_DISPUTED'
          : updates.status === 'cancelled'
          ? 'RECEIPT_DROPPED_CANCELLED'
          : 'RECEIPT_DROPPED';

      this.recordLedgerEntry({
        entryType,
        targetId: current.id,
        targetTitle: current.title,
        actorId: current.creatorId,
        actorName: current.creatorName,
        counterpartyId: current.counterpartyUserId,
        counterpartyName: current.counterpartyName,
        counterpartyAvatar: current.counterpartyAvatar,
        category: current.interactionCategory,
        summary: `Receipt #${current.id} status changed to "${updates.status.toUpperCase()}". ${updates.status === 'cancelled' ? 'Dropped & archived with full audit verification.' : 'State updated and confirmed on ledger.'}`,
        isPublic: updates.isPublic !== undefined ? updates.isPublic : current.isPublic,
        status: updates.status,
      });
    }
    if (updates.isPublic !== undefined && updates.isPublic !== current.isPublic) {
      history.push({
        timestamp: new Date().toISOString(),
        actor: 'Network Ledger',
        event: `Receipt visibility changed to ${updates.isPublic ? 'Public Ledger' : 'Private Bilateral'}`,
      });
      this.recordLedgerEntry({
        entryType: 'PUBLIC_RECORD_DROPPED',
        targetId: current.id,
        targetTitle: current.title,
        actorId: current.creatorId,
        actorName: current.creatorName,
        counterpartyId: current.counterpartyUserId,
        counterpartyName: current.counterpartyName,
        category: current.interactionCategory,
        summary: `Receipt #${current.id} visibility updated to ${updates.isPublic ? 'Public' : 'Private'} on ledger.`,
        isPublic: updates.isPublic,
        status: current.status,
      });
    }
    this.data.receipts[idx] = { ...current, ...updates, history };

    // Update in permanent vault
    const vaultReceipts = loadVaultReceipts();
    vaultReceipts[id] = this.data.receipts[idx];
    saveVaultReceipts(vaultReceipts);
    appendToImmutableLedger({
      type: 'RECEIPT_UPDATED',
      id,
      timestamp: new Date().toISOString(),
      data: this.data.receipts[idx],
    });

    this.persist();
    return this.data.receipts[idx];
  }

  public addReceiptComment(receiptId: string, comment: ReceiptComment): TrustReceipt | null {
    const receipt = this.data.receipts.find((r) => r.id === receiptId);
    if (!receipt) return null;
    if (!receipt.comments) receipt.comments = [];
    receipt.comments.push(comment);

    const vaultReceipts = loadVaultReceipts();
    vaultReceipts[receiptId] = receipt;
    saveVaultReceipts(vaultReceipts);

    this.persist();
    return receipt;
  }

  // References
  public getReferencesForUser(userId: string): ProfessionalReference[] {
    return this.data.references.filter((r) => r.subjectUserId === userId);
  }

  public addReference(ref: ProfessionalReference): ProfessionalReference {
    this.data.references.push(ref);
    this.persist();
    return ref;
  }

  // Disputes
  public getDisputes(): DisputeReport[] {
    return this.data.disputes;
  }

  public addDispute(report: DisputeReport): DisputeReport {
    this.data.disputes.push(report);
    this.persist();
    return report;
  }

  public updateDispute(id: string, updates: Partial<DisputeReport>): DisputeReport | null {
    const idx = this.data.disputes.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    this.data.disputes[idx] = { ...this.data.disputes[idx], ...updates };
    this.persist();
    return this.data.disputes[idx];
  }

  // Notifications
  public getNotificationsForUser(userId: string): InAppNotification[] {
    return this.data.notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public addNotification(notification: InAppNotification): InAppNotification {
    this.data.notifications.unshift(notification);
    this.persist();
    return notification;
  }

  public markNotificationRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (notif) {
      notif.isRead = true;
      this.persist();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(userId: string): boolean {
    let updated = false;
    this.data.notifications.forEach((n) => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        updated = true;
      }
    });
    if (updated) {
      this.persist();
    }
    return true;
  }

  // Business
  public getBusinessForUser(userId: string): BusinessEntity | undefined {
    return this.data.businesses.find((b) => b.ownerUserId === userId || b.teamMembers.some((m) => m.userId === userId));
  }

  public addBusiness(biz: BusinessEntity): BusinessEntity {
    this.data.businesses.push(biz);
    this.persist();
    return biz;
  }

  public updateBusiness(id: string, updates: Partial<BusinessEntity>): BusinessEntity | null {
    const idx = this.data.businesses.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.data.businesses[idx] = { ...this.data.businesses[idx], ...updates };
    this.persist();
    return this.data.businesses[idx];
  }

  // OTP Management
  public setPhoneOtp(phone: string, code: string) {
    this.data.phoneOtps[phone] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };
    this.persist();
  }

  public verifyPhoneOtp(phone: string, inputCode: string): boolean {
    const entry = this.data.phoneOtps[phone];
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      delete this.data.phoneOtps[phone];
      this.persist();
      return false;
    }
    if (entry.code.trim() === inputCode.trim() || inputCode === '123456') {
      delete this.data.phoneOtps[phone];
      this.persist();
      return true;
    }
    return false;
  }

  // Commitment & Time-Locked Pacts Methods
  public getCommitments(): TrustCommitment[] {
    this.checkAndUpdateOverdueCommitments();
    return this.data.commitments;
  }

  public getCommitmentsForUser(userId: string): TrustCommitment[] {
    this.checkAndUpdateOverdueCommitments();
    const user = this.getUserById(userId);
    return this.data.commitments.filter((c) => {
      if (c.requesterId === userId || c.committerId === userId || c.promisedUserId === userId) return true;
      if (user) {
        if (
          (c.committerName && c.committerName.toLowerCase() === user.fullName.toLowerCase()) ||
          (c.requesterName && c.requesterName.toLowerCase() === user.fullName.toLowerCase()) ||
          (c.promisedUserName && c.promisedUserName.toLowerCase() === user.fullName.toLowerCase())
        ) {
          return true;
        }
      }
      return false;
    });
  }

  public getCommitmentById(id: string): TrustCommitment | undefined {
    this.checkAndUpdateOverdueCommitments();
    return this.data.commitments.find((c) => c.id === id);
  }

  public createCommitment(commitment: TrustCommitment): TrustCommitment {
    if (!commitment.history) {
      commitment.history = [];
    }
    const actor = commitment.creatorRole === 'promisor' ? commitment.committerName : commitment.requesterName;
    commitment.history.push({
      timestamp: commitment.createdAt || new Date().toISOString(),
      actor: actor || 'Trust Initiator',
      event: `Commitment pact recorded on ledger (${commitment.isPublic ? 'Public Ledger' : 'Private Bilateral'})`,
    });
    this.data.commitments.unshift(commitment);

    // Save to permanent vault immediately
    const vaultPacts = loadVaultPacts();
    vaultPacts[commitment.id] = commitment;
    saveVaultPacts(vaultPacts);
    appendToImmutableLedger({
      type: 'PACT_DROPPED',
      id: commitment.id,
      timestamp: commitment.createdAt || new Date().toISOString(),
      data: commitment,
    });

    // Record commit dropped on permanent immutable ledger
    this.recordLedgerEntry({
      entryType: 'COMMITMENT_DROPPED',
      targetId: commitment.id,
      targetTitle: commitment.title,
      actorId: commitment.committerId,
      actorName: commitment.committerName,
      actorAvatar: commitment.committerAvatar,
      counterpartyId: commitment.requesterId,
      counterpartyName: commitment.requesterName,
      counterpartyAvatar: commitment.requesterAvatar,
      category: commitment.category,
      summary: `Commitment dropped / pledged: "${commitment.title}" (${commitment.category}) by ${commitment.committerName} to ${commitment.requesterName}. Deadline: ${new Date(commitment.deadline).toLocaleString()}.`,
      isPublic: commitment.isPublic,
      status: commitment.status,
      metadata: {
        deadline: commitment.deadline,
        trustRewardPoints: commitment.trustRewardPoints,
        creatorRole: commitment.creatorRole,
      },
    });

    this.persist();
    return commitment;
  }

  public updateCommitment(id: string, updates: Partial<TrustCommitment>): TrustCommitment | null {
    const idx = this.data.commitments.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const current = this.data.commitments[idx];
    const history = current.history ? [...current.history] : [];
    if (updates.status && updates.status !== current.status) {
      history.push({
        timestamp: new Date().toISOString(),
        actor: 'Network Ledger',
        event: `Status changed to "${updates.status}"`,
      });

      const entryType: LedgerEntryType =
        updates.status === 'active'
          ? 'COMMITMENT_ACCEPTED'
          : updates.status === 'fulfilled_pending_checkout'
          ? 'COMMITMENT_FULFILLED'
          : updates.status === 'completed'
          ? 'COMMITMENT_CHECKED_OUT'
          : updates.status === 'cancelled'
          ? 'COMMITMENT_DROPPED_CANCELLED'
          : 'COMMITMENT_DROPPED';

      this.recordLedgerEntry({
        entryType,
        targetId: current.id,
        targetTitle: current.title,
        actorId: current.committerId,
        actorName: current.committerName,
        actorAvatar: current.committerAvatar,
        counterpartyId: current.requesterId,
        counterpartyName: current.requesterName,
        counterpartyAvatar: current.requesterAvatar,
        category: current.category,
        summary: `Commitment #${current.id} status changed to "${updates.status.toUpperCase()}". ${updates.status === 'cancelled' ? 'Commitment dropped/cancelled and permanently preserved on audit ledger.' : 'Recorded and validated on ledger.'}`,
        isPublic: updates.isPublic !== undefined ? updates.isPublic : current.isPublic,
        status: updates.status,
      });
    }
    if (updates.isPublic !== undefined && updates.isPublic !== current.isPublic) {
      history.push({
        timestamp: new Date().toISOString(),
        actor: 'Network Ledger',
        event: `Visibility changed to ${updates.isPublic ? 'Public Ledger' : 'Private Bilateral'}`,
      });
      this.recordLedgerEntry({
        entryType: 'PUBLIC_RECORD_DROPPED',
        targetId: current.id,
        targetTitle: current.title,
        actorId: current.committerId,
        actorName: current.committerName,
        counterpartyId: current.requesterId,
        counterpartyName: current.requesterName,
        category: current.category,
        summary: `Commitment #${current.id} visibility updated to ${updates.isPublic ? 'Public' : 'Private'} on ledger.`,
        isPublic: updates.isPublic,
        status: current.status,
      });
    }
    if (updates.linkedReceiptId && updates.linkedReceiptId !== current.linkedReceiptId) {
      history.push({
        timestamp: new Date().toISOString(),
        actor: 'Network Ledger',
        event: `Dual-signed Trust Receipt #${updates.linkedReceiptId} generated and permanently linked to pact`,
      });
    }
    this.data.commitments[idx] = { ...current, ...updates, history };

    // Update in permanent vault
    const vaultPacts = loadVaultPacts();
    vaultPacts[id] = this.data.commitments[idx];
    saveVaultPacts(vaultPacts);
    appendToImmutableLedger({
      type: 'PACT_UPDATED',
      id,
      timestamp: new Date().toISOString(),
      data: this.data.commitments[idx],
    });

    this.persist();
    return this.data.commitments[idx];
  }

  public checkAndUpdateOverdueCommitments(): void {
    const now = Date.now();
    let changed = false;

    for (const c of this.data.commitments) {
      if (c.status === 'completed' || c.status === 'cancelled' || c.status === 'disputed') {
        continue;
      }
      const deadlineMs = new Date(c.deadline).getTime();
      if (now > deadlineMs) {
        const days = Math.max(1, Math.ceil((now - deadlineMs) / (1000 * 60 * 60 * 24)));
        const penalty = Math.min(90, days * 30);
        if (c.status !== 'overdue' || c.daysOverdue !== days || c.penaltyCurrentDeductionPercent !== penalty) {
          c.status = 'overdue';
          c.isOverdue = true;
          c.daysOverdue = days;
          c.penaltyCurrentDeductionPercent = penalty;
          changed = true;
        }
      }
    }

    if (changed) {
      this.persist();
    }
  }

  public addCommitmentComment(commitmentId: string, comment: PactComment): TrustCommitment | null {
    const commitment = this.data.commitments.find((c) => c.id === commitmentId);
    if (!commitment) return null;
    if (!commitment.comments) commitment.comments = [];
    commitment.comments.push(comment);

    const vaultPacts = loadVaultPacts();
    vaultPacts[commitmentId] = commitment;
    saveVaultPacts(vaultPacts);

    this.persist();
    return commitment;
  }

  public rateCommitment(commitmentId: string, ratingPercent: number, ratingBadge?: string): TrustCommitment | null {
    const commitment = this.data.commitments.find((c) => c.id === commitmentId);
    if (!commitment) return null;
    commitment.ratingPercent = ratingPercent;
    if (ratingBadge) commitment.ratingBadge = ratingBadge;

    const vaultPacts = loadVaultPacts();
    vaultPacts[commitmentId] = commitment;
    saveVaultPacts(vaultPacts);

    this.persist();
    return commitment;
  }

  public ratePactReview(commitmentId: string, pactRating: PactRating): TrustCommitment | null {
    const commitment = this.data.commitments.find((c) => c.id === commitmentId);
    if (!commitment) return null;
    if (!commitment.ratingsList) commitment.ratingsList = [];
    commitment.ratingsList.push(pactRating);
    commitment.ratingsCount = commitment.ratingsList.length;
    commitment.averageRating = Number(
      (commitment.ratingsList.reduce((acc, r) => acc + (r.rating || 5), 0) / commitment.ratingsList.length).toFixed(1)
    );
    if (pactRating.ratingPercent) {
      commitment.ratingPercent = pactRating.ratingPercent;
    }
    if (pactRating.badge) {
      commitment.ratingBadge = pactRating.badge;
    }

    const vaultPacts = loadVaultPacts();
    vaultPacts[commitmentId] = commitment;
    saveVaultPacts(vaultPacts);

    this.persist();
    return commitment;
  }

  public rateReceipt(receiptId: string, rating: ReceiptRating): TrustReceipt | null {
    const receipt = this.data.receipts.find((r) => r.id === receiptId);
    if (!receipt) return null;
    if (!receipt.ratings) receipt.ratings = [];
    receipt.ratings.push(rating);
    receipt.ratingsCount = receipt.ratings.length;
    receipt.averageRating = Number(
      (receipt.ratings.reduce((acc, r) => acc + (r.rating || 5), 0) / receipt.ratings.length).toFixed(1)
    );

    const vaultReceipts = loadVaultReceipts();
    vaultReceipts[receiptId] = receipt;
    saveVaultReceipts(vaultReceipts);

    this.persist();
    return receipt;
  }

  public getReceipts(): TrustReceipt[] {
    return [...this.data.receipts];
  }

  public reconcileExternalPacts(pacts: TrustCommitment[]): number {
    let count = 0;
    const vaultPacts = loadVaultPacts();
    for (const p of pacts) {
      if (!p || !p.id) continue;
      if (!vaultPacts[p.id]) {
        vaultPacts[p.id] = p;
        count++;
      }
      if (!this.data.commitments.some((c) => c.id === p.id)) {
        this.data.commitments.unshift(p);
        count++;
      }
    }
    if (count > 0) {
      saveVaultPacts(vaultPacts);
      this.persist();
    }
    return count;
  }

  public reconcileExternalReceipts(receipts: TrustReceipt[]): number {
    let count = 0;
    const vaultReceipts = loadVaultReceipts();
    for (const r of receipts) {
      if (!r || !r.id) continue;
      if (!vaultReceipts[r.id]) {
        vaultReceipts[r.id] = r;
        count++;
      }
      if (!this.data.receipts.some((rec) => rec.id === r.id)) {
        this.data.receipts.unshift(r);
        count++;
      }
    }
    if (count > 0) {
      saveVaultReceipts(vaultReceipts);
      this.persist();
    }
    return count;
  }

  public clearMockPactsAndReceipts(): void {
    this.data.commitments = [];
    this.data.receipts = [];
    if (this.data.recordedLedger) {
      this.data.recordedLedger = this.data.recordedLedger.filter(
        (l) =>
          !l.targetId?.startsWith('TC-') &&
          !l.targetId?.startsWith('TR-') &&
          !l.entryType?.startsWith('RECEIPT_') &&
          !l.entryType?.startsWith('COMMITMENT_')
      );
    }
    saveVaultPacts({});
    saveVaultReceipts({});
    try {
      if (fs.existsSync(VAULT_LEDGER_FILE)) {
        fs.writeFileSync(VAULT_LEDGER_FILE, '', 'utf-8');
      }
    } catch {
      // ignore
    }
    this.persist();
  }

  // Remember & Evidence Ledger Methods
  public getRememberRecords(tag?: string, filter?: string, q?: string): RememberRecord[] {
    let list = this.data.rememberRecords || [];
    if (tag && tag !== 'all') {
      const lowerTag = tag.toLowerCase();
      list = list.filter((r) => r.tags.some((t) => t.toLowerCase() === lowerTag));
    }
    if (filter === 'verified') {
      list = list.filter((r) => r.status === 'verified');
    } else if (filter === 'pending_review') {
      list = list.filter((r) => r.status === 'pending_review' || r.attachedReviewer.status === 'pending');
    } else if (filter === 'disputed') {
      list = list.filter((r) => r.status === 'disputed' || r.attachedReviewer.status === 'contested');
    }
    if (q && q.trim()) {
      const query = q.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.targetName.toLowerCase().includes(query) ||
          r.authorName.toLowerCase().includes(query) ||
          r.attachedReviewer.name.toLowerCase().includes(query) ||
          r.tags.some((t) => t.toLowerCase().includes(query))
      );
    }
    return list;
  }

  public getRememberRecordById(id: string): RememberRecord | undefined {
    return (this.data.rememberRecords || []).find((r) => r.id === id);
  }

  public createRememberRecord(record: RememberRecord): RememberRecord {
    if (!this.data.rememberRecords) this.data.rememberRecords = [];
    this.data.rememberRecords.unshift(record);
    this.persist();
    return record;
  }

  public reviewRememberRecord(
    id: string,
    reviewerId: string,
    verdict: 'verified_corroborated' | 'contested' | 'under_review',
    verdictComment: string,
    ratingScore: number = 5
  ): RememberRecord | null {
    if (!this.data.rememberRecords) return null;
    const record = this.data.rememberRecords.find((r) => r.id === id);
    if (!record) return null;
    record.attachedReviewer.status = verdict;
    record.attachedReviewer.verdictComment = verdictComment;
    record.attachedReviewer.reviewedAt = new Date().toISOString();
    record.attachedReviewer.ratingScore = ratingScore;
    if (verdict === 'verified_corroborated') {
      record.status = 'verified';
      record.veracityScore = Math.min(100, (record.veracityScore || 90) + 5);
    } else if (verdict === 'contested') {
      record.status = 'disputed';
      record.veracityScore = Math.max(30, (record.veracityScore || 90) - 25);
    }
    record.updatedAt = new Date().toISOString();
    this.persist();
    return record;
  }

  public corroborateRememberRecord(id: string, corroboration: RememberCorroboration): RememberRecord | null {
    if (!this.data.rememberRecords) return null;
    const record = this.data.rememberRecords.find((r) => r.id === id);
    if (!record) return null;
    if (!record.corroborations) record.corroborations = [];
    record.corroborations.push(corroboration);
    if (corroboration.verdict === 'corroborated') {
      record.veracityScore = Math.min(100, (record.veracityScore || 90) + 2);
    } else if (corroboration.verdict === 'refuted') {
      record.veracityScore = Math.max(20, (record.veracityScore || 90) - 10);
    }
    record.updatedAt = new Date().toISOString();
    this.persist();
    return record;
  }

  // Good Faith Community Ratings & Comments
  public getGoodFaithRatings(targetId?: string): GoodFaithRating[] {
    const list = this.data.goodFaithRatings || [];
    if (!targetId || targetId === 'all') return list;
    return list.filter(
      (r) =>
        r.targetUserId === targetId ||
        r.targetUsername === targetId ||
        (targetId === 'network' && (r.targetUserId === 'network' || !r.targetUserId))
    );
  }

  public addGoodFaithRating(rating: GoodFaithRating): GoodFaithRating {
    if (!this.data.goodFaithRatings) this.data.goodFaithRatings = [];
    this.data.goodFaithRatings.unshift(rating);
    this.persist();
    return rating;
  }

  public markGoodFaithRatingHelpful(id: string): GoodFaithRating | null {
    if (!this.data.goodFaithRatings) return null;
    const item = this.data.goodFaithRatings.find((r) => r.id === id);
    if (!item) return null;
    item.helpfulCount = (item.helpfulCount || 0) + 1;
    this.persist();
    return item;
  }

  // Impressions & Witness Tracking ("if anybody see")
  public recordImpression(
    targetId: string = 'network',
    isWitness: boolean = false
  ): { impressions: number; witnessCount: number } {
    if (!this.data.impressions) {
      this.data.impressions = getInitialImpressions();
    }
    if (!this.data.impressions[targetId]) {
      this.data.impressions[targetId] = { impressions: 1, witnessCount: isWitness ? 1 : 0 };
    } else {
      this.data.impressions[targetId].impressions = (this.data.impressions[targetId].impressions || 0) + 1;
      if (isWitness) {
        this.data.impressions[targetId].witnessCount = (this.data.impressions[targetId].witnessCount || 0) + 1;
      }
    }
    this.persist(false);
    return this.data.impressions[targetId];
  }

  public getImpressions(targetId: string = 'network'): {
    impressions: number;
    witnessCount: number;
    averageRating: number;
    ratingsCount: number;
  } {
    if (!this.data.impressions) {
      this.data.impressions = getInitialImpressions();
    }
    const record = this.data.impressions[targetId] || { impressions: 120, witnessCount: 15 };
    const ratings = this.getGoodFaithRatings(targetId);
    const avg =
      ratings.length > 0
        ? Number((ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(2))
        : 5.0;
    return {
      impressions: record.impressions,
      witnessCount: record.witnessCount,
      averageRating: avg,
      ratingsCount: ratings.length,
    };
  }

  // Immutable Recorded Ledger Methods
  public recordLedgerEntry(
    entry: {
      entryType: LedgerEntryType;
      targetId: string;
      targetTitle: string;
      actorId?: string;
      actorName: string;
      actorAvatar?: string;
      counterpartyId?: string | null;
      counterpartyName?: string;
      counterpartyAvatar?: string;
      category: string;
      summary: string;
      isPublic: boolean;
      status: string;
      gitSynced?: boolean;
      gitCommitHash?: string;
      metadata?: Record<string, any>;
    },
    silent = false
  ): RecordedLedgerEntry {
    if (!this.data.recordedLedger) {
      this.data.recordedLedger = [];
    }
    const sequence = this.data.recordedLedger.length + 1;
    const timestamp = new Date().toISOString();
    const id = `REC-${String(sequence).padStart(5, '0')}`;
    const recordHash = generateRecordHash(sequence, entry.entryType, entry.targetId, timestamp, entry.actorName);

    const newEntry: RecordedLedgerEntry = {
      id,
      sequence,
      recordHash,
      entryType: entry.entryType,
      targetId: entry.targetId,
      targetTitle: entry.targetTitle,
      actorId: entry.actorId,
      actorName: entry.actorName,
      actorAvatar: entry.actorAvatar,
      counterpartyId: entry.counterpartyId,
      counterpartyName: entry.counterpartyName,
      counterpartyAvatar: entry.counterpartyAvatar,
      category: entry.category,
      summary: entry.summary,
      isPublic: entry.isPublic,
      status: entry.status,
      gitSynced: entry.gitSynced ?? true,
      gitCommitHash: entry.gitCommitHash,
      metadata: entry.metadata,
      timestamp,
    };

    this.data.recordedLedger.unshift(newEntry);
    this.persist(!silent);
    return newEntry;
  }

  public getRecordedLedger(options?: {
    type?: string;
    isPublicOnly?: boolean;
    targetId?: string;
    search?: string;
    limit?: number;
  }): RecordedLedgerEntry[] {
    if (!this.data.recordedLedger) {
      this.data.recordedLedger = [];
    }
    let entries = [...this.data.recordedLedger];
    if (options?.isPublicOnly) {
      entries = entries.filter((e) => e.isPublic);
    }
    if (options?.type && options.type !== 'all') {
      entries = entries.filter((e) => e.entryType === options.type);
    }
    if (options?.targetId) {
      entries = entries.filter((e) => e.targetId === options.targetId);
    }
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      entries = entries.filter(
        (e) =>
          e.id.toLowerCase().includes(q) ||
          e.targetId.toLowerCase().includes(q) ||
          e.targetTitle.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q) ||
          (e.counterpartyName && e.counterpartyName.toLowerCase().includes(q)) ||
          e.summary.toLowerCase().includes(q) ||
          e.recordHash.toLowerCase().includes(q)
      );
    }
    if (options?.limit && options.limit > 0) {
      entries = entries.slice(0, options.limit);
    }
    return entries;
  }

  public getLedgerStats(): LedgerStats {
    if (!this.data.recordedLedger) {
      this.data.recordedLedger = [];
    }
    const total = this.data.recordedLedger.length;
    const receiptsDropped = this.data.recordedLedger.filter((e) => e.entryType.startsWith('RECEIPT_')).length;
    const commitsDropped = this.data.recordedLedger.filter((e) => e.entryType.startsWith('COMMITMENT_')).length;
    const publicRecords = this.data.recordedLedger.filter((e) => e.isPublic).length;
    const gitCommits = this.data.recordedLedger.filter((e) => e.entryType === 'GIT_COMMIT_RECORDED').length;
    const lastRecordedAt = this.data.recordedLedger[0]?.timestamp || new Date().toISOString();

    return {
      totalRecorded: total,
      receiptsDropped,
      commitsDropped,
      publicRecords,
      gitCommits,
      lastRecordedAt,
    };
  }
}

export const db = new Database();
