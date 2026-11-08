import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/reservar', '/privacidad', '/terminos'].map((p) => ({
    url: `${siteUrl()}${p}`,
    changeFrequency: 'monthly',
    priority: p ? 0.5 : 1,
  }));
}
