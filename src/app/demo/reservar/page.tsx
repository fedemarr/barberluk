import { DemoExperience } from '@/components/demo/experience';
import { localDay } from '@/lib/format';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Agenda de demostración',
  robots: { index: false, follow: false },
};
export default function Page() {
  const now = new Date();
  return <DemoExperience today={localDay(now)} now={now.toISOString()} />;
}
