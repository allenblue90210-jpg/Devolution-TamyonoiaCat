import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;
const PRIMARY_USER_ID = 'usr_allen_nuclear';

async function main() {
  console.log('=== SCORCHED EARTH CLEANUP ===');

  // 1. Clean local db.json — keep ONLY primary user, zero everything else
  const dbPath = path.resolve(process.cwd(), 'data', 'db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  
  const primaryUser = db.users.find((u: any) => u.id === PRIMARY_USER_ID);
  if (!primaryUser) {
    console.error('PRIMARY USER NOT FOUND! Aborting.');
    process.exit(1);
  }

  db.users = [primaryUser];
  db.commitments = [];
  db.receipts = [];
  db.recordedLedger = [];
  db.goodFaithRatings = [];
  db.impressions = {};
  db.rememberRecords = [];
  // Keep evidence, relationships, references, disputes, notifications, businesses, phoneOtps as-is

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`Local db.json: 1 user (${primaryUser.username}), 0 commitments, 0 receipts`);

  // 2. Clean vault files completely
  const vaultDir = path.resolve(process.cwd(), 'data', 'vault');
  fs.writeFileSync(path.join(vaultDir, 'permanent_pacts.json'), '{}', 'utf-8');
  fs.writeFileSync(path.join(vaultDir, 'permanent_receipts.json'), '{}', 'utf-8');
  fs.writeFileSync(path.join(vaultDir, 'immutable_ledger.jsonl'), '', 'utf-8');
  fs.writeFileSync(path.join(vaultDir, 'db_backup.json'), JSON.stringify(db, null, 2), 'utf-8');
  console.log('Vault files wiped clean.');

  // 3. Clean ALL Supabase tables
  const client = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // Delete ALL commitments
  const { error: e1 } = await client.from('devolution_commitments').delete().neq('id', '___');
  console.log('devolution_commitments:', e1 ? e1.message : 'CLEARED');

  // Delete ALL receipts
  const { error: e2 } = await client.from('devolution_receipts').delete().neq('id', '___');
  console.log('devolution_receipts:', e2 ? e2.message : 'CLEARED');

  // Delete ALL users except primary
  const { error: e3 } = await client.from('devolution_users').delete().neq('id', PRIMARY_USER_ID);
  console.log('devolution_users (non-primary):', e3 ? e3.message : 'CLEARED');

  // Update the state blob with clean data — THIS IS THE KEY FIX
  const { error: e4 } = await client.from('devolution_state').upsert({
    id: 'primary',
    data: db,  // The clean db with only 1 user, 0 pacts, 0 receipts
    user_count: 1,
    receipt_count: 0,
    commitment_count: 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  console.log('devolution_state:', e4 ? e4.message : 'UPDATED WITH CLEAN STATE');

  // Verify
  const { data: users } = await client.from('devolution_users').select('id,username,email');
  const { data: comms } = await client.from('devolution_commitments').select('id');
  const { data: recs } = await client.from('devolution_receipts').select('id');
  const { data: state } = await client.from('devolution_state').select('user_count,commitment_count,receipt_count').eq('id', 'primary').single();
  
  console.log('\n=== VERIFICATION ===');
  console.log('Supabase users:', users?.length, users?.map((u: any) => `${u.username} (${u.email})`));
  console.log('Supabase commitments:', comms?.length);
  console.log('Supabase receipts:', recs?.length);
  console.log('State blob counts:', state);
  console.log('=== DONE ===');
}

main().catch(err => { console.error(err); process.exit(1); });
