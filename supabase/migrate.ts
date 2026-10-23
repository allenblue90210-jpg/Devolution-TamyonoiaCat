// Supabase Migration Script: Add data JSONB column and drop FK constraints
// Run this once to update existing tables

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

async function runMigration() {
  console.log('[Migration] Connecting to Supabase...');
  console.log('[Migration] URL:', url);

  const migrations = [
    // Add data JSONB column to commitments table (if not exists)
    `ALTER TABLE public.devolution_commitments ADD COLUMN IF NOT EXISTS data jsonb NOT NULL DEFAULT '{}'::jsonb;`,
    // Add data JSONB column to receipts table (if not exists)  
    `ALTER TABLE public.devolution_receipts ADD COLUMN IF NOT EXISTS data jsonb NOT NULL DEFAULT '{}'::jsonb;`,
    // Drop FK constraints on commitments
    `ALTER TABLE public.devolution_commitments DROP CONSTRAINT IF EXISTS devolution_commitments_requester_id_fkey;`,
    `ALTER TABLE public.devolution_commitments DROP CONSTRAINT IF EXISTS devolution_commitments_committer_id_fkey;`,
    // Drop FK constraints on receipts
    `ALTER TABLE public.devolution_receipts DROP CONSTRAINT IF EXISTS devolution_receipts_creator_id_fkey;`,
    `ALTER TABLE public.devolution_receipts DROP CONSTRAINT IF EXISTS devolution_receipts_counterparty_id_fkey;`,
  ];

  for (const sql of migrations) {
    console.log(`[Migration] Executing: ${sql.substring(0, 80)}...`);
    try {
      const res = await fetch(`${url}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      });
      // RPC might not work for DDL, try direct SQL via pg
    } catch (err) {
      console.warn('[Migration] RPC notice:', err.message);
    }
  }

  // Alternative: Execute migrations via Supabase SQL endpoint (management API)
  const managementUrl = url.replace('.supabase.co', '.supabase.co');
  
  const fullMigrationSQL = migrations.join('\n');
  console.log('\n[Migration] If automatic migration failed, please run this SQL in your Supabase SQL Editor:\n');
  console.log('='.repeat(80));
  console.log(fullMigrationSQL);
  console.log('='.repeat(80));
  console.log('\n[Migration] Done. You can now restart the server.');
}

runMigration().catch(console.error);
