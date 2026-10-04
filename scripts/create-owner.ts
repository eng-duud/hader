import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim().replace(/^["'](.*)["']$/, '$1');
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const args = process.argv.slice(2);
  let email = '';
  let password = '';
  let fullName = 'Founder / Owner';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1];
      i++;
    } else if (args[i] === '--password' && args[i + 1]) {
      password = args[i + 1];
      i++;
    } else if (args[i] === '--name' && args[i + 1]) {
      fullName = args[i + 1];
      i++;
    }
  }

  if (!email || !password) {
    console.log('Usage: pnpm run create-owner --email <admin-email> --password <secure-password> [--name "Founder"]');
    console.log('Using default owner credentials for initial bootstrap:');
    email = email || 'founder@hader.ye';
    password = password || 'HaderAdmin2026!Secure';
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  }

  console.log(`🔐 Creating initial owner account for: ${email}...`);

  // 1. Check if user already exists in auth.users
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  let userId: string;
  const existingUser = userList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    console.log(`User ${email} already exists with ID: ${existingUser.id}`);
    userId = existingUser.id;
  } else {
    // Create confirmed user bypassing email rate limits
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !newUser.user) {
      throw new Error(`Failed to create user: ${createError?.message}`);
    }

    userId = newUser.user.id;
    console.log(`User created successfully with ID: ${userId}`);
  }

  // 2. Assign 'owner' role in profiles table
  const { error: profileError } = await supabase.from('profiles').upsert({
    user_id: userId,
    role: 'owner',
    full_name: fullName,
  });

  if (profileError) {
    throw new Error(`Failed to assign owner role in profiles: ${profileError.message}`);
  }

  console.log(`👑 Success: ${email} is now registered and verified as an 'owner'!`);
  console.log('You can now log in at /admin with these credentials.');
}

main().catch((err) => {
  console.error('❌ Error creating owner account:', err);
  process.exit(1);
});
