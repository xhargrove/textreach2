import { AppMobileMenu, AppSidebar } from "./app-sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar />
      <AppMobileMenu />
      <main className="lg:pl-64">
        <div className="container-app py-6 pb-24 lg:py-8 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
