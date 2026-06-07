import type { WorkspaceRole } from "@prisma/client";
import { AppSidebar } from "./app-sidebar";
import { ToastProvider } from "@/components/ui/toast";

type AppLayoutProps = {
  children: React.ReactNode;
  role: WorkspaceRole | null;
};

export function AppLayout({ children, role }: AppLayoutProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen overflow-x-hidden bg-gray-50">
        <AppSidebar role={role} />
        <main className="lg:pl-64">
          <div className="container-app py-4 pb-24 sm:py-6 lg:py-8 lg:pb-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
