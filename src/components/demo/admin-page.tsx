import 'server-only';
import { z } from 'zod';
import { DemoExperience } from './experience';
import type { DemoSection } from '@/lib/demo-model';
import { localDay } from '@/lib/format';
export type DemoPageProps = { searchParams: Promise<{ day?: string }> };
export async function renderDemoAdmin(
  section: DemoSection,
  searchParams: DemoPageProps['searchParams'],
) {
  const query = await searchParams;
  const date = z.iso.date().safeParse(query.day);
  const now = new Date();
  return (
    <DemoExperience
      section={section}
      day={date.success ? date.data : undefined}
      today={localDay(now)}
      now={now.toISOString()}
    />
  );
}
