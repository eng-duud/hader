import React from 'react';
import { requireRole } from '@/lib/auth/session';
import { getAllProfiles } from '@/lib/data/profiles';
import { createAdminClient } from '@/lib/supabase/admin';
import { UsersClient } from './UsersClient';

export default async function AdminUsersPage() {
  // 1. Strict Server-Side Guard: Owner only
  const { user } = await requireRole(['owner']);

  // 2. Fetch Profiles from Data Layer
  const profiles = await getAllProfiles();

  // 3. Enrich with Auth Emails via Admin API
  let enrichedProfiles = profiles.map((p) => ({ ...p, email: undefined as string | undefined }));
  try {
    const admin = createAdminClient();
    const { data: authUsers } = await admin.auth.admin.listUsers();
    if (authUsers?.users) {
      const emailMap = new Map(authUsers.users.map((u) => [u.id, u.email]));
      enrichedProfiles = profiles.map((p) => ({
        ...p,
        email: emailMap.get(p.user_id),
      }));
    }
  } catch (e) {
    console.error('Could not fetch auth emails:', e);
  }

  return (
    <UsersClient
      initialProfiles={enrichedProfiles}
      currentUserId={user.id}
    />
  );
}
