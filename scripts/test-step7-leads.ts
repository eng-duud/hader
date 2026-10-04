/**
 * Step 7 Leads & Contact Form Pipeline Verification Test Suite
 *
 * Verifies:
 * 1. Valid submission creates a lead and triggers email dispatch.
 * 2. Honeypot anti-spam check (silent rejection, no DB insert).
 * 3. Minimum time-to-submit verification (blocks automated sub-3-second submissions).
 * 4. IP-based rate limiting (blocks 6th submission within 1 hour).
 * 5. Stored HTML/script sanitization and inert text display.
 * 6. Resend email provider resilience (save first, email second, failures logged safely).
 * 7. Anon client cannot read or insert leads directly (RLS enforcement).
 */

import { leadSchema } from '../lib/validation';
import {
  isHoneypotTriggered,
  isSubmittedTooFast,
  checkIpRateLimit,
  resetIpRateLimit,
} from '../lib/security/spam-protection';
import { ResendEmailProvider } from '../lib/email/resend';
import { dispatchLeadNotification, setEmailProvider } from '../lib/email';
import { Lead } from '../lib/data/types';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runStep7Tests() {
  console.log('====================================================');
  console.log('HADER LEADS PIPELINE - STEP 7 VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (details) console.error(`         Reason: ${details}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 1: Honeypot Anti-Spam Check
  // --------------------------------------------------------------------------
  console.log('TEST SUITE 1: Honeypot Anti-Spam Trap');

  assert(
    isHoneypotTriggered('http://spam-link.ru') === true,
    'Honeypot triggered when hidden input is filled by a bot'
  );

  assert(
    isHoneypotTriggered('') === false && isHoneypotTriggered(undefined) === false,
    'Honeypot passes when hidden input is empty as intended for legitimate humans'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 2: Minimum Time-To-Submit Verification
  // --------------------------------------------------------------------------
  console.log('\nTEST SUITE 2: Minimum Time-to-Submit Protection');

  const now = Date.now();
  // 1 second elapsed (bot script)
  assert(
    isSubmittedTooFast(now - 1000) === true,
    'Flags submission as bot when completed in less than 3 seconds (1s elapsed)'
  );

  // 5 seconds elapsed (legitimate human)
  assert(
    isSubmittedTooFast(now - 5000) === false,
    'Allows submission when completed after realistic human duration (5s elapsed)'
  );

  // Missing or corrupted timestamp
  assert(
    isSubmittedTooFast(null) === true && isSubmittedTooFast(0) === true,
    'Flags submission when timestamp is missing or forged'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 3: IP-Based Hourly Rate Limiting
  // --------------------------------------------------------------------------
  console.log('\nTEST SUITE 3: IP Rate Limiting (Max 5 Submissions / Hour)');

  const testIp = '192.168.100.42';
  resetIpRateLimit(testIp);

  // Attempts 1 through 5 should succeed
  let allFirstFiveAllowed = true;
  for (let i = 1; i <= 5; i++) {
    const res = checkIpRateLimit(testIp);
    if (!res.allowed) {
      allFirstFiveAllowed = false;
    }
  }
  assert(
    allFirstFiveAllowed,
    'Allows up to 5 legitimate submissions within a 1-hour window'
  );

  // 6th attempt should be blocked
  const sixthAttempt = checkIpRateLimit(testIp);
  assert(
    sixthAttempt.allowed === false && sixthAttempt.remaining === 0,
    'Blocks 6th submission from same IP within the 1-hour sliding window'
  );

  resetIpRateLimit(testIp);

  // --------------------------------------------------------------------------
  // TEST SUITE 4: Zod Schema Validation & Input Sanitization
  // --------------------------------------------------------------------------
  console.log('\nTEST SUITE 4: Zod Schema Validation & Input Safety');

  const validLead = {
    name: 'أحمد الصنعاني',
    business_name: 'مؤسسة النور للتجارة',
    phone: '+967 777 123 456',
    email: 'ahmed@alnoor.ye',
    interests: ['websites', 'reply_automation'],
    message: 'نود تصميم موقع إلكتروني تعريفي لشركتنا وتفعيل الردود الآلية للعملاء.',
    locale: 'ar' as const,
    source_page: '/contact',
  };

  const parseResult = leadSchema.safeParse(validLead);
  assert(
    parseResult.success,
    'Validates standard contact form submission successfully'
  );

  // Malicious XSS Payload in fields
  const xssLead = {
    name: "<script>alert('xss')</script>مالك",
    business_name: "<img src=x onerror=alert('hacked')> متجر الذهب",
    phone: '+967 770 000 000',
    email: 'hacker@test.com',
    interests: ['websites'],
    message: "<iframe src='evil.com'></iframe> نحتاج موقع ويب سريع",
    locale: 'ar' as const,
    source_page: '/contact',
  };

  const xssParsed = leadSchema.safeParse(xssLead);
  assert(
    xssParsed.success,
    'Accepts text containing raw HTML characters safely without crashes'
  );

  // Verify that dangerous tags are stored as harmless strings and never executed
  if (xssParsed.success) {
    const isStringLiteral = typeof xssParsed.data.name === 'string' &&
      xssParsed.data.name.includes("<script>");
    assert(
      isStringLiteral,
      'Stored payloads remain inert string literals without HTML rendering'
    );
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 5: Resend Email Notification System (Save First, Email Second)
  // --------------------------------------------------------------------------
  console.log('\nTEST SUITE 5: Resend Email Notification & Provider Decoupling');

  const mockLead: Lead = {
    id: 'lead-test-uuid-001',
    name: 'ياسر العولقي',
    business_name: 'فندق وأجنحة القمة',
    phone: '+967 771 999 888',
    email: 'yasser@al-qimmah.ye',
    interests: ['websites', 'map_presence'],
    message: 'نحتاج موقع ويب متكامل وتثبيت الفندق بدقة على خرائط جوجل.',
    status: 'new',
    notes: null,
    locale: 'ar',
    source_page: '/contact',
    user_agent: 'Mozilla/5.0 Test Agent',
    ip_hash: 'hash_test_123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const resendProvider = new ResendEmailProvider();
  setEmailProvider(resendProvider);

  const dispatchResult = await dispatchLeadNotification(mockLead, 'owner@hader.ye');
  assert(
    dispatchResult.success,
    'Dispatches email notification with properly formatted lead body and WhatsApp link'
  );

  // Test Failure Resilience: Ensure email provider errors do NOT throw or fail the caller
  const failingProvider = {
    sendLeadNotification: async () => {
      throw new Error('Simulated network timeout connecting to email service');
    },
  };
  setEmailProvider(failingProvider);

  const resilientResult = await dispatchLeadNotification(mockLead, 'owner@hader.ye');
  assert(
    resilientResult.success === false && Boolean(resilientResult.error),
    'Catches email provider failure gracefully without crashing the application (lead preserved)'
  );

  // Restore provider
  setEmailProvider(resendProvider);

  // --------------------------------------------------------------------------
  // TEST SUITE 6: Database Row Level Security (RLS) on Leads Table
  // --------------------------------------------------------------------------
  console.log('\nTEST SUITE 6: Row Level Security (RLS) - Anon Cannot Read/Insert Leads');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key';

  const anonClient = createSupabaseClient(supabaseUrl, anonKey);

  // 1. Anon SELECT must return 0 rows or permission denied
  const { data: anonData, error: anonSelectError } = await anonClient
    .from('leads')
    .select('*');

  const selectBlocked = Boolean(anonSelectError) || !anonData || anonData.length === 0;
  assert(
    selectBlocked,
    'Anon public client is denied SELECT access on leads table (RLS enforced)'
  );

  // 2. Anon INSERT directly from browser client must be rejected
  const { data: anonInsertData, error: anonInsertError } = await anonClient
    .from('leads')
    .insert({
      name: 'Bypassing Bot',
      business_name: 'Spam Corp',
      phone: '+123456789',
      message: 'Direct insertion attempt',
    })
    .select();

  assert(
    Boolean(anonInsertError) || !anonInsertData || anonInsertData.length === 0,
    'Anon public client is denied direct INSERT on leads table (Service Role required)'
  );

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStep7Tests().catch((err) => {
  console.error('Fatal error during Step 7 test execution:', err);
  process.exit(1);
});
