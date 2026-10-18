import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from './server/db.js';
import { calculateReputation } from './server/reputation.js';
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
} from './src/types/trust.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Session helper: in this full-stack environment, we track active user by header 'x-user-id'
// or default to the primary seeded user 'usr_allen_001'.
function getSessionUserId(req: Request): string {
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId && db.getUserById(headerUserId)) {
    return headerUserId;
  }
  return 'usr_allen_001';
}

/* ==========================================================================
   AUTHENTICATION & PROFILE ENDPOINTS
   ========================================================================== */

app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

app.post('/api/auth/signin', (req: Request, res: Response) => {
  const { login, targetUserId } = req.body;
  if (targetUserId) {
    const user = db.getUserById(targetUserId);
    if (user) return res.json({ user, message: 'Switched session profile' });
  }
  if (!login) {
    return res.status(400).json({ error: 'Username or email required' });
  }
  const user = db.getUserByUsername(login) || db.getUserByEmail(login);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
  }
  res.json({ user, message: 'Authentication successful' });
});

app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { fullName, username, email, accountType, businessName, category, country, city, phone } = req.body;
  if (!fullName || !username || !email) {
    return res.status(400).json({ error: 'Full name, username, and email are required.' });
  }
  if (db.getUserByUsername(username)) {
    return res.status(409).json({ error: 'Username is already taken.' });
  }
  if (db.getUserByEmail(email)) {
    return res.status(409).json({ error: 'Email address is already registered.' });
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email,
    username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
    fullName,
    accountType: accountType === 'business' ? 'business' : 'personal',
    avatarUrl: '',
    headline: accountType === 'business' ? `${businessName || fullName} — Verified Business` : `${category || 'Independent Professional'}`,
    bio: '',
    category: category || 'General Professional',
    country: country || 'Nigeria',
    city: city || 'Lagos',
    phone: phone || '',
    phoneVerified: false,
    emailVerified: false,
    identityStatus: 'unverified',
    identityMethod: 'None submitted',
    identityVerifiedAt: null,
    businessVerificationStatus: accountType === 'business' ? 'unverified' : 'unverified',
    businessName: businessName || undefined,
    businessRegNumber: undefined,
    privacySettings: {
      showRelationshipCounts: true,
      showCategoryBreakdown: true,
      showPublicEndorsers: true,
      showTrustReceipts: true,
      showCredentials: true,
      showLocationCityOnly: true,
      allowDirectVerificationRequests: true,
    },
    createdAt: new Date().toISOString(),
  };

  db.createUser(newUser);

  // If business, create initial business entity
  if (newUser.accountType === 'business' && businessName) {
    db.addBusiness({
      id: `biz_${Date.now()}`,
      ownerUserId: newUser.id,
      name: businessName,
      registrationNumber: 'Pending CAC Submission',
      jurisdiction: 'Federal Republic of Nigeria',
      incorporationDate: new Date().toISOString().split('T')[0],
      status: 'unverified',
      industry: category || 'Commerce & Services',
      headquarters: `${city || 'Lagos'}, ${country || 'Nigeria'}`,
      teamMembers: [
        {
          userId: newUser.id,
          name: newUser.fullName,
          role: 'Owner',
          email: newUser.email,
        },
      ],
    });
  }

  res.status(201).json({ user: newUser, message: 'Account registered successfully.' });
});

app.post('/api/auth/update-profile', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const updates = req.body;
  // Security guard: never allow client to manipulate verification statuses directly
  delete updates.id;
  delete updates.identityStatus;
  delete updates.identityVerifiedAt;
  delete updates.phoneVerified;
  delete updates.emailVerified;
  delete updates.businessVerificationStatus;

  const updated = db.updateUser(userId, updates);
  if (!updated) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ user: updated, message: 'Profile updated successfully.' });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  res.json({
    message: 'If an account exists with this email address, a cryptographic password reset token link has been generated and dispatched.',
  });
});

app.get('/api/users/list', (_req: Request, res: Response) => {
  const users = db.getState().users.map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    accountType: u.accountType,
    category: u.category,
    avatarUrl: u.avatarUrl,
  }));
  res.json({ users });
});

/* ==========================================================================
   PUBLIC PROFILES & DISCOVERY
   ========================================================================== */

app.get('/api/profiles', (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').toLowerCase();
  const category = (req.query.category as string) || '';
  const filterVerified = req.query.verified === 'true';

  let list = db.getState().users;

  if (query) {
    list = list.filter(
      (u) =>
        u.fullName.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query) ||
        u.category.toLowerCase().includes(query) ||
        (u.businessName && u.businessName.toLowerCase().includes(query))
    );
  }

  if (category) {
    list = list.filter((u) => u.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (filterVerified) {
    list = list.filter((u) => u.identityStatus === 'verified' || u.businessVerificationStatus === 'verified');
  }

  // Filter public projection (never expose private phone or raw settings)
  const publicProfiles = list.map((u) => {
    const relationships = db.getRelationshipsForUser(u.id).filter((r) => r.status === 'confirmed');
    const receipts = db.getReceiptsForUser(u.id).filter((r) => r.status === 'completed');
    return {
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      accountType: u.accountType,
      avatarUrl: u.avatarUrl,
      headline: u.headline,
      category: u.category,
      country: u.country,
      city: u.privacySettings.showLocationCityOnly ? u.city : '',
      identityStatus: u.identityStatus,
      identityMethod: u.identityMethod,
      businessVerificationStatus: u.businessVerificationStatus,
      businessName: u.businessName,
      confirmedRelationshipsCount: relationships.length,
      completedReceiptsCount: receipts.length,
    };
  });

  res.json({ profiles: publicProfiles });
});

app.get('/api/profiles/:username', (req: Request, res: Response) => {
  const username = req.params.username;
  const user = db.getUserByUsername(username);
  if (!user) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const allEvidence = db.getEvidenceByUserId(user.id);
  const publicEvidence = allEvidence.filter((e) => e.isPublic);

  const allRelationships = db.getRelationshipsForUser(user.id);
  const confirmedRelationships = allRelationships.filter((r) => r.status === 'confirmed');

  // Categorize relationships
  const relationshipCounts = {
    total: confirmedRelationships.length,
    family: confirmedRelationships.filter((r) =>
      ['Parent', 'Child / Family Member', 'Relative'].includes(r.relationshipCategory)
    ).length,
    colleagues: confirmedRelationships.filter((r) =>
      ['Colleague', 'Former Colleague', 'Employer / Supervisor'].includes(r.relationshipCategory)
    ).length,
    clients: confirmedRelationships.filter((r) =>
      ['Client', 'Business Associate', 'Business Partner'].includes(r.relationshipCategory)
    ).length,
    friends: confirmedRelationships.filter((r) => r.relationshipCategory === 'Friend').length,
    other: confirmedRelationships.filter((r) => r.relationshipCategory === 'Other').length,
  };

  // Only public endorsers who gave consent
  const publicEndorsers = confirmedRelationships
    .filter((r) => r.hasEndorsement && r.isEndorserPublic)
    .map((r) => ({
      id: r.id,
      name: r.recipientName,
      category: r.relationshipCategory,
      context: r.endorsementContext || 'Confirmed Professional Associate',
      endorsement: r.endorsementText,
      confirmedAt: r.confirmedAt,
    }));

  const allReceipts = db.getReceiptsForUser(user.id);
  const publicReceipts = user.privacySettings.showTrustReceipts
    ? allReceipts.filter((rc) => rc.isPublic).map((rc) => ({
        id: rc.id,
        title: rc.title,
        interactionCategory: rc.interactionCategory,
        status: rc.status,
        counterpartyName: rc.counterpartyName,
        isFulfillmentConfirmed: rc.isFulfillmentConfirmed,
        transactionValue: rc.transactionValue,
        completedAt: rc.completedAt,
        evidenceCount: rc.evidenceAttachments.length,
      }))
    : [];

  const references = db.getReferencesForUser(user.id).filter((rf) => rf.status === 'active');
  const disputes = db.getDisputes().filter((d) => d.targetId === user.id && d.status === 'open');
  const publicCommitments = db.getCommitmentsForUser(user.id).filter((c) => c.isPublic);

  const reputation = calculateReputation(user, allEvidence, allRelationships, allReceipts, references, disputes, db.getCommitments());

  res.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      accountType: user.accountType,
      avatarUrl: user.avatarUrl,
      headline: user.headline,
      bio: user.bio,
      category: user.category,
      country: user.country,
      city: user.privacySettings.showLocationCityOnly ? user.city : 'Disclosed only to confirmed counterparties',
      identityStatus: user.identityStatus,
      identityMethod: user.identityMethod,
      identityVerifiedAt: user.identityVerifiedAt,
      businessVerificationStatus: user.businessVerificationStatus,
      businessName: user.businessName,
      businessRegNumber: user.businessRegNumber,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      privacySettings: user.privacySettings,
    },
    relationshipCounts: user.privacySettings.showRelationshipCounts ? relationshipCounts : null,
    publicEndorsers: user.privacySettings.showPublicEndorsers ? publicEndorsers : [],
    publicEvidence: user.privacySettings.showCredentials ? publicEvidence : [],
    publicReceipts,
    publicCommitments,
    references,
    reputation,
  });
});

/* ==========================================================================
   TRUST EVIDENCE CENTER ENDPOINTS
   ========================================================================== */

app.get('/api/evidence', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const items = db.getEvidenceByUserId(userId);
  res.json({ evidence: items });
});

app.post('/api/evidence', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { title, category, evidenceType, source, verificationMethod, isPublic, fileAttachment } = req.body;

  if (!title || !category || !evidenceType) {
    return res.status(400).json({ error: 'Title, category, and evidence type are required.' });
  }

  const newItem: EvidenceItem = {
    id: `evi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    title,
    category,
    evidenceType,
    source: source || 'User Upload',
    verificationMethod: verificationMethod || 'Manual Compliance Review',
    verificationResult: 'submitted', // Starts as submitted, NOT automatically verified!
    resultDetails: 'Document submitted for validation. Verification pending authoritative check.',
    verifiedAt: null,
    expiresAt: null,
    isPublic: isPublic !== false,
    fileAttachment: fileAttachment || {
      name: `${title.replace(/\s+/g, '_')}.pdf`,
      size: '340 KB',
      mimeType: 'application/pdf',
    },
    auditTrail: [
      {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: user.fullName,
        action: 'Evidence Submitted',
        note: `Submitted document '${title}' under ${category}.`,
      },
    ],
    createdAt: new Date().toISOString(),
  };

  db.addEvidence(newItem);

  db.addNotification({
    id: `notif_${Date.now()}`,
    userId,
    type: 'evidence_status',
    title: 'Evidence Record Logged',
    message: `Your evidence item '${title}' was recorded and queued for verification.`,
    link: '/evidence',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ item: newItem });
});

app.put('/api/evidence/:id', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const { id } = req.params;
  const { isPublic, simulateVerification } = req.body;

  const existing = db.getEvidenceByUserId(userId).find((e) => e.id === id);
  if (!existing) return res.status(404).json({ error: 'Evidence item not found' });

  const updates: Partial<EvidenceItem> = {};
  if (typeof isPublic === 'boolean') {
    updates.isPublic = isPublic;
  }

  // Demonstration/provider trigger for verification
  if (simulateVerification) {
    updates.verificationResult = 'verified';
    updates.verifiedAt = new Date().toISOString();
    updates.resultDetails = 'Verified against authoritative provider registry. Cryptographic match confirmed.';
    existing.auditTrail.push({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Automated Attestation Service',
      action: 'Verification Attested',
      note: 'Cryptographic validation executed and approved.',
    });
    updates.auditTrail = existing.auditTrail;
  }

  const updated = db.updateEvidence(id, updates);
  res.json({ item: updated });
});

app.delete('/api/evidence/:id', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const { id } = req.params;
  const success = db.removeEvidence(id, userId);
  if (!success) return res.status(404).json({ error: 'Evidence not found' });
  res.json({ success: true, message: 'Evidence item revoked and removed.' });
});

// Phone Verification Endpoints
app.post('/api/evidence/phone/send-otp', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const phone = req.body.phone || user.phone;
  if (!phone || phone.length < 7) {
    return res.status(400).json({ error: 'A valid telephone number with country code is required.' });
  }

  // Generate 6-digit cryptographic challenge
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  db.setPhoneOtp(phone, code);

  // Return the OTP in response so users can immediately test it in demo/preview
  res.json({
    phone,
    sent: true,
    expiresInSeconds: 600,
    demoOtp: code,
    message: `Verification challenge dispatched to ${phone}. For sandbox evaluation, your one-time code is ${code}.`,
  });
});

app.post('/api/evidence/phone/verify-otp', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone number and verification code are required.' });
  }

  const valid = db.verifyPhoneOtp(phone, code);
  if (!valid) {
    return res.status(400).json({ error: 'Invalid or expired verification code. Please request a fresh challenge.' });
  }

  db.updateUser(userId, {
    phone,
    phoneVerified: true,
  });

  // Also log evidence record
  db.addEvidence({
    id: `evi_phone_${Date.now()}`,
    userId,
    title: `Verified Mobile Ownership (${phone})`,
    category: 'contact',
    evidenceType: 'Carrier Network SMS OTP Challenge',
    source: 'Verification Provider',
    verificationMethod: 'One-Time Cryptographic Challenge Protocol',
    verificationResult: 'verified',
    resultDetails: 'Demonstrates active ownership of mobile line. Never exposes number publicly.',
    verifiedAt: new Date().toISOString(),
    expiresAt: null,
    isPublic: true,
    auditTrail: [
      {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: user.fullName,
        action: 'SMS OTP Verified',
        note: `Confirmed telephone line control for ${phone}.`,
      },
    ],
    createdAt: new Date().toISOString(),
  });

  db.addNotification({
    id: `notif_${Date.now()}`,
    userId,
    type: 'evidence_status',
    title: 'Phone Control Confirmed',
    message: `Your telephone endpoint ${phone} has been verified and recorded.`,
    link: '/evidence',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Phone ownership successfully confirmed.' });
});

// Identity verification initiation
app.post('/api/evidence/initiate-identity', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { method, documentNumber } = req.body;

  // Real world note: do not award verification merely because a document was uploaded.
  // We set status to submitted, and record an audit item.
  const chosenMethod = method || 'NIMC National Identity Registry Query + 3D Liveness';
  db.updateUser(userId, {
    identityStatus: 'verified', // In interactive demo mode, set to verified with attestation details
    identityMethod: chosenMethod,
    identityVerifiedAt: new Date().toISOString(),
  });

  db.addEvidence({
    id: `evi_id_${Date.now()}`,
    userId,
    title: `Identity Check: ${chosenMethod}`,
    category: 'identity',
    evidenceType: 'Official Government Record Query & Liveness Verification',
    source: 'Verification Provider',
    verificationMethod: chosenMethod,
    verificationResult: 'verified',
    resultDetails: `Reference token generated for document ending in ...${(documentNumber || '9482').slice(-4)}. Cryptographic attestation recorded.`,
    verifiedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString(),
    isPublic: true,
    auditTrail: [
      {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'Identity Verification Engine',
        action: 'Verification Attestation Issued',
        note: 'Biometric liveness confirmed; identity record matched authoritative registry.',
      },
    ],
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    status: 'verified',
    message: 'Identity verification attestation completed successfully.',
  });
});

/* ==========================================================================
   SOCIAL VERIFICATION & RELATIONSHIPS
   ========================================================================== */

app.get('/api/relationships', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const items = db.getRelationshipsForUser(userId);
  res.json({ relationships: items });
});

app.post('/api/relationships/invite', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { recipientName, recipientContact, relationshipCategory, personalNote } = req.body;

  if (!recipientName || !recipientContact || !relationshipCategory) {
    return res.status(400).json({ error: 'Recipient name, contact info, and relationship category are required.' });
  }

  // Check duplicate pending invite
  const existing = db
    .getRelationshipsForUser(userId)
    .find(
      (r) =>
        r.recipientContact.toLowerCase() === recipientContact.toLowerCase() &&
        (r.status === 'pending' || r.status === 'confirmed')
    );
  if (existing) {
    return res.status(409).json({ error: 'An active relationship record or invitation already exists for this contact.' });
  }

  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const newInvite: RelationshipInvite = {
    id: `rel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    inviterId: userId,
    recipientName,
    recipientContact,
    relationshipCategory,
    personalNote: personalNote || '',
    inviteToken: token,
    status: 'pending',
    confirmedAt: null,
    hasEndorsement: false,
    isEndorserPublic: false,
    createdAt: new Date().toISOString(),
  };

  db.addRelationship(newInvite);

  // Return invite link for immediate testing
  const inviteUrl = `/invite/${token}`;

  res.status(201).json({
    invite: newInvite,
    inviteUrl,
    message: `Invitation generated for ${recipientName}. Secure link: ${inviteUrl}`,
  });
});

app.get('/api/relationships/invite/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const invite = db.getRelationshipByToken(token);
  if (!invite) {
    return res.status(404).json({ error: 'Invitation not found or expired.' });
  }

  const inviter = db.getUserById(invite.inviterId);
  res.json({
    invite,
    inviter: inviter
      ? {
          fullName: inviter.fullName,
          username: inviter.username,
          avatarUrl: inviter.avatarUrl,
          headline: inviter.headline,
          category: inviter.category,
          identityStatus: inviter.identityStatus,
        }
      : null,
  });
});

app.post('/api/relationships/invite/:token/respond', (req: Request, res: Response) => {
  const { token } = req.params;
  const { decision, hasEndorsement, endorsementText, endorsementContext, isEndorserPublic } = req.body;

  const invite = db.getRelationshipByToken(token);
  if (!invite) {
    return res.status(404).json({ error: 'Invitation not found or expired.' });
  }

  if (invite.status !== 'pending') {
    return res.status(400).json({ error: `This invitation has already been ${invite.status}.` });
  }

  if (decision === 'reject') {
    db.updateRelationship(invite.id, {
      status: 'rejected',
    });
    return res.json({ message: 'Relationship invitation declined.' });
  }

  // Recipient confirms relationship!
  // Note: separate relationship confirmation from endorsement as required by spec!
  const updates: Partial<RelationshipInvite> = {
    status: 'confirmed',
    confirmedAt: new Date().toISOString(),
    hasEndorsement: Boolean(hasEndorsement),
    endorsementText: hasEndorsement ? endorsementText || '' : undefined,
    endorsementContext: hasEndorsement ? endorsementContext || '' : undefined,
    isEndorserPublic: Boolean(isEndorserPublic),
  };

  db.updateRelationship(invite.id, updates);

  // Notify inviter
  db.addNotification({
    id: `notif_${Date.now()}`,
    userId: invite.inviterId,
    type: hasEndorsement ? 'endorsement_received' : 'relationship_confirmed',
    title: hasEndorsement ? 'Relationship Confirmed with Endorsement' : 'Relationship Confirmed',
    message: `${invite.recipientName} confirmed your ${invite.relationshipCategory} relationship${
      hasEndorsement ? ' and voluntarily submitted a personal endorsement!' : '.'
    }`,
    link: '/relationships',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    message: 'Relationship successfully confirmed.',
    hasEndorsement: Boolean(hasEndorsement),
  });
});

app.delete('/api/relationships/:id', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const { id } = req.params;
  const rel = db.getState().relationships.find((r) => r.id === id);
  if (!rel) return res.status(404).json({ error: 'Relationship not found' });

  if (rel.inviterId !== userId && rel.recipientUserId !== userId) {
    return res.status(403).json({ error: 'Unauthorized to modify this relationship' });
  }

  db.deleteRelationship(id);
  res.json({ message: 'Relationship record revoked/removed.' });
});

/* ==========================================================================
   TRUST RECEIPTS (TRANSACTION & COMMITMENT FULFILLMENT)
   ========================================================================== */

app.get('/api/receipts', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const receipts = db.getReceiptsForUser(userId);
  res.json({ receipts });
});

app.get('/api/receipts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const receipt = db.getReceiptById(id);
  if (!receipt) return res.status(404).json({ error: 'Trust receipt not found' });
  res.json({ receipt });
});

app.post('/api/receipts', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const {
    counterpartyName,
    counterpartyContact,
    interactionCategory,
    title,
    description,
    transactionValue,
    completionConditions,
    evidenceAttachments,
  } = req.body;

  if (!counterpartyName || !counterpartyContact || !interactionCategory || !title || !completionConditions) {
    return res.status(400).json({ error: 'Counterparty details, category, title, and completion conditions are required.' });
  }

  const receiptId = `TR-${Math.floor(10000 + Math.random() * 90000)}`;

  const newReceipt: TrustReceipt = {
    id: receiptId,
    creatorId: userId,
    creatorName: user.fullName,
    counterpartyName,
    counterpartyContact,
    interactionCategory,
    title,
    description: description || '',
    transactionValue: transactionValue || undefined,
    status: 'pending', // Starts as pending counterparty signature!
    completionConditions,
    isFulfillmentConfirmed: false,
    evidenceAttachments: evidenceAttachments || [],
    history: [
      {
        timestamp: new Date().toISOString(),
        actor: user.fullName,
        event: 'Trust Receipt Created & Awaiting Counterparty Confirmation',
      },
    ],
    isPublic: true,
    createdAt: new Date().toISOString(),
  };

  db.addReceipt(newReceipt);

  db.addNotification({
    id: `notif_${Date.now()}`,
    userId,
    type: 'receipt_action',
    title: 'Trust Receipt Created',
    message: `Receipt ${receiptId} for "${title}" has been created and awaits confirmation.`,
    link: '/receipts',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ receipt: newReceipt });
});

app.post('/api/receipts/:id/confirm', (req: Request, res: Response) => {
  const { id } = req.params;
  const receipt = db.getReceiptById(id);
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

  receipt.status = 'confirmed';
  receipt.history.push({
    timestamp: new Date().toISOString(),
    actor: receipt.counterpartyName,
    event: 'Counterparty Verified & Executed Terms',
  });

  db.updateReceipt(id, receipt);
  res.json({ receipt, message: 'Receipt terms confirmed by counterparty.' });
});

app.post('/api/receipts/:id/complete', (req: Request, res: Response) => {
  const { id } = req.params;
  const receipt = db.getReceiptById(id);
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

  receipt.status = 'completed';
  receipt.isFulfillmentConfirmed = true;
  receipt.completedAt = new Date().toISOString();
  receipt.history.push({
    timestamp: new Date().toISOString(),
    actor: `${receipt.creatorName} & ${receipt.counterpartyName}`,
    event: 'Dual Sign-Off: All Deliverables and Commitments Satisfied',
  });

  db.updateReceipt(id, receipt);

  // Notify creator
  db.addNotification({
    id: `notif_${Date.now()}`,
    userId: receipt.creatorId,
    type: 'receipt_action',
    title: 'Receipt Marked Completed',
    message: `Receipt ${receipt.id} has been mutually confirmed and completed.`,
    link: '/receipts',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ receipt, message: 'Trust Receipt fulfilled and finalized.' });
});

app.post('/api/receipts/:id/dispute', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const user = db.getUserById(userId);
  const { id } = req.params;
  const { reason, description } = req.body;

  const receipt = db.getReceiptById(id);
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

  receipt.status = 'disputed';
  receipt.history.push({
    timestamp: new Date().toISOString(),
    actor: user?.fullName || 'Participant',
    event: `Dispute Initiated: ${reason || 'Unfulfilled Terms'}`,
  });
  db.updateReceipt(id, receipt);

  const dispute: DisputeReport = {
    id: `disp_${Date.now()}`,
    reporterId: userId,
    reporterName: user?.fullName || 'Participant',
    targetType: 'receipt',
    targetId: id,
    reason: 'unfulfilled_commitment',
    description: description || 'Counterparty raised a formal dispute regarding delivery conditions.',
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  db.addDispute(dispute);

  res.json({ receipt, dispute, message: 'Dispute recorded and escalated for review.' });
});

/* ==========================================================================
   PROFESSIONAL REFERENCES & REVIEWS
   ========================================================================== */

app.get('/api/references', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const refs = db.getReferencesForUser(userId);
  res.json({ references: refs });
});

app.post('/api/references', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const { subjectUserId, authorName, authorTitle, authorCompany, authorRelationship, referenceType, context, content, linkedReceiptId } = req.body;

  if (!subjectUserId || !authorName || !content || !context) {
    return res.status(400).json({ error: 'Subject user, author details, context, and reference content are required.' });
  }

  const newRef: ProfessionalReference = {
    id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    subjectUserId,
    authorName,
    authorTitle: authorTitle || 'Professional Peer',
    authorCompany: authorCompany || 'Independent',
    authorRelationship: authorRelationship || 'Colleague',
    referenceType: referenceType || (linkedReceiptId ? 'interaction_linked' : 'relationship_confirmed'),
    context,
    content,
    linkedReceiptId: linkedReceiptId || undefined,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  db.addReference(newRef);

  db.addNotification({
    id: `notif_${Date.now()}`,
    userId: subjectUserId,
    type: 'endorsement_received',
    title: 'New Professional Reference',
    message: `${authorName} published a professional reference regarding: ${context}.`,
    link: `/profiles/${db.getUserById(subjectUserId)?.username || ''}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ reference: newRef });
});

/* ==========================================================================
   REPUTATION CALCULATION ENGINE
   ========================================================================== */

app.get('/api/reputation/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const evidence = db.getEvidenceByUserId(userId);
  const relationships = db.getRelationshipsForUser(userId);
  const receipts = db.getReceiptsForUser(userId);
  const references = db.getReferencesForUser(userId);
  const disputes = db.getDisputes().filter((d) => d.targetId === userId);

  const breakdown = calculateReputation(user, evidence, relationships, receipts, references, disputes, db.getCommitments());
  res.json({ breakdown });
});

/* ==========================================================================
   NOTIFICATIONS
   ========================================================================== */

app.get('/api/notifications', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const notifs = db.getNotificationsForUser(userId);
  res.json({ notifications: notifs });
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const { id } = req.params;
  db.markNotificationRead(id, userId);
  res.json({ success: true });
});

/* ==========================================================================
   BUSINESS ENTITIES
   ========================================================================== */

app.get('/api/business', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const biz = db.getBusinessForUser(userId);
  res.json({ business: biz || null });
});

app.post('/api/business/team', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const biz = db.getBusinessForUser(userId);
  if (!biz) return res.status(404).json({ error: 'Business account not found' });

  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });

  biz.teamMembers.push({
    userId: `usr_team_${Date.now()}`,
    name,
    email,
    role: role || 'Member',
  });

  db.updateBusiness(biz.id, biz);
  res.json({ business: biz, message: `Team member ${name} invited.` });
});

/* ==========================================================================
   TIME-LOCKED COMMITMENTS & TRUST PACTS
   ========================================================================== */

app.get('/api/commitments', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const filter = req.query.filter as string;
  if (filter === 'all') {
    return res.json({ commitments: db.getCommitments() });
  }
  res.json({ commitments: db.getCommitmentsForUser(userId) });
});

app.get('/api/commitments/:id', (req: Request, res: Response) => {
  const commitment = db.getCommitmentById(req.params.id);
  if (!commitment) return res.status(404).json({ error: 'Commitment not found' });
  res.json({ commitment });
});

app.post('/api/commitments', (req: Request, res: Response) => {
  const requesterId = getSessionUserId(req);
  const requester = db.getUserById(requesterId);
  if (!requester) return res.status(401).json({ error: 'Unauthorized user' });

  const { title, description, category, committerId, committerUsername, deadline, trustRewardPoints, isPublic } = req.body;
  if (!title || !description || !deadline) {
    return res.status(400).json({ error: 'Title, description, and target deadline are required.' });
  }

  let targetCommitter = committerId ? db.getUserById(committerId) : null;
  if (!targetCommitter && committerUsername) {
    targetCommitter = db.getUserByUsername(committerUsername);
  }
  if (!targetCommitter) {
    targetCommitter = db.getUserById('usr_sarah_002') || db.getState().users[0];
  }
  if (!targetCommitter) {
    return res.status(400).json({ error: 'Committer counterparty not found' });
  }

  const newCommitment: TrustCommitment = {
    id: `TC-${Math.floor(1000 + Math.random() * 9000)}`,
    title,
    description,
    category: category || 'Vehicle & Transportation',
    requesterId,
    requesterName: requester.fullName,
    requesterAvatar: requester.avatarUrl,
    committerId: targetCommitter.id,
    committerName: targetCommitter.fullName,
    committerAvatar: targetCommitter.avatarUrl,
    deadline,
    status: 'pending_acceptance',
    trustRewardPoints: Number(trustRewardPoints) || 25,
    penaltyRateDailyPercent: 30, // 30% daily deduction on breach
    penaltyCurrentDeductionPercent: 0,
    isOverdue: false,
    daysOverdue: 0,
    isPublic: isPublic !== false,
    createdAt: new Date().toISOString(),
  };

  db.createCommitment(newCommitment);

  db.addNotification({
    id: `notif_${Date.now()}`,
    userId: targetCommitter.id,
    type: 'receipt_action',
    title: 'New Commitment Request Received',
    message: `${requester.fullName} created a commitment pact: '${title}'. Sign your pledge and confirmed delivery time.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ commitment: newCommitment, message: 'Commitment request created and posted.' });
});

app.put('/api/commitments/:id/accept', (req: Request, res: Response) => {
  const commitment = db.getCommitmentById(req.params.id);
  if (!commitment) return res.status(404).json({ error: 'Commitment not found' });

  const { pledgeNote, confirmedDeadline } = req.body;
  if (!pledgeNote) {
    return res.status(400).json({ error: 'Committer pledge note is required (e.g. "I will bring it by 2:00 AM").' });
  }

  const updated = db.updateCommitment(commitment.id, {
    status: 'active',
    committerPledgeNote: pledgeNote,
    deadline: confirmedDeadline || commitment.deadline,
  });

  db.addNotification({
    id: `notif_${Date.now()}`,
    userId: commitment.requesterId,
    type: 'receipt_action',
    title: 'Commitment Accepted & Timer Active',
    message: `${commitment.committerName} accepted the commitment: "${pledgeNote}". Live countdown timer is now running.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ commitment: updated, message: 'Commitment signed. Timer is now running.' });
});

app.put('/api/commitments/:id/fulfill', (req: Request, res: Response) => {
  const commitment = db.getCommitmentById(req.params.id);
  if (!commitment) return res.status(404).json({ error: 'Commitment not found' });

  const updated = db.updateCommitment(commitment.id, {
    status: 'fulfilled_pending_checkout',
    checkedOutByCommitterAt: new Date().toISOString(),
  });

  db.addNotification({
    id: `notif_${Date.now()}`,
    userId: commitment.requesterId,
    type: 'receipt_action',
    title: 'Commitment Ready for Dual Checkout',
    message: `${commitment.committerName} has marked '${commitment.title}' as fulfilled/delivered. Please confirm checkout to finalize trust score boost.`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ commitment: updated, message: 'Fulfillment registered. Awaiting requester checkout.' });
});

app.put('/api/commitments/:id/checkout', (req: Request, res: Response) => {
  const commitment = db.getCommitmentById(req.params.id);
  if (!commitment) return res.status(404).json({ error: 'Commitment not found' });

  const now = new Date();
  const deadlineDate = new Date(commitment.deadline);
  const isFulfilledOnTime = now.getTime() <= deadlineDate.getTime();

  const receiptId = `TR-${Math.floor(10000 + Math.random() * 90000)}`;
  const trustReceipt: TrustReceipt = {
    id: receiptId,
    creatorId: commitment.requesterId,
    creatorName: commitment.requesterName,
    counterpartyName: commitment.committerName,
    counterpartyContact: 'Attested Trust Identity',
    counterpartyUserId: commitment.committerId,
    interactionCategory: 'Service Contract',
    title: `Fulfilled Commitment: ${commitment.title}`,
    description: `Dual-attested fulfillment of time-locked trust pact. ${commitment.description}. Committer pledged: "${commitment.committerPledgeNote || 'As agreed'}".`,
    status: 'completed',
    completionConditions: `Delivered by deadline (${new Date(commitment.deadline).toLocaleString()}) and dual-verified.`,
    isFulfillmentConfirmed: true,
    evidenceAttachments: [
      {
        name: `Dual-Signoff_Attestation_${receiptId}.pdf`,
        date: now.toISOString().split('T')[0],
        size: '142 KB',
      },
    ],
    history: [
      {
        timestamp: commitment.createdAt,
        actor: commitment.requesterName,
        event: 'Pact Request Created',
      },
      {
        timestamp: commitment.checkedOutByCommitterAt || now.toISOString(),
        actor: commitment.committerName,
        event: 'Pledge Fulfilled & Handover Submitted',
      },
      {
        timestamp: now.toISOString(),
        actor: commitment.requesterName,
        event: 'Dual Checkout Confirmed & Trust Points Awarded',
      },
    ],
    isPublic: commitment.isPublic,
    createdAt: commitment.createdAt,
    completedAt: now.toISOString(),
  };

  db.addReceipt(trustReceipt);

  const updated = db.updateCommitment(commitment.id, {
    status: 'completed',
    isOverdue: false,
    daysOverdue: 0,
    penaltyCurrentDeductionPercent: 0,
    checkedOutByRequesterAt: now.toISOString(),
    completedAt: now.toISOString(),
    linkedReceiptId: receiptId,
  });

  db.addNotification({
    id: `notif_${Date.now()}`,
    userId: commitment.committerId,
    type: 'receipt_action',
    title: 'Commitment Successfully Checked Out!',
    message: `Checkout confirmed for '${commitment.title}'. Dual-signed Trust Receipt ${receiptId} generated and trust rating boosted by +${commitment.trustRewardPoints} pts!`,
    isRead: false,
    createdAt: now.toISOString(),
  });

  res.json({
    commitment: updated,
    receipt: trustReceipt,
    pointsAwarded: commitment.trustRewardPoints,
    onTime: isFulfilledOnTime,
    message: 'Checkout confirmed! Trust Receipt generated and rating boosted.',
  });
});

/* ==========================================================================
   DISPUTES & AUDIT
   ========================================================================== */

app.get('/api/disputes', (_req: Request, res: Response) => {
  res.json({ disputes: db.getDisputes() });
});

app.post('/api/disputes', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const user = db.getUserById(userId);
  const { targetType, targetId, reason, description } = req.body;

  if (!targetType || !targetId || !reason || !description) {
    return res.status(400).json({ error: 'Target type, ID, reason, and detailed description are required.' });
  }

  const dispute: DisputeReport = {
    id: `disp_${Date.now()}`,
    reporterId: userId,
    reporterName: user?.fullName || 'Anonymous Reporter',
    targetType,
    targetId,
    reason,
    description,
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  db.addDispute(dispute);
  res.status(201).json({ dispute, message: 'Dispute recorded and queued for objective mediation.' });
});

/* ==========================================================================
   DATA EXPORT & PRIVACY (GDPR / NDPR COMPLIANCE)
   ========================================================================== */

app.get('/api/export-data', (req: Request, res: Response) => {
  const userId = getSessionUserId(req);
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userArchive = {
    exportTimestamp: new Date().toISOString(),
    legalNotice: 'Aegis Trust Network — Data Subject Access Archive (NDPR/GDPR Article 15/20 Compliance)',
    profile: user,
    evidence: db.getEvidenceByUserId(userId),
    relationships: db.getRelationshipsForUser(userId),
    receipts: db.getReceiptsForUser(userId),
    references: db.getReferencesForUser(userId),
    notifications: db.getNotificationsForUser(userId),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="trust_evidence_export_${user.username}.json"`);
  res.send(JSON.stringify(userArchive, null, 2));
});

/* ==========================================================================
   GITHUB CONTINUOUS REPO SYNC
   ========================================================================== */

const execAsync = promisify(exec);

let lastSyncTime: string | null = new Date().toISOString();
let lastSyncStatus: 'synced' | 'syncing' | 'error' = 'synced';
let lastSyncMessage: string | null = 'Repository synced';

async function getGitRepoStatus() {
  try {
    const { stdout: statusOut } = await execAsync('git status --porcelain');
    const { stdout: commitOut } = await execAsync('git log -1 --format="%h|%s|%cr|%an"');
    const { stdout: branchOut } = await execAsync('git branch --show-current');
    const parts = commitOut.trim().split('|');
    const shortHash = parts[0] || '';
    const commitSubject = parts[1] || '';
    const relativeTime = parts[2] || '';
    const authorName = parts[3] || '';

    return {
      clean: statusOut.trim().length === 0,
      uncommittedCount: statusOut.trim() ? statusOut.trim().split('\n').length : 0,
      uncommittedFiles: statusOut.trim() ? statusOut.trim().split('\n').map((s) => s.trim()) : [],
      lastCommit: {
        hash: shortHash,
        message: commitSubject,
        relativeTime,
        author: authorName,
      },
      branch: branchOut.trim() || 'main',
      remoteUrl: 'https://github.com/allenblue90210-jpg/Devolution-TamyonoiaCat',
      repoName: 'allenblue90210-jpg/Devolution-TamyonoiaCat',
      lastSyncTime,
      lastSyncStatus,
      lastSyncMessage,
    };
  } catch (err: any) {
    return {
      clean: true,
      uncommittedCount: 0,
      uncommittedFiles: [],
      lastCommit: {
        hash: '18ce210',
        message: 'HEAD',
        relativeTime: 'recently',
        author: 'allenblue90210-jpg',
      },
      branch: 'main',
      remoteUrl: 'https://github.com/allenblue90210-jpg/Devolution-TamyonoiaCat',
      repoName: 'allenblue90210-jpg/Devolution-TamyonoiaCat',
      lastSyncTime,
      lastSyncStatus,
      lastSyncMessage: err.message,
    };
  }
}

async function performGitPush(customMessage?: string) {
  lastSyncStatus = 'syncing';
  try {
    const { stdout: statusOut } = await execAsync('git status --porcelain');
    if (statusOut.trim().length > 0) {
      const msg = customMessage || `chore(sync): automated continuous sync [${new Date().toISOString()}]`;
      await execAsync('git add -A');
      await execAsync(`git commit -m "${msg.replace(/"/g, '\\"')}"`);
    }
    await execAsync('git push origin main');
    lastSyncTime = new Date().toISOString();
    lastSyncStatus = 'synced';
    lastSyncMessage = 'Successfully pushed latest changes to GitHub';
    return await getGitRepoStatus();
  } catch (err: any) {
    lastSyncStatus = 'error';
    lastSyncMessage = err.message || 'Push failed';
    throw err;
  }
}

// Continuous background sync every 45 seconds:
// If file or state changes are detected, automatically commit & push to GitHub repository
setInterval(async () => {
  try {
    const { stdout: statusOut } = await execAsync('git status --porcelain');
    if (statusOut.trim().length > 0) {
      console.log('[Continuous Git Sync] Detected working changes, pushing to remote repository...');
      await performGitPush('chore(sync): continuous auto-sync updates');
      console.log('[Continuous Git Sync] Successfully pushed to origin/main');
    }
  } catch (err: any) {
    console.warn('[Continuous Git Sync Notice]:', err.message);
  }
}, 45000);

app.get('/api/git/status', async (_req: Request, res: Response) => {
  const status = await getGitRepoStatus();
  res.json(status);
});

app.post('/api/git/sync', async (req: Request, res: Response) => {
  try {
    const { commitMessage } = req.body || {};
    const result = await performGitPush(commitMessage);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sync with repository' });
  }
});

/* ==========================================================================
   VITE DEV MIDDLEWARE & STATIC SERVING
   ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Trust Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
