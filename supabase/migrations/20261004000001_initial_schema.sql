-- ==============================================================================
-- Hader (حاضر) — Initial Database Schema & Row Level Security (RLS)
-- Migration: 20261004000001_initial_schema.sql
-- ==============================================================================

-- 1. Helper: updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Profiles Table (user roles: owner, editor)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'editor')) DEFAULT 'editor',
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Security definer function to resolve role without recursion in RLS
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- 3. Site Settings Table (Single-row pattern for company info, contact & SEO)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name_ar text NOT NULL DEFAULT 'حاضر لحلول الأعمال الرقمية',
  company_name_en text NOT NULL DEFAULT 'Hader Digital Business Solutions',
  tagline_ar text NOT NULL DEFAULT 'حاضر… ليكون عملك حاضراً حيث يبحث زبائنك',
  tagline_en text NOT NULL DEFAULT 'Hader — be present where your customers look.',
  phone text NOT NULL DEFAULT '+967 770 000 000',
  whatsapp text NOT NULL DEFAULT '+967 770 000 000',
  email text NOT NULL DEFAULT 'contact@hader.ye',
  address_ar text NOT NULL DEFAULT 'صنعاء، الجمهورية اليمنية',
  address_en text NOT NULL DEFAULT 'Sanaa, Republic of Yemen',
  working_hours_ar text NOT NULL DEFAULT 'السبت - الخميس: 9:00 ص - 6:00 م',
  working_hours_en text NOT NULL DEFAULT 'Saturday - Thursday: 9:00 AM - 6:00 PM',
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_title_ar text,
  seo_title_en text,
  seo_description_ar text,
  seo_description_en text,
  og_image_url text,
  analytics_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Content Blocks (hero, problem, promise, CTA, privacy, terms)
CREATE TABLE IF NOT EXISTS public.content_blocks (
  key text PRIMARY KEY,
  value_ar text NOT NULL DEFAULT '',
  value_en text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'markdown', 'html')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_content_blocks_updated_at
  BEFORE UPDATE ON public.content_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Services Table (Websites, Reply Automation, Map Presence)
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  icon text NOT NULL DEFAULT 'Globe',
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_sort ON public.services(sort_order, is_visible);

CREATE TRIGGER trigger_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Packages Table (Packages with optional prices)
CREATE TABLE IF NOT EXISTS public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  features_ar text[] NOT NULL DEFAULT '{}',
  features_en text[] NOT NULL DEFAULT '{}',
  price_cents int,
  currency text NOT NULL DEFAULT 'YER',
  is_highlighted boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_packages_sort ON public.packages(sort_order, is_visible);

CREATE TRIGGER trigger_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. FAQ Table
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_ar text NOT NULL,
  question_en text NOT NULL,
  answer_ar text NOT NULL,
  answer_en text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faqs_sort ON public.faqs(sort_order, is_visible);

CREATE TRIGGER trigger_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Process Steps Table (Discovery, Build, Launch, Support)
CREATE TABLE IF NOT EXISTS public.process_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number int NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_process_steps_sort ON public.process_steps(sort_order, is_visible);

CREATE TRIGGER trigger_process_steps_updated_at
  BEFORE UPDATE ON public.process_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Client Categories Table
CREATE TABLE IF NOT EXISTS public.client_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_categories_sort ON public.client_categories(sort_order);

CREATE TRIGGER trigger_client_categories_updated_at
  BEFORE UPDATE ON public.client_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. Clients Table (Portfolio showcase)
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL UNIQUE,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  website_url text NOT NULL CHECK (website_url ~* '^https://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$'),
  logo text NOT NULL,
  cover_image text,
  category_id uuid REFERENCES public.client_categories(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_published_sort ON public.clients(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_clients_featured ON public.clients(is_featured) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_clients_category ON public.clients(category_id);

CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 11. Leads Table (Contact form submissions)
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business_name text NOT NULL,
  phone text NOT NULL,
  email text,
  interests text[] NOT NULL DEFAULT '{}',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'won', 'lost')),
  notes text,
  locale text NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar', 'en')),
  source_page text DEFAULT '/',
  user_agent text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status_created ON public.leads(status, created_at DESC);

CREATE TRIGGER trigger_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 12. Media Table (Upload catalog)
CREATE TABLE IF NOT EXISTS public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL UNIQUE,
  public_url text NOT NULL,
  alt_ar text NOT NULL DEFAULT '',
  alt_en text NOT NULL DEFAULT '',
  width int,
  height int,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Profiles Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can read own profile or owner can read all"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.current_user_role() = 'owner'
  );

CREATE POLICY "Owner can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.current_user_role() = 'owner');

CREATE POLICY "Owner can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.current_user_role() = 'owner');

CREATE POLICY "Owner can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.current_user_role() = 'owner');

-- ------------------------------------------------------------------------------
-- Site Settings Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Public read access for site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Owner can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.current_user_role() = 'owner');

CREATE POLICY "Owner can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.current_user_role() = 'owner');

-- ------------------------------------------------------------------------------
-- Content Blocks Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Public read access for content blocks"
  ON public.content_blocks FOR SELECT
  USING (true);

CREATE POLICY "Owner and editor can insert content blocks"
  ON public.content_blocks FOR INSERT
  WITH CHECK (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can update content blocks"
  ON public.content_blocks FOR UPDATE
  USING (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can delete content blocks"
  ON public.content_blocks FOR DELETE
  USING (public.current_user_role() IN ('owner', 'editor'));

-- ------------------------------------------------------------------------------
-- Services Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can read visible services; auth staff can read all"
  ON public.services FOR SELECT
  USING (
    is_visible = true
    OR public.current_user_role() IN ('owner', 'editor')
  );

CREATE POLICY "Owner and editor can insert services"
  ON public.services FOR INSERT
  WITH CHECK (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can update services"
  ON public.services FOR UPDATE
  USING (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can delete services"
  ON public.services FOR DELETE
  USING (public.current_user_role() IN ('owner', 'editor'));

-- ------------------------------------------------------------------------------
-- Packages Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can read visible packages; auth staff can read all"
  ON public.packages FOR SELECT
  USING (
    is_visible = true
    OR public.current_user_role() IN ('owner', 'editor')
  );

CREATE POLICY "Owner and editor can insert packages"
  ON public.packages FOR INSERT
  WITH CHECK (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can update packages"
  ON public.packages FOR UPDATE
  USING (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can delete packages"
  ON public.packages FOR DELETE
  USING (public.current_user_role() IN ('owner', 'editor'));

-- ------------------------------------------------------------------------------
-- FAQs Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can read visible faqs; auth staff can read all"
  ON public.faqs FOR SELECT
  USING (
    is_visible = true
    OR public.current_user_role() IN ('owner', 'editor')
  );

CREATE POLICY "Owner and editor can insert faqs"
  ON public.faqs FOR INSERT
  WITH CHECK (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can update faqs"
  ON public.faqs FOR UPDATE
  USING (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can delete faqs"
  ON public.faqs FOR DELETE
  USING (public.current_user_role() IN ('owner', 'editor'));

-- ------------------------------------------------------------------------------
-- Process Steps Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can read visible process steps; auth staff can read all"
  ON public.process_steps FOR SELECT
  USING (
    is_visible = true
    OR public.current_user_role() IN ('owner', 'editor')
  );

CREATE POLICY "Owner and editor can insert process steps"
  ON public.process_steps FOR INSERT
  WITH CHECK (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can update process steps"
  ON public.process_steps FOR UPDATE
  USING (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can delete process steps"
  ON public.process_steps FOR DELETE
  USING (public.current_user_role() IN ('owner', 'editor'));

-- ------------------------------------------------------------------------------
-- Client Categories Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can read client categories"
  ON public.client_categories FOR SELECT
  USING (true);

CREATE POLICY "Owner and editor can insert client categories"
  ON public.client_categories FOR INSERT
  WITH CHECK (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can update client categories"
  ON public.client_categories FOR UPDATE
  USING (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can delete client categories"
  ON public.client_categories FOR DELETE
  USING (public.current_user_role() IN ('owner', 'editor'));

-- ------------------------------------------------------------------------------
-- Clients Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can read published clients; auth staff can read all"
  ON public.clients FOR SELECT
  USING (
    is_published = true
    OR public.current_user_role() IN ('owner', 'editor')
  );

CREATE POLICY "Owner and editor can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can update clients"
  ON public.clients FOR UPDATE
  USING (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can delete clients"
  ON public.clients FOR DELETE
  USING (public.current_user_role() IN ('owner', 'editor'));

-- ------------------------------------------------------------------------------
-- Leads Policies
-- Note: NO anon INSERT or SELECT. Leads are inserted exclusively server-side
-- via the service-role client in route handlers.
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated staff can read leads"
  ON public.leads FOR SELECT
  USING (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Authenticated staff can update leads"
  ON public.leads FOR UPDATE
  USING (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner can delete leads"
  ON public.leads FOR DELETE
  USING (public.current_user_role() = 'owner');

-- ------------------------------------------------------------------------------
-- Media Catalog Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can read media metadata"
  ON public.media FOR SELECT
  USING (true);

CREATE POLICY "Owner and editor can insert media"
  ON public.media FOR INSERT
  WITH CHECK (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can update media"
  ON public.media FOR UPDATE
  USING (public.current_user_role() IN ('owner', 'editor'));

CREATE POLICY "Owner and editor can delete media"
  ON public.media FOR DELETE
  USING (public.current_user_role() IN ('owner', 'editor'));

-- ==============================================================================
-- SUPABASE STORAGE CONFIGURATION
-- ==============================================================================

-- Create public 'media' bucket with 5MB upload limit and image MIME restrictions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- Storage Objects RLS Policies
CREATE POLICY "Public media read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Staff can upload media files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
    AND public.current_user_role() IN ('owner', 'editor')
  );

CREATE POLICY "Staff can update media files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
    AND public.current_user_role() IN ('owner', 'editor')
  );

CREATE POLICY "Staff can delete media files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
    AND public.current_user_role() IN ('owner', 'editor')
  );
