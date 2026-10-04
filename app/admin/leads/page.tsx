import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { getLeads } from '@/lib/data/leads';
import { LeadsClient } from './LeadsClient';

export default async function AdminLeadsPage() {
  const session = await requireAuth();
  const leads = await getLeads();

  return <LeadsClient initialLeads={leads} userRole={session.profile.role} />;
}
