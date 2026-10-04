export interface Profile {
  user_id: string;
  role: 'owner' | 'editor';
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: number;
  company_name_ar: string;
  company_name_en: string;
  tagline_ar: string;
  tagline_en: string;
  phone: string;
  whatsapp: string;
  email: string;
  address_ar: string;
  address_en: string;
  working_hours_ar: string;
  working_hours_en: string;
  social_links: Record<string, string>;
  seo_title_ar: string | null;
  seo_title_en: string | null;
  seo_description_ar: string | null;
  seo_description_en: string | null;
  og_image_url: string | null;
  analytics_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentBlock {
  key: string;
  value_ar: string;
  value_en: string;
  type: 'text' | 'markdown' | 'html';
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  icon: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  features_ar: string[];
  features_en: string[];
  price_cents: number | null;
  currency: string;
  is_highlighted: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcessStep {
  id: string;
  step_number: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientCategory {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string;
  description_en: string;
  website_url: string;
  logo: string;
  cover_image: string | null;
  category_id: string | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: ClientCategory | null;
}

export interface Lead {
  id: string;
  name: string;
  business_name: string;
  phone: string;
  email: string | null;
  interests: string[];
  message: string;
  status: 'new' | 'contacted' | 'won' | 'lost';
  notes: string | null;
  locale: 'ar' | 'en';
  source_page: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  storage_path: string;
  public_url: string;
  alt_ar: string;
  alt_en: string;
  width: number | null;
  height: number | null;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}
