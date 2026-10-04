import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { getAllServices } from '@/lib/data/services';
import { ServicesClient } from './ServicesClient';

export default async function AdminServicesPage() {
  await requireAuth();
  const services = await getAllServices();

  return <ServicesClient initialServices={services} />;
}
