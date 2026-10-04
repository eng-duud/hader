import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { getAllFaqs } from '@/lib/data/faqs';
import { FaqsClient } from './FaqsClient';

export default async function AdminFaqsPage() {
  await requireAuth();
  const faqs = await getAllFaqs();

  return <FaqsClient initialFaqs={faqs} />;
}
