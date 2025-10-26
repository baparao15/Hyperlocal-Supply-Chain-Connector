import { DashboardHeader } from '@/components/dashboard/header';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex">
      <SidebarNav />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-8 bg-secondary/50">{children}</main>
      </div>
    </div>
  );
}
