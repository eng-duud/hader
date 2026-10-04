/**
 * Secure HTML / Markdown Sanitizer for Hader CMS.
 * Strips executable scripts, event handlers (onload, onerror, onclick),
 * javascript: URIs, object/embed/iframe tags, and hostile payloads.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  let sanitized = rawHtml;

  // 1. Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Remove iframe, object, embed, applet, form, and base tags
  sanitized = sanitized.replace(/<(\/)?(iframe|object|embed|applet|form|base|meta|link)[^>]*>/gi, '');

  // 3. Remove inline event handlers (on*, e.g., onload, onclick, onerror)
  sanitized = sanitized.replace(/\s+on[a-z]+=(["'][^"']*["']|[^\s>]+)/gi, '');

  // 4. Disallow javascript: and data: in href/src attributes
  sanitized = sanitized.replace(/(href|src)\s*=\s*(["'])\s*(javascript|vbscript|data):/gi, '$1=$2blocked:');

  return sanitized;
}

/**
 * Basic Markdown to Safe HTML parser for rich text fields (Privacy Policy & Terms).
 * Converts headers, bold, italics, lists, and links while guaranteeing safe sanitized output.
 */
export function renderSafeMarkdown(markdown: string): string {
  if (!markdown) return '';

  // First sanitize the raw input to kill any embedded scripts
  const safeText = sanitizeHtml(markdown);

  // Parse standard markdown tokens
  let html = safeText
    // Headers (h1 - h4)
    .replace(/^#### (.*$)/gim, '<h4 class="text-base font-bold text-typography-primary mt-4 mb-2">$1</h4>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-typography-primary mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-typography-primary mt-8 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-typography-primary mt-8 mb-4">$1</h1>')
    // Bold & Italic
    .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Unordered lists
    .replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ms-4 list-disc text-typography-muted">$1</li>')
    // Links (enforce noopener and https)
    .replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-brand-accent hover:underline">$1</a>')
    // Paragraphs (double newlines)
    .replace(/\n\s*\n/gim, '</p><p class="mt-3 text-typography-muted leading-relaxed">');

  // Wrap in paragraph if not starting with header/list
  return `<div class="prose max-w-none text-sm sm:text-base leading-relaxed text-typography-muted"><p class="mt-2 text-typography-muted leading-relaxed">${html}</p></div>`;
}
