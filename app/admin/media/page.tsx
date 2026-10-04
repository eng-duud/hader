import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { getMediaList } from '@/lib/data/media';
import { MediaClient } from './MediaClient';

export default async function AdminMediaPage() {
  await requireAuth();
  const mediaItems = await getMediaList();

  return <MediaClient initialMedia={mediaItems} />;
}
