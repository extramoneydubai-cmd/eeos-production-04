import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { Header } from "./Header";
import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
}

export function DashboardLayout({
  children,
  breadcrumb,
  actions,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="min-h-screen">
        <Header breadcrumb={breadcrumb} actions={actions} />
        <main className="flex-1 overflow-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
