import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { getAllPackages } from '@/lib/data/packages';
import { PackagesClient } from './PackagesClient';

export default async function AdminPackagesPage() {
  await requireAuth();
  const packages = await getAllPackages();

  return <PackagesClient initialPackages={packages} />;
}
