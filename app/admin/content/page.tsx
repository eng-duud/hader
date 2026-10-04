import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { getContentBlocks } from '@/lib/data/content';
import { ContentClient } from './ContentClient';

export default async function AdminContentPage() {
  await requireAuth();
  const blocks = await getContentBlocks();

  return <ContentClient initialBlocks={blocks} />;
}
