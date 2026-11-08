import { renderDemoAdmin, type DemoPageProps } from '@/components/demo/admin-page';
export default function Page({ searchParams }: DemoPageProps) {
  return renderDemoAdmin('finanzas', searchParams);
}
