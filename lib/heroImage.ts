// Shared hero / customer image normalizer.
//
// Staff paste all kinds of image links into the "Hero Image URL" field — direct
// image URLs, Imgur share pages (imgur.com/ID), bare i.imgur.com IDs, and the
// occasional album/gallery link. This module turns any usable link into a direct,
// embeddable image URL and rejects everything else so a bad paste falls back to a
// default (or hides the image) instead of rendering a broken hero.

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
const IMGUR_HOSTS = new Set(['imgur.com', 'www.imgur.com', 'm.imgur.com', 'i.imgur.com']);

// Single-segment Imgur paths that are pages, not image IDs.
const IMGUR_RESERVED = new Set([
  'a', 'gallery', 't', 'user', 'r', 'tag', 'search', 'upload', 'new', 'about', 'signin', 'register',
]);

/**
 * Resolve a user-supplied link to a direct, embeddable image URL.
 * Returns '' when the link is blank or not usable as a single image — callers
 * decide whether to substitute a default (renderHeroImageUrl) or hide the image.
 */
export function resolveHeroImageUrl(url: string | null | undefined): string {
  const trimmed = (url ?? '').trim();
  if (!trimmed) return '';

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return '';
  }
  if (parsed.protocol !== 'https:') return '';

  const host = parsed.hostname.toLowerCase();
  const segments = parsed.pathname.split('/').filter(Boolean);

  if (IMGUR_HOSTS.has(host)) {
    // Albums (/a/ID), galleries (/gallery/ID), and user pages have 2+ segments — not a single image.
    if (segments.length !== 1) return '';
    const seg = segments[0];
    const id = seg.replace(IMAGE_EXT, '');
    if (!id || IMGUR_RESERVED.has(id.toLowerCase())) return '';
    const extMatch = seg.match(IMAGE_EXT);
    // Preserve an explicit extension (.png/.webp/.gif keep their type); default to .jpeg.
    const ext = extMatch ? extMatch[0].toLowerCase() : '.jpeg';
    return `https://i.imgur.com/${id}${ext}`;
  }

  // Any other host: only trust it when the path actually points at an image file.
  if (IMAGE_EXT.test(parsed.pathname)) return trimmed;
  return '';
}

/**
 * Resolve a hero link, substituting `fallback` when blank or unusable.
 * Use in renderers that always need a hero (web pages, elite Gmail templates).
 */
export function normalizeHeroImageUrl(url: string | null | undefined, fallback: string): string {
  return resolveHeroImageUrl(url) || fallback;
}

/** Validation helper. Blank is allowed (renderers fall back to a default). */
export function isUsableHeroImageUrl(url: string): boolean {
  return !url.trim() || resolveHeroImageUrl(url) !== '';
}
