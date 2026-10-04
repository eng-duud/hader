import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { getAllProcessSteps } from '@/lib/data/process';
import { ProcessClient } from './ProcessClient';

export default async function AdminProcessPage() {
  await requireAuth();
  const steps = await getAllProcessSteps();

  return <ProcessClient initialSteps={steps} />;
}
