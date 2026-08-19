#!/usr/bin/env node
/**
 * Applies supabase/migrations/*.sql in filename order.
 *
 * Migrations are tracked in a `_migrations` table and each file runs inside its
 * own transaction, so re-running this is safe and a failure never leaves the
 * schema half-applied.
 *
 *   npm run db:push            # apply everything pending
 *   npm run db:push -- --dry   # list what would run
 *   npm run db:push -- --seed  # also run supabase/seed.sql afterwards
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import 'dotenv/config';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(root, 'supabase', 'migrations');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
const withSeed = args.includes('--seed');

const connectionString = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    '\n  Missing DATABASE_URL.\n\n' +
      '  Supabase dashboard → Project Settings → Database → Connection string → URI\n' +
      '  (use the *session* pooler string on port 5432), then put it in .env as:\n\n' +
      '    DATABASE_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres\n',
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  // Supabase terminates TLS with a cert this client has no CA bundle for.
  ssl: { rejectUnauthorized: false },
  statement_timeout: 120_000,
});

const sha = (text) => createHash('sha256').update(text).digest('hex').slice(0, 16);

async function main() {
  await client.connect();
  await client.query('set search_path to public, extensions');
  await client.query(`
    create table if not exists _migrations (
      name       text primary key,
      checksum   text not null,
      applied_at timestamptz not null default now()
    )
  `);

  const applied = new Map(
    (await client.query('select name, checksum from _migrations')).rows.map((r) => [r.name, r.checksum]),
  );

  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  let ran = 0;

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    const checksum = sha(sql);
    const previous = applied.get(file);

    if (previous === checksum) {
      console.log(`  ✓ ${file} — already applied`);
      continue;
    }
    if (previous && previous !== checksum) {
      // Every migration here is written to be idempotent, so re-running an
      // edited file is the intended way to iterate before launch.
      console.log(`  ↻ ${file} — changed since it was applied, re-running`);
    }
    if (dryRun) {
      console.log(`  → ${file} — would run`);
      continue;
    }

    process.stdout.write(`  … ${file}`);
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query(
        `insert into _migrations (name, checksum) values ($1, $2)
         on conflict (name) do update set checksum = excluded.checksum, applied_at = now()`,
        [file, checksum],
      );
      await client.query('commit');
      console.log(`\r  ✓ ${file} — applied     `);
      ran += 1;
    } catch (error) {
      await client.query('rollback');
      console.log(`\r  ✗ ${file} — failed      \n`);
      console.error(`     ${error.message}`);
      if (error.position) {
        const upto = sql.slice(0, Number(error.position));
        console.error(`     at line ${upto.split('\n').length}`);
      }
      if (error.hint) console.error(`     hint: ${error.hint}`);
      process.exit(1);
    }
  }

  if (withSeed && !dryRun) {
    const seedPath = path.join(root, 'supabase', 'seed.sql');
    if (existsSync(seedPath)) {
      process.stdout.write('  … seed.sql');
      await client.query(await readFile(seedPath, 'utf8'));
      console.log('\r  ✓ seed.sql — applied  ');
    }
  }

  console.log(`\n  ${ran === 0 ? 'Schema already up to date.' : `Applied ${ran} migration(s).`}\n`);
  await client.end();
}

main().catch(async (error) => {
  console.error(`\n  ${error.message}\n`);
  await client.end().catch(() => {});
  process.exit(1);
});
