import React from 'react';
import { requireRole } from '@/lib/auth/session';
import { getSiteSettings } from '@/lib/data/settings';
import { SettingsClient } from './SettingsClient';

export default async function AdminSettingsPage() {
  // 1. Strict Server-Side Role Guard: Owner only
  await requireRole(['owner']);

  // 2. Fetch current settings from database
  const settings = await getSiteSettings();

  const fallbackSettings = {
    id: 1,
    company_name_ar: 'حاضر لحلول الأعمال الرقمية',
    company_name_en: 'Hader Digital Business Solutions',
    tagline_ar: 'حاضر… ليكون عملك حاضراً حيث يبحث زبائنك',
    tagline_en: 'Hader — be present where your customers look.',
    phone: '+967 770 000 000',
    whatsapp: '+967 770 000 000',
    email: 'contact@hader.ye',
    address_ar: 'صنعاء، الجمهورية اليمنية',
    address_en: 'Sanaa, Republic of Yemen',
    working_hours_ar: 'السبت - الخميس: 9:00 ص - 6:00 م',
    working_hours_en: 'Saturday - Thursday: 9:00 AM - 6:00 PM',
    social_links: {},
    seo_title_ar: null,
    seo_title_en: null,
    seo_description_ar: null,
    seo_description_en: null,
    og_image_url: null,
    analytics_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return <SettingsClient initialSettings={settings || fallbackSettings} />;
}
