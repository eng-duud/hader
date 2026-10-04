import { MetadataRoute } from 'next';
import { getPublicClients } from '@/lib/data/clients';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hader.ye';
  const now = new Date();

  const staticPages = [
    '',
    '/clients',
    '/contact',
    '/privacy',
    '/terms',
  ];

  const routes: MetadataRoute.Sitemap = [];

  // Localized static routes
  for (const page of staticPages) {
    const arUrl = `${baseUrl}/ar${page}`;
    const enUrl = `${baseUrl}/en${page}`;

    routes.push({
      url: arUrl,
      lastModified: now,
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1.0 : 0.8,
      alternates: {
        languages: {
          ar: arUrl,
          en: enUrl,
        },
      },
    });

    routes.push({
      url: enUrl,
      lastModified: now,
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1.0 : 0.8,
      alternates: {
        languages: {
          ar: arUrl,
          en: enUrl,
        },
      },
    });
  }

  // Published clients
  try {
    const clients = await getPublicClients();
    for (const client of clients) {
      const arClientUrl = `${baseUrl}/ar/clients/${client.slug}`;
      const enClientUrl = `${baseUrl}/en/clients/${client.slug}`;
      const lastMod = new Date(client.updated_at || now);

      routes.push({
        url: arClientUrl,
        lastModified: lastMod,
        changeFrequency: 'monthly',
        priority: client.is_featured ? 0.9 : 0.7,
        alternates: {
          languages: {
            ar: arClientUrl,
            en: enClientUrl,
          },
        },
      });

      routes.push({
        url: enClientUrl,
        lastModified: lastMod,
        changeFrequency: 'monthly',
        priority: client.is_featured ? 0.9 : 0.7,
        alternates: {
          languages: {
            ar: arClientUrl,
            en: enClientUrl,
          },
        },
      });
    }
  } catch (err) {
    console.error('Error fetching clients for sitemap:', err);
  }

  return routes;
}
