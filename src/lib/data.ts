import { configured, db } from './supabase';
import type { Service, Settings } from './types';
export async function publicData(): Promise<{
  services: Service[];
  settings: Settings | null;
  unavailable: boolean;
}> {
  if (!configured()) return { services: [], settings: null, unavailable: true };
  try {
    const s = await db();
    const [services, settings] = await Promise.all([
      s
        .from('services')
        .select('id,name,description,price_cents,active,sort_order')
        .eq('active', true)
        .order('sort_order'),
      s.from('business_settings').select('*').single(),
    ]);
    if (services.error || settings.error)
      return { services: [], settings: null, unavailable: true };
    return {
      services: services.data as Service[],
      settings: settings.data as Settings,
      unavailable: false,
    };
  } catch {
    return { services: [], settings: null, unavailable: true };
  }
}
