import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sqrhqhoclafdpptqplng.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcmhxaG9jbGFmZHBwdHFwbG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjQwMjIyNSwiZXhwIjoyMTA3OTc4MjI1fQ.nc5zyK1eqHFX_Lr9uI2tP548aubiwp1vB3GFOzXbt7Q';

const PRIMARY_USER_ID = 'usr_allen_nuclear';
const PRIMARY_USER_EMAIL = 'allennuclear001@gmail.com';

async function main() {
  console.log('=== Cleaning Fake Pacts, Receipts & Test Users ===');

  const dbPath = path.resolve(process.cwd(), 'data', 'db.json');
  const vaultDir = path.resolve(process.cwd(), 'data', 'vault');
  const vaultPactsPath = path.join(vaultDir, 'permanent_pacts.json');
  const vaultReceiptsPath = path.join(vaultDir, 'permanent_receipts.json');
  const vaultLedgerPath = path.join(vaultDir, 'immutable_ledger.jsonl');
  const vaultBackupPath = path.join(vaultDir, 'db_backup.json');

  // 1. Clean local db.json
  if (fs.existsSync(dbPath)) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    console.log(`Original users count: ${db.users?.length || 0}`);
    console.log(`Original commitments count: ${db.commitments?.length || 0}`);
    console.log(`Original receipts count: ${db.receipts?.length || 0}`);

    // Keep only primary user
    db.users = (db.users || []).filter(
      (u: any) => u.id === PRIMARY_USER_ID || u.email?.toLowerCase() === PRIMARY_USER_EMAIL
    );

    // Empty pacts and receipts
    db.commitments = [];
    db.receipts = [];

    // Filter ledger entries
    if (db.recordedLedger) {
      db.recordedLedger = db.recordedLedger.filter(
        (l: any) =>
          !l.targetId?.startsWith('TC-') &&
          !l.targetId?.startsWith('TR-') &&
          !l.entryType?.startsWith('RECEIPT_') &&
          !l.entryType?.startsWith('COMMITMENT_')
      );
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`Cleaned db.json: ${db.users.length} user (Allen Blue), 0 commitments, 0 receipts.`);

    if (fs.existsSync(vaultBackupPath)) {
      fs.writeFileSync(vaultBackupPath, JSON.stringify(db, null, 2), 'utf-8');
      console.log('Cleaned db_backup.json.');
    }
  }

  // 2. Clean Vault Files
  fs.writeFileSync(vaultPactsPath, JSON.stringify({}, null, 2), 'utf-8');
  fs.writeFileSync(vaultReceiptsPath, JSON.stringify({}, null, 2), 'utf-8');
  fs.writeFileSync(vaultLedgerPath, '', 'utf-8');
  console.log('Cleaned permanent_pacts.json, permanent_receipts.json, immutable_ledger.jsonl.');

  // 3. Clean Supabase Tables
  const client = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  console.log('Cleaning Supabase tables...');

  // Delete all commitments
  const { error: commErr } = await client
    .from('devolution_commitments')
    .delete()
    .neq('id', '___non_existent___');
  if (commErr) console.warn('Supabase commitments clear notice:', commErr.message);
  else console.log('Cleared all commitments from Supabase devolution_commitments.');

  // Delete all receipts
  const { error: recErr } = await client
    .from('devolution_receipts')
    .delete()
    .neq('id', '___non_existent___');
  if (recErr) console.warn('Supabase receipts clear notice:', recErr.message);
  else console.log('Cleared all receipts from Supabase devolution_receipts.');

  // Delete all test users except primary
  const { error: usrErr } = await client
    .from('devolution_users')
    .delete()
    .neq('id', PRIMARY_USER_ID);
  if (usrErr) console.warn('Supabase users clear notice:', usrErr.message);
  else console.log('Deleted all secondary test users from Supabase devolution_users.');

  // Update devolution_state with the clean data
  const cleanDb = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const { error: stateErr } = await client
    .from('devolution_state')
    .upsert({
      id: 'primary',
      data: cleanDb,
      user_count: cleanDb.users?.length || 0,
      receipt_count: cleanDb.receipts?.length || 0,
      commitment_count: cleanDb.commitments?.length || 0,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  if (stateErr) console.warn('Supabase state update notice:', stateErr.message);
  else console.log('Updated Supabase devolution_state with clean state snapshot.');

  console.log('=== Cleanup Complete Successfully ===');
}

main().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
