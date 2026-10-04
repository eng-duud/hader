import { revalidatePath } from 'next/cache';

/**
 * On-demand revalidation helper.
 * Triggers Next.js on-demand ISR revalidation across all public bilingual routes
 * immediately after any admin mutation, ensuring public visitors see updates in seconds.
 */
export function revalidatePublicPaths(extraPath?: string): void {
  try {
    // Revalidate Root and Layouts
    revalidatePath('/[locale]', 'layout');
    revalidatePath('/ar', 'page');
    revalidatePath('/en', 'page');
    revalidatePath('/ar/clients', 'page');
    revalidatePath('/en/clients', 'page');
    revalidatePath('/ar/contact', 'page');
    revalidatePath('/en/contact', 'page');
    revalidatePath('/ar/privacy', 'page');
    revalidatePath('/en/privacy', 'page');
    revalidatePath('/ar/terms', 'page');
    revalidatePath('/en/terms', 'page');
    revalidatePath('/sitemap.xml');

    if (extraPath) {
      revalidatePath(extraPath);
    }
  } catch (err) {
    console.error('Revalidation error:', err);
  }
}
