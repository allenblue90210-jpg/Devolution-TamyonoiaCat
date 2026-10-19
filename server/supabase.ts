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

export function getResolvedSupabaseConfig(): { url: string; key: string } {
  const stored = loadStoredConfig();
  const token = loadStoredToken();
  const url = (process.env.SUPABASE_URL || stored.url || '').trim();
  const key = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    token ||
    stored.key ||
    ''
  ).trim();
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
  const finalKey = (newKey && newKey.trim()) ? newKey.trim() : current.key || '';
  saveStoredConfig(newUrl.trim(), finalKey);
  return getSupabaseStatus();
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
      // Check if table does not exist yet (code 42P01 in postgres)
      if (error.code === '42P01' || error.message?.includes('relation "devolution_state" does not exist')) {
        return {
          success: true,
          hasStateTable: false,
          message: 'Connected to Supabase! The "devolution_state" table has not been created yet. Run the provided schema in Supabase SQL Editor.',
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
      if (stateErr.code === '42P01') {
        throw new Error('Table "devolution_state" does not exist yet. Please run the SQL migration schema in your Supabase SQL editor.');
      }
      throw new Error(`State upsert error: ${stateErr.message}`);
    }

    lastSyncTimestamp = now;
    lastSyncStatus = 'connected';
    lastSyncMessage = `Synchronized ${stateData.users?.length || 0} users, ${stateData.receipts?.length || 0} receipts, and ${stateData.commitments?.length || 0} commitments with Supabase.`;

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
