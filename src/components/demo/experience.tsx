import { DemoProvider } from './provider';
import { DemoBooking } from './booking';
import { DemoAdmin } from './admin';
import type { DemoSection } from '@/lib/demo-model';
export function DemoExperience({
  today,
  now,
  section,
  day,
}: {
  today: string;
  now: string;
  section?: DemoSection;
  day?: string;
}) {
  return (
    <DemoProvider today={today} now={now}>
      {section ? <DemoAdmin section={section} initialDay={day} /> : <DemoBooking />}
    </DemoProvider>
  );
}
