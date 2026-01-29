import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { FullPageLoader } from "@/components/shared/loading-spinner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppLayout() {
  const { isAuthenticated, isLoading: authLoading, memberships } = useAuth();
  const { isLoading: orgLoading } = useOrganization();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (authLoading || orgLoading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user has no memberships, redirect to onboarding
  if (memberships.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
