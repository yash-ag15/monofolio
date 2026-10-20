// Where accounts and saved data live.
//   DATABASE_URL set → Neon Postgres (tables are created automatically on first start)
//   otherwise        → JSON files in DATA_DIR (fine for local testing)
// Both stores have the same async API, used by auth.js.
//
// Neon tables:
//   users      — one row per account: email, name, avatar, password hash, Google id, how they signed up,
//                when they joined, last sign-in and how many times they signed in
//   user_data  — each user's saved app data (profile, resumes, portfolio…) as JSON

import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const SCHEMA = [
  `create table if not exists users (
    id text primary key,
    email text not null unique,
    name text not null default '',
    avatar text not null default '',
    password_hash text,
    google_sub text unique,
    signup_method text not null default 'email',
    is_demo boolean not null default false,
    session_version integer not null default 0,
    created_at timestamptz not null default now(),
    last_login_at timestamptz,
    last_login_method text,
    login_count integer not null default 0
  )`,
  `create table if not exists user_data (
    user_id text primary key references users(id) on delete cascade,
    state jsonb not null,
    saved_at bigint not null,
    updated_at timestamptz not null default now()
  )`,
  'create index if not exists users_demo_created on users (is_demo, created_at)',
];

// row ↔ the user object auth.js works with
const fromRow = (r) =>
  r && {
    id: r.id,
    email: r.email,
    name: r.name,
    avatar: r.avatar,
    pass: r.password_hash || undefined,
    googleSub: r.google_sub || undefined,
    sv: r.session_version,
    created: new Date(r.created_at).getTime(),
  };

function neonStore(url, fileDir) {
  const sql = neon(url);
  const q = (text, params = []) => sql.query(text, params);
  const one = async (text, params) => fromRow((await q(text, params))[0]);

  return {
    kind: 'neon',
    async init() {
      for (const s of SCHEMA) await q(s);
      await importFiles(this, fileDir);
    },
    byId: (id) => one('select * from users where id = $1', [id]),
    byEmail: (email) => one('select * from users where email = $1', [email]),
    byGoogle: (sub) => one('select * from users where google_sub = $1', [sub]),
    async insert(u, method) {
      await q(
        `insert into users (id, email, name, avatar, password_hash, google_sub, signup_method, is_demo, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, to_timestamp($9 / 1000.0)) on conflict do nothing`,
        [u.id, u.email, u.name || '', u.avatar || '', u.pass || null, u.googleSub || null, method, false, u.created || Date.now()]
      );
    },
    async update(id, patch) {
      await q(
        `update users set name = coalesce($2, name), avatar = coalesce($3, avatar), google_sub = coalesce($4, google_sub) where id = $1`,
        [id, patch.name ?? null, patch.avatar ?? null, patch.googleSub ?? null]
      );
    },
    async recordLogin(id, method) {
      await q('update users set last_login_at = now(), last_login_method = $2, login_count = login_count + 1 where id = $1', [id, method]);
    },
    async getData(id) {
      const r = (await q('select state, saved_at from user_data where user_id = $1', [id]))[0];
      return r ? { state: r.state, savedAt: Number(r.saved_at) } : null;
    },
    async putData(id, state, savedAt) {
      await q(
        `insert into user_data (user_id, state, saved_at, updated_at) values ($1, $2::jsonb, $3, now())
         on conflict (user_id) do update set state = excluded.state, saved_at = excluded.saved_at, updated_at = now()`,
        [id, JSON.stringify(state), savedAt]
      );
    },
  };
}

function fileStore(dir) {
  const stateDir = path.join(dir, 'state');
  fs.mkdirSync(stateDir, { recursive: true });
  const usersFile = path.join(dir, 'users.json');
  const writeAtomic = (file, text) => {
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, file);
  };
  let users = [];
  try {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch {
    users = [];
  }
  const save = () => writeAtomic(usersFile, JSON.stringify(users, null, 2));
  const stateFile = (id) => path.join(stateDir, `${String(id).replace(/[^\w-]/g, '')}.json`);
  const copy = (u) => u && { ...u };

  return {
    kind: 'files',
    async init() {},
    byId: async (id) => copy(users.find((u) => u.id === id)),
    byEmail: async (email) => copy(users.find((u) => u.email === email)),
    byGoogle: async (sub) => copy(users.find((u) => u.googleSub === sub)),
    async insert(u, method) {
      if (users.some((x) => x.id === u.id || x.email === u.email)) return;
      users.push({ ...u, method, created: u.created || Date.now() });
      save();
    },
    async update(id, patch) {
      const u = users.find((x) => x.id === id);
      if (!u) return;
      for (const k of ['name', 'avatar', 'googleSub']) if (patch[k] != null) u[k] = patch[k];
      save();
    },
    async recordLogin(id, method) {
      const u = users.find((x) => x.id === id);
      if (!u) return;
      Object.assign(u, { lastLogin: Date.now(), lastLoginMethod: method, logins: (u.logins || 0) + 1 });
      save();
    },
    async getData(id) {
      try {
        return JSON.parse(fs.readFileSync(stateFile(id), 'utf8'));
      } catch {
        return null;
      }
    },
    async putData(id, state, savedAt) {
      writeAtomic(stateFile(id), JSON.stringify({ state, savedAt }));
    },
  };
}

// Accounts made before the database was connected (data/users.json) are copied into it once,
// then the file is renamed to users.imported.json so it isn't imported again.
async function importFiles(db, dir) {
  const file = path.join(dir, 'users.json');
  if (!fs.existsSync(file)) return;
  const files = fileStore(dir);
  let users = [];
  try {
    users = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return;
  }
  let n = 0;
  for (const u of users.filter((x) => !x.demo)) {
    if (await db.byEmail(u.email)) continue;
    await db.insert(u, u.googleSub && !u.pass ? 'google' : 'email');
    const data = await files.getData(u.id);
    if (data?.state) await db.putData(u.id, data.state, data.savedAt || Date.now());
    n++;
  }
  fs.renameSync(file, path.join(dir, 'users.imported.json'));
  console.log(`[accounts] copied ${n} existing account(s) from ${file} into the database`);
}

export function createStore(env) {
  const dir = path.resolve(env.DATA_DIR || 'data'); // created only by the file store (hosting disks can be read-only)
  const url = String(env.DATABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
  const usable = /^postgres(ql)?:\/\//.test(url) && !/USER:PASSWORD|ep-xxxx/.test(url);
  return usable ? neonStore(url, dir) : fileStore(dir);
}
