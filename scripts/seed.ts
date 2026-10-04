import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Helper to load .env.local if present
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim().replace(/^["'](.*)["']$/, '$1');
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to run seed.');
  console.error('Please configure them in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function runSeed() {
  console.log('🌱 Starting Hader idempotent database seed...');

  // 1. Site Settings
  console.log('1️⃣ Seeding site_settings...');
  const { error: settingsError } = await supabase.from('site_settings').upsert({
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
    social_links: {
      twitter: 'https://x.com/hader_ye',
      linkedin: 'https://linkedin.com/company/hader-ye',
      instagram: 'https://instagram.com/hader_ye',
    },
    seo_title_ar: 'حاضر | مواقع إلكترونية وأتمتة ردود للمنشآت الراقية في اليمن',
    seo_title_en: 'Hader | Web Solutions & Messaging Automation in Yemen',
    seo_description_ar: 'نبني حضورك الرقمي ونردّ على زبائنك فوراً. مواقع احترافية وأتمتة ردود وتثبيت على الخريطة.',
    seo_description_en: 'We build your digital presence and answer your customers instantly. High-performance web development and automation.',
  });

  if (settingsError) throw new Error(`Site settings seed failed: ${settingsError.message}`);

  // 2. Content Blocks
  console.log('2️⃣ Seeding content_blocks...');
  const contentBlocks = [
    {
      key: 'hero.title',
      value_ar: 'نبني حضورك الرقمي… ونردّ على زبائنك فوراً',
      value_en: 'We build your digital presence and answer your customers instantly.',
      type: 'text',
    },
    {
      key: 'hero.subtitle',
      value_ar: 'مواقع احترافية، وردود مؤتمتة على منصات التواصل مع تحويل الشكاوى لفريقك، وتثبيت منشأتك على الخريطة.',
      value_en: 'Professional websites, automated replies on social platforms with complaints routed to your team, and your business pinned on the map.',
      type: 'text',
    },
    {
      key: 'problem.promise',
      value_ar: 'الأسئلة العادية يجيب عنها النظام، وأي شكوى تصل إلى شخص من فريقك مباشرة.',
      value_en: 'Routine questions are answered automatically; any complaint goes straight to a person on your team.',
      type: 'text',
    },
    {
      key: 'cta.banner',
      value_ar: 'جاهز لتأسيس حضور رقمي يليق بعلامتك التجارية؟ تواصل معنا اليوم وسنكون حاضرين لمساعدتك.',
      value_en: 'Ready to establish a premier digital presence worthy of your business? Contact us today.',
      type: 'text',
    },
    {
      key: 'privacy.content',
      value_ar: 'تلتزم شركة حاضر بحماية خصوصية بيانات عملائها وزوار موقعها وفق أرفع المعايير الأمنية.',
      value_en: 'Hader is committed to preserving the privacy and data security of all clients and visitors.',
      type: 'markdown',
    },
    {
      key: 'terms.content',
      value_ar: 'تخضع جميع الخدمات المقدمة من شركة حاضر للعقود الرسمية المعتمدة وفق الأنظمة المعمول بها في الجمهورية اليمنية.',
      value_en: 'All services provided by Hader are governed by formal service contracts in accordance with applicable regulations.',
      type: 'markdown',
    },
  ];

  for (const block of contentBlocks) {
    const { error } = await supabase.from('content_blocks').upsert(block);
    if (error) throw new Error(`Content block '${block.key}' seed failed: ${error.message}`);
  }

  // 3. Services (3 core services)
  console.log('3️⃣ Seeding services...');
  const services = [
    {
      slug: 'websites',
      title_ar: 'تصميم وتطوير المواقع',
      title_en: 'Website Design & Development',
      description_ar: 'مواقع إلكترونية سريعة وراقية تعكس احترافية منشأتك وتبرز خدماتك للباحثين عنك بأحدث المعايير العالمية.',
      description_en: 'High-performance, bespoke websites that reflect the prestige of your enterprise and engage your clientele.',
      icon: 'Globe',
      sort_order: 1,
      is_visible: true,
    },
    {
      slug: 'reply-automation',
      title_ar: 'أتمتة الردود على المنصات',
      title_en: 'Social Reply Automation',
      description_ar: 'ردود ذكية فورية على استفسارات العملاء على وسائل التواصل الاجتماعي مع تحويل مباشر للشكاوى إلى فريقك البشري.',
      description_en: 'Instant automated responses to routine inquiries on social channels with human escalation for customer complaints.',
      icon: 'MessageSquareShare',
      sort_order: 2,
      is_visible: true,
    },
    {
      slug: 'map-presence',
      title_ar: 'التواجد على الخرائط والبحث المحلي',
      title_en: 'Local Search & Map Presence',
      description_ar: 'تثبيت وتوثيق موقع منشأتك بدقة على خرائط جوجل لضمان ظهورك في صدارة نتائج البحث المحلي وسهولة وصول الزبائن إليك.',
      description_en: 'Precise Google Maps verification and local search optimization ensuring prospective customers easily locate and visit your premises.',
      icon: 'MapPin',
      sort_order: 3,
      is_visible: true,
    },
  ];

  for (const svc of services) {
    const { error } = await supabase.from('services').upsert(svc, { onConflict: 'slug' });
    if (error) throw new Error(`Service '${svc.slug}' seed failed: ${error.message}`);
  }

  // 4. FAQs (5 FAQs)
  console.log('4️⃣ Seeding faqs...');
  const faqs = [
    {
      question_ar: 'كم يستغرق بناء الموقع الإلكتروني لمنشأتي؟',
      question_en: 'How long does it take to develop our company website?',
      answer_ar: 'يستغرق العمل عادة ما بين 7 إلى 14 يوم عمل، بحسب نطاق المحتوى والمتطلبات الخاصة بالتصميم.',
      answer_en: 'Typical delivery ranges between 7 to 14 business days, depending on scope and specific design requirements.',
      sort_order: 1,
      is_visible: true,
    },
    {
      question_ar: 'هل تعمل أتمتة الردود على إنستغرام وواتساب؟',
      question_en: 'Does your automated reply system work on Instagram and WhatsApp?',
      answer_ar: 'نعم، نوفر أتمتة منظمة تجيب عن الأسئلة المعتادة، مع ميزة التحويل الفوري لأي شكوى أو طلب خاص إلى مسؤول محدد في فريقك.',
      answer_en: 'Yes, we provide structured reply systems for common inquiries, featuring immediate escalation of critical requests to designated staff.',
      sort_order: 2,
      is_visible: true,
    },
    {
      question_ar: 'كيف تضمنون سرعة تحميل الموقع على شبكات الإنترنت في اليمن؟',
      question_en: 'How do you ensure fast load speeds over Yemeni mobile networks?',
      answer_ar: 'نعتمد تقنيات Next.js الحديثة وخطوطاً مستضافة ذاتياً مع ضغط فائق للصور والأصول دون أي طلبات خارجية تبطئ التصفح.',
      answer_en: 'We utilize modern Next.js static optimizations, self-hosted fonts, and AVIF/WebP image compression with zero runtime third-party requests.',
      sort_order: 3,
      is_visible: true,
    },
    {
      question_ar: 'هل يمكنني تعديل نصوص وصور الموقع بنفسي لاحقاً؟',
      question_en: 'Can we update content and images ourselves after launch?',
      answer_ar: 'نعم، يتضمن الموقع لوحة إدارة عربية متكاملة وسلسة تتيح لك تحديث جميع النصوص والصور والأسعار وإضافة أعمال جديدة دون الحاجة لكتابة كود.',
      answer_en: 'Yes, every site comes with an intuitive, bilingual admin panel allowing full control over text, images, clients, and settings without touching code.',
      sort_order: 4,
      is_visible: true,
    },
    {
      question_ar: 'هل تدعمون التحقق من الأعمال على منصات ميتا (Meta Verification)؟',
      question_en: 'Do your websites support Meta Business Verification?',
      answer_ar: 'نعم، نصمم الموقع ليلبي تماماً جميع اشتراطات التحقق الرسمي لدى ميتا (الاسم القانوني، البريد المخصص على النطاق، سياسة الخصوصية والشروط).',
      answer_en: 'Yes, all sites are structured to meet Meta Business Verification standards, including domain-matched emails and verified legal policies.',
      sort_order: 5,
      is_visible: true,
    },
  ];

  for (const faq of faqs) {
    // Upsert using question_ar as unique identifier logic or match existing
    const { error } = await supabase.from('faqs').upsert(faq, { onConflict: 'question_ar' });
    if (error) {
      // Fallback insert if no unique constraint on question_ar
      const { data: existing } = await supabase.from('faqs').select('id').eq('question_ar', faq.question_ar).maybeSingle();
      if (existing) {
        await supabase.from('faqs').update(faq).eq('id', existing.id);
      } else {
        await supabase.from('faqs').insert(faq);
      }
    }
  }

  // 5. Process Steps (4 steps)
  console.log('5️⃣ Seeding process_steps...');
  const steps = [
    {
      step_number: 1,
      title_ar: '1. الاستكشاف والتخطيط',
      title_en: '1. Discovery & Scope',
      description_ar: 'جلسة عمل لفهم هوية منشأتك وتحديد الأهداف الرقمية والجمهور المستهدف ونطاق المشروع.',
      description_en: 'In-depth consultation to analyze your brand positioning, target audience, and digital objectives.',
      sort_order: 1,
      is_visible: true,
    },
    {
      step_number: 2,
      title_ar: '2. التصميم والتطوير',
      title_en: '2. Bespoke Build',
      description_ar: 'بناء واجهة حصرية سريعة تدعم العربية والإنجليزية بالكامل مع تجربة مستخدم مثالية على الهواتف.',
      description_en: 'Engineering a fast, bilingual web platform with impeccable mobile-first aesthetics and layout.',
      sort_order: 2,
      is_visible: true,
    },
    {
      step_number: 3,
      title_ar: '3. الإطلاق والتحقق',
      title_en: '3. Launch & Verification',
      description_ar: 'فحص الأداء والتوافق وربط النطاق وتثبيت منشأتك على الخرائط وتجهيز ملفات التحقق الرسمي.',
      description_en: 'Comprehensive testing, domain linking, Google Maps local pinning, and verification audit.',
      sort_order: 3,
      is_visible: true,
    },
    {
      step_number: 4,
      title_ar: '4. الدعم والتمكين',
      title_en: '4. Ongoing Support',
      description_ar: 'تسليم لوحة التحكم وتدريب فريقك على إدارة المحتوى ومتابعة أداء الموقع بشكل دوري.',
      description_en: 'Admin panel handover, staff training, and ongoing technical support to guarantee maximum reliability.',
      sort_order: 4,
      is_visible: true,
    },
  ];

  for (const step of steps) {
    const { data: existing } = await supabase.from('process_steps').select('id').eq('step_number', step.step_number).maybeSingle();
    if (existing) {
      await supabase.from('process_steps').update(step).eq('id', existing.id);
    } else {
      await supabase.from('process_steps').insert(step);
    }
  }

  // 6. Packages (3 sample packages, no prices)
  console.log('6️⃣ Seeding packages...');
  const packages = [
    {
      slug: 'starter-presence',
      name_ar: 'باقة الحضور الأساسي',
      name_en: 'Essential Presence',
      description_ar: 'واجهة رقمية متكاملة للمنشآت الناشئة والعيادات الباحثة عن واجهة موثوقة وبداية قوية.',
      description_en: 'A premier single-page or lean web front for emerging enterprises and clinics.',
      features_ar: ['موقع تعريفي متكامل سريع', 'تصميم متجاوب بالكامل مع الهواتف', 'تثبيت الموقع على خرائط جوجل', 'لوحة تحكم لإدارة المحتوى'],
      features_en: ['Fast bespoke web presence', 'Fully responsive mobile-first UI', 'Google Maps local pinning', 'Dedicated content admin panel'],
      price_cents: null, // Contact us
      is_highlighted: false,
      is_visible: true,
      sort_order: 1,
    },
    {
      slug: 'business-growth',
      name_ar: 'باقة الأعمال المتكاملة',
      name_en: 'Business Growth',
      description_ar: 'الحل الأمثل للمطاعم الراقية ومراكز التجزئة التي تحتاج موقعاً متقدماً وأتمتة للردود.',
      description_en: 'Comprehensive web architecture with automated social replies and multi-channel triage.',
      features_ar: ['موقع متكامل متعدد الأقسام', 'أتمتة ذكية للردود على وسائل التواصل', 'تحويل تلقائي لشكاوى الزبائن للمسؤول', 'توثيق واشتراطات ميتا للأعمال', 'دعم فني مستمر'],
      features_en: ['Multi-section web platform', 'Social messaging reply automation', 'Instant complaint escalation to staff', 'Meta business verification readiness', 'Dedicated technical support'],
      price_cents: null, // Contact us
      is_highlighted: true,
      is_visible: true,
      sort_order: 2,
    },
    {
      slug: 'enterprise-custom',
      name_ar: 'باقة المنشآت الكبرى',
      name_en: 'Enterprise Custom',
      description_ar: 'حلول مخصصة لسلاسل المطاعم والمراكز الطبية والمجمعات التجارية ذات المتطلبات الخاصة.',
      description_en: 'Tailored digital solutions for multi-branch chains, malls, and specialized institutions.',
      features_ar: ['هندسة برمجية مخصصة بالكامل', 'أتمتة متقدمة وتكامل عبر API', 'إدارة صلاحيات متعددة المستخدمين', 'اتفاقية مستوى الخدمة (SLA)', 'استشارات رقمية دورية'],
      features_en: ['Fully customized software architecture', 'Advanced API integrations & workflows', 'Multi-user role access controls', 'Service Level Agreement (SLA)', 'Regular strategic advisory'],
      price_cents: null, // Contact us
      is_highlighted: false,
      is_visible: true,
      sort_order: 3,
    },
  ];

  for (const pkg of packages) {
    const { error } = await supabase.from('packages').upsert(pkg, { onConflict: 'slug' });
    if (error) throw new Error(`Package '${pkg.slug}' seed failed: ${error.message}`);
  }

  // 7. Client Categories (5 categories)
  console.log('7️⃣ Seeding client_categories...');
  const categories = [
    { slug: 'restaurants', name_ar: 'المطاعم والضيافة', name_en: 'Restaurants & Hospitality', sort_order: 1 },
    { slug: 'clinics', name_ar: 'العيادات والمراكز الطبية', name_en: 'Clinics & Medical', sort_order: 2 },
    { slug: 'retail', name_ar: 'المتاجر والبيع بالتجزئة', name_en: 'Retail & Commercial', sort_order: 3 },
    { slug: 'services', name_ar: 'الخدمات المهنية', name_en: 'Professional Services', sort_order: 4 },
    { slug: 'other', name_ar: 'قطاعات أخرى', name_en: 'Other Sectors', sort_order: 5 },
  ];

  for (const cat of categories) {
    const { error } = await supabase.from('client_categories').upsert(cat, { onConflict: 'slug' });
    if (error) throw new Error(`Category '${cat.slug}' seed failed: ${error.message}`);
  }

  // 8. Clients (NO FAKE CLIENTS. Only 2 explicitly labeled UNPUBLISHED demo clients)
  console.log('8️⃣ Seeding demo clients (unpublished & explicitly labeled)...');
  const { data: catRestaurants } = await supabase.from('client_categories').select('id').eq('slug', 'restaurants').single();
  const { data: catClinics } = await supabase.from('client_categories').select('id').eq('slug', 'clinics').single();

  const demoClients = [
    {
      slug: 'demo-restaurant-unpublished',
      name_ar: '[نموذج تجريبي غير منشور] مطعم السعيد',
      name_en: '[Demo Client - Unpublished] Al-Saeed Restaurant',
      description_ar: 'مشروع تجريبي استرشادي للوحة الإدارة لا يظهر في الموقع العام.',
      description_en: 'Unpublished demonstration entry for testing admin panel functionality.',
      website_url: 'https://example.com/demo-restaurant',
      logo: '/brand/wordmark.svg',
      category_id: catRestaurants?.id || null,
      is_featured: false,
      is_published: false, // MANDATORY: Unpublished
      sort_order: 1,
    },
    {
      slug: 'demo-clinic-unpublished',
      name_ar: '[نموذج تجريبي غير منشور] مركز الشفاء التخصصي',
      name_en: '[Demo Client - Unpublished] Al-Shifa Specialist Clinic',
      description_ar: 'مشروع تجريبي استرشادي للوحة الإدارة لا يظهر في الموقع العام.',
      description_en: 'Unpublished demonstration entry for testing admin panel functionality.',
      website_url: 'https://example.com/demo-clinic',
      logo: '/brand/wordmark.svg',
      category_id: catClinics?.id || null,
      is_featured: false,
      is_published: false, // MANDATORY: Unpublished
      sort_order: 2,
    },
  ];

  for (const client of demoClients) {
    const { error } = await supabase.from('clients').upsert(client, { onConflict: 'slug' });
    if (error) throw new Error(`Demo client '${client.slug}' seed failed: ${error.message}`);
  }

  console.log('✅ Hader database seed completed successfully and is 100% idempotent!');
}

// Auto-run if executed as script
if (require.main === module || process.argv[1]?.endsWith('seed.ts')) {
  runSeed().catch((err) => {
    console.error('❌ Seed execution failed:', err);
    process.exit(1);
  });
}
