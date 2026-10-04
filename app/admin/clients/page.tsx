import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { getAllClients } from '@/lib/data/clients';
import { getClientCategories } from '@/lib/data/categories';
import { ClientsClient } from './ClientsClient';

export default async function AdminClientsPage() {
  await requireAuth();
  const [clients, categories] = await Promise.all([
    getAllClients(),
    getClientCategories(),
  ]);

  return <ClientsClient initialClients={clients} categories={categories} />;
}
