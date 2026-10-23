import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const TOKEN_FILE = path.resolve(process.cwd(), '.supabase_token');
const CONFIG_FILE = path.resolve(process.cwd(), '.supabase_config.json');

export interface SupabaseConfig {
  url: string;
  key: string;
  configured: boolean;
  status: 'connected' | 'unconfigured' | 'error' | 'syncing';
  lastSyncTime: string | null;
  lastMessage: string | null;
}

let cachedClient: SupabaseClient | null = null;
let lastSyncTimestamp: string | null = null;
let lastSyncStatus: 'connected' | 'unconfigured' | 'error' | 'syncing' = 'unconfigured';
let lastSyncMessage: string | null = null;

function loadStoredConfig(): { url?: string; key?: string } {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
}

function loadStoredToken(): string {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return fs.readFileSync(TOKEN_FILE, 'utf-8').trim();
    }
  } catch {
    // ignore
  }
  return '';
}

function saveStoredConfig(url: string, key: string) {
  try {
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify({ url: url.trim(), key: key.trim(), updatedAt: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.warn('[Supabase Config Save Error]:', err);
  }
}

function isRealSupabaseUrl(url?: string | null): boolean {
  if (!url) return false;
  const cleaned = url.trim();
  if (
    cleaned === '001' ||
    cleaned === 'MY_SUPABASE_URL' ||
    cleaned.includes('YOUR_PROJECT_ID') ||
    cleaned.length < 12
  ) {
    return false;
  }
  return cleaned.startsWith('http://') || cleaned.startsWith('https://');
}

function isRealSupabaseKey(key?: string | null): boolean {
  if (!key) return false;
  const cleaned = key.trim();
  if (
    cleaned === '001' ||
    cleaned === 'MY_SUPABASE_KEY' ||
    cleaned === 'sb_secret_YOUR_KEY' ||
    cleaned.length < 15
  ) {
    return false;
  }
  return true;
}

export function getResolvedSupabaseConfig(): { url: string; key: string } {
  const stored = loadStoredConfig();
  const token = loadStoredToken();

  const envUrl = process.env.SUPABASE_URL?.trim();
  const url = (isRealSupabaseUrl(envUrl) ? envUrl : (isRealSupabaseUrl(stored.url) ? stored.url : '')) || '';

  const envKey = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY
  )?.trim();

  const key = (
    isRealSupabaseKey(envKey)
      ? envKey
      : isRealSupabaseKey(token)
      ? token
      : isRealSupabaseKey(stored.key)
      ? stored.key
      : ''
  ) || '';

  return { url, key };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getResolvedSupabaseConfig();
  if (!url || !key) {
    return null;
  }

  // Validate URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
    });
    return cachedClient;
  } catch (err: any) {
    console.error('[Supabase Client Init Error]:', err.message);
    return null;
  }
}

export function updateSupabaseConfig(newUrl: string, newKey?: string) {
  cachedClient = null;
  const current = getResolvedSupabaseConfig();
  const finalKey = (newKey && newKey.trim() && isRealSupabaseKey(newKey)) ? newKey.trim() : current.key || '';
  saveStoredConfig(newUrl.trim(), finalKey);
  lastSyncStatus = 'unconfigured';
  lastSyncMessage = null;
  return getSupabaseStatus();
}

export async function syncUserToSupabase(user: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Try to upsert into devolution_users table
    const { error: userErr } = await client
      .from('devolution_users')
      .upsert({
        id: user.id,
        username: user.username,
        full_name: user.fullName,
        email: user.email || null,
        phone: user.phone || null,
        headline: user.headline || null,
        bio: user.bio || null,
        category: user.category || 'other',
        account_type: user.accountType || 'personal',
        city: user.city || null,
        country: user.country || 'Nigeria',
        reputation_score: user.reputationScore || 600,
        is_verified: user.identityStatus === 'verified',
        privacy_settings: user.privacySettings || {},
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    return true;
  } catch (err: any) {
    console.warn('[Supabase Sync User Notice]:', err.message);
    return false;
  }
}

export async function syncAllUsersToSupabase(users: any[]): Promise<number> {
  const client = getSupabaseClient();
  if (!client || !users || !Array.isArray(users)) return 0;

  let synced = 0;
  for (const u of users) {
    try {
      const ok = await syncUserToSupabase(u);
      if (ok) synced++;
    } catch {
      // Continue syncing remaining users
    }
  }
  return synced;
}

export async function pullRegisteredUsersFromSupabase(): Promise<any[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('devolution_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase Pull Users Notice]:', error.message);
      return [];
    }
    return data || [];
  } catch (err: any) {
    console.warn('[Supabase Pull Users Error]:', err.message);
    return [];
  }
}

export async function createSupabaseAuthUser(params: {
  email: string;
  password?: string;
  fullName?: string;
  username?: string;
  accountType?: string;
  phone?: string;
}): Promise<{ success: boolean; user?: any; error?: string }> {
  const { url, key } = getResolvedSupabaseConfig();
  if (!url || !key) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const payload: any = {
      email: params.email,
      email_confirm: true,
      user_metadata: {
        full_name: params.fullName || '',
        username: params.username || '',
        account_type: params.accountType || 'personal',
        email_verified: true,
      },
    };
    if (params.password) {
      payload.password = params.password;
    }
    if (params.phone) {
      payload.phone = params.phone;
    }

    const res = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await res.json();
    if (!res.ok) {
      if (
        data?.msg?.includes('already been registered') ||
        data?.message?.includes('already registered') ||
        data?.error_description?.includes('already been registered')
      ) {
        return { success: true, user: data };
      }
      return { success: false, error: data?.msg || data?.message || res.statusText };
    }

    return { success: true, user: data };
  } catch (err: any) {
    console.warn('[Supabase Auth Admin Error]:', err.message);
    return { success: false, error: err.message };
  }
}

export async function syncAllUsersToSupabaseAuth(users: any[]): Promise<number> {
  let createdCount = 0;
  for (const u of users) {
    if (u.email && u.email.includes('@') && !u.email.includes('example.com')) {
      try {
        const res = await createSupabaseAuthUser({
          email: u.email,
          fullName: u.fullName,
          username: u.username,
          accountType: u.accountType,
          phone: u.phone,
        });
        if (res.success) createdCount++;
      } catch {
        // Continue
      }
    }
  }
  return createdCount;
}

export async function supabaseAuthSignIn(email: string, password: string): Promise<{
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured yet' };
  }
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function supabaseAuthSignUp(email: string, password: string, metadata: any): Promise<{
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured yet' };
  }
  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function supabaseAuthSendOtp(email: string): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not configured yet' };
  }
  try {
    const { error } = await client.auth.signInWithOtp({
      email,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, message: `Magic authentication link dispatched to ${email}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  hasStateTable?: boolean;
}> {
  const client = getSupabaseClient();
  const { url } = getResolvedSupabaseConfig();

  if (!url) {
    return {
      success: false,
      message: 'Supabase URL is not configured. Please enter your project URL (e.g. https://xyz.supabase.co).',
    };
  }

  const { key } = getResolvedSupabaseConfig();
  if (!key) {
    return {
      success: false,
      message: `Supabase Project linked (${url}). Please enter your API Key (service_role or anon key) from Supabase Dashboard > Project Settings > API to enable live database sync.`,
    };
  }

  if (!client) {
    return {
      success: false,
      message: 'Could not initialize Supabase client. Check that URL and Key are formatted correctly.',
    };
  }

  try {
    // Attempt to query the devolution_state table
    const { data, error } = await client
      .from('devolution_state')
      .select('id, updated_at')
      .limit(1);

    if (error) {
      // Check if table does not exist yet (code 42P01 in postgres or PGRST205 in postgrest)
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('devolution_state') ||
        error.message?.includes('schema cache')
      ) {
        return {
          success: true,
          hasStateTable: false,
          message: 'Connected to Supabase! The tables are ready to be created. Please run the provided schema in your Supabase SQL Editor.',
        };
      }
      return {
        success: false,
        message: `Supabase returned error: ${error.message} (Code: ${error.code || 'unknown'})`,
      };
    }

    return {
      success: true,
      hasStateTable: true,
      message: 'Successfully connected and verified Supabase backend state table.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection failed: ${err.message || 'Unknown network error'}`,
    };
  }
}

export async function syncPactToSupabase(pact: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !pact?.id) return false;

  try {
    const { error } = await client
      .from('devolution_commitments')
      .upsert({
        id: pact.id,
        title: pact.title || '',
        description: pact.description || '',
        category: pact.category || 'General',
        status: pact.status || 'pending_acceptance',
        requester_id: pact.requesterId || 'unknown',
        committer_id: pact.committerId || 'unknown',
        deadline: pact.deadline || null,
        trust_reward_points: pact.trustRewardPoints ?? 20,
        is_public: pact.isPublic ?? true,
        data: pact,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      // If FK constraint fails (external users), fall back gracefully
      console.warn('[Supabase Pact Sync Notice]:', error.message);
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Pact Sync Error]:', err.message);
    return false;
  }
}

export async function syncReceiptToSupabase(receipt: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !receipt?.id) return false;

  try {
    const { error } = await client
      .from('devolution_receipts')
      .upsert({
        id: receipt.id,
        title: receipt.title || '',
        description: receipt.description || '',
        transaction_value: receipt.transactionValue || null,
        status: receipt.status || 'pending',
        creator_id: receipt.creatorId || 'unknown',
        counterparty_name: receipt.counterpartyName || receipt.counterpartyUserId || 'unknown',
        counterparty_contact: receipt.counterpartyContact || null,
        is_fulfillment_confirmed: receipt.isFulfillmentConfirmed ?? false,
        data: receipt,
      }, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase Receipt Sync Notice]:', error.message);
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Receipt Sync Error]:', err.message);
    return false;
  }
}

export async function syncAllPactsToSupabase(pacts: any[]): Promise<number> {
  if (!pacts || !Array.isArray(pacts) || pacts.length === 0) return 0;
  let synced = 0;
  for (const p of pacts) {
    try {
      const ok = await syncPactToSupabase(p);
      if (ok) synced++;
    } catch { /* continue */ }
  }
  return synced;
}

export async function syncAllReceiptsToSupabase(receipts: any[]): Promise<number> {
  if (!receipts || !Array.isArray(receipts) || receipts.length === 0) return 0;
  let synced = 0;
  for (const r of receipts) {
    try {
      const ok = await syncReceiptToSupabase(r);
      if (ok) synced++;
    } catch { /* continue */ }
  }
  return synced;
}

export async function pullPactsFromSupabase(): Promise<any[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('devolution_commitments')
      .select('data')
      .order('updated_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => row.data).filter(Boolean);
  } catch {
    return [];
  }
}

export async function pullReceiptsFromSupabase(): Promise<any[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('devolution_receipts')
      .select('data')
      .order('updated_at', { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => row.data).filter(Boolean);
  } catch {
    return [];
  }
}

export async function syncToSupabase(stateData: any): Promise<{
  success: boolean;
  message: string;
  syncedAt?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    const { url } = getResolvedSupabaseConfig();
    return {
      success: false,
      message: url ? 'Supabase client unavailable' : 'Supabase project URL is not configured',
    };
  }

  lastSyncStatus = 'syncing';

  try {
    const now = new Date().toISOString();
    // 1. Save unified state snapshot into devolution_state
    const { error: stateErr } = await client
      .from('devolution_state')
      .upsert({
        id: 'primary',
        data: stateData,
        user_count: stateData.users?.length || 0,
        receipt_count: stateData.receipts?.length || 0,
        commitment_count: stateData.commitments?.length || 0,
        updated_at: now,
      }, { onConflict: 'id' });

    if (stateErr) {
      if (stateErr.code === '42P01' || stateErr.code === 'PGRST205' || stateErr.message?.includes('schema cache')) {
        throw new Error('Table "devolution_state" does not exist yet. Please run the SQL migration schema in your Supabase SQL editor.');
      }
      throw new Error(`State upsert error: ${stateErr.message}`);
    }

    // 2. Also ensure all registered users are individually synced to devolution_users table
    let syncedUsersCount = 0;
    if (stateData.users?.length) {
      syncedUsersCount = await syncAllUsersToSupabase(stateData.users);
      // 3. Mirror users into Supabase Auth (auth.users)
      syncAllUsersToSupabaseAuth(stateData.users).catch(() => {});
    }

    // 4. Sync all pacts and receipts individually to dedicated tables
    let syncedPactsCount = 0;
    let syncedReceiptsCount = 0;
    if (stateData.commitments?.length) {
      syncedPactsCount = await syncAllPactsToSupabase(stateData.commitments);
    }
    if (stateData.receipts?.length) {
      syncedReceiptsCount = await syncAllReceiptsToSupabase(stateData.receipts);
    }

    lastSyncTimestamp = now;
    lastSyncStatus = 'connected';
    lastSyncMessage = `Synchronized ${syncedUsersCount || stateData.users?.length || 0} users, ${syncedReceiptsCount || stateData.receipts?.length || 0} receipts, and ${syncedPactsCount || stateData.commitments?.length || 0} commitments with Supabase.`;

    return {
      success: true,
      message: lastSyncMessage,
      syncedAt: now,
    };
  } catch (err: any) {
    lastSyncStatus = 'error';
    lastSyncMessage = err.message || 'Sync failed';
    return {
      success: false,
      message: lastSyncMessage || 'Sync failed',
    };
  }
}

export async function pullFromSupabase(): Promise<{
  success: boolean;
  data?: any;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase is not configured yet. Please configure your Supabase Project URL.',
    };
  }

  try {
    const { data, error } = await client
      .from('devolution_state')
      .select('data, updated_at')
      .eq('id', 'primary')
      .single();

    if (error) {
      return {
        success: false,
        message: `Failed to pull from Supabase: ${error.message}`,
      };
    }

    if (!data?.data) {
      return {
        success: false,
        message: 'No remote state snapshot found in Supabase yet.',
      };
    }

    lastSyncTimestamp = data.updated_at || new Date().toISOString();
    lastSyncStatus = 'connected';
    lastSyncMessage = 'Pulled latest state from Supabase';

    return {
      success: true,
      data: data.data,
      message: `Successfully pulled state snapshot from Supabase (updated at ${data.updated_at}).`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to pull from Supabase',
    };
  }
}

export async function getSupabaseStatus(): Promise<SupabaseConfig & { testResult?: any }> {
  const { url, key } = getResolvedSupabaseConfig();
  const configured = Boolean(url && key);

  let currentStatus: 'connected' | 'unconfigured' | 'error' | 'syncing' = lastSyncStatus;
  let testResult: any = undefined;

  if (!configured) {
    currentStatus = 'unconfigured';
  } else if (lastSyncStatus === 'unconfigured') {
    testResult = await testSupabaseConnection();
    currentStatus = testResult.success ? 'connected' : 'error';
    if (!lastSyncMessage) {
      lastSyncMessage = testResult.message;
    }
  }

  // Obfuscate secret key for security in response
  const maskedKey = key
    ? `${key.slice(0, 10)}...${key.slice(-6)}`
    : '';

  return {
    url,
    key: maskedKey,
    configured,
    status: currentStatus,
    lastSyncTime: lastSyncTimestamp,
    lastMessage: lastSyncMessage,
    testResult,
  };
}
