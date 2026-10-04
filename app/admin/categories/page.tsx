import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { getClientCategories } from '@/lib/data/categories';
import { CategoriesClient } from './CategoriesClient';

export default async function AdminCategoriesPage() {
  await requireAuth();
  const categories = await getClientCategories();

  return <CategoriesClient initialCategories={categories} />;
}
