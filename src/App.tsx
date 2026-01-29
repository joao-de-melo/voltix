import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { OrganizationProvider } from "@/contexts/organization-context";
import { AppLayout } from "@/components/layout/app-layout";
import { ProfileSettingsLayout } from "@/components/layout/profile-settings-layout";
import { OrganizationSettingsLayout } from "@/components/layout/organization-settings-layout";
import {
  LoginPage,
  RegisterPage,
  OnboardingPage,
  DashboardPage,
  CustomersPage,
  CustomerNewPage,
  CustomerEditPage,
  ProductsPage,
  ProductNewPage,
  ProductEditPage,
  ProductImportPage,
  QuotesPage,
  QuoteNewPage,
  QuoteViewPage,
  QuoteEditPage,
  QuickQuotePage,
} from "@/pages";
import { ProfileSettingsIndexPage } from "@/pages/settings/profile";
import { AccountSettingsPage } from "@/pages/settings/profile/account";
import { PreferencesSettingsPage } from "@/pages/settings/profile/preferences";
import { OrganizationSettingsIndexPage } from "@/pages/settings/organization";
import { GeneralSettingsPage } from "@/pages/settings/organization/general";
import { BillingSettingsPage } from "@/pages/settings/organization/billing";
import { BrandingSettingsPage } from "@/pages/settings/organization/branding";
import { TeamSettingsPage } from "@/pages/settings/organization/team";
import { InviteAcceptPage } from "@/pages/invite-accept";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Semi-public routes (require auth but not org membership) */}
              <Route path="/invite/:token" element={<InviteAcceptPage />} />

              {/* Protected routes */}
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Customers */}
                <Route path="customers" element={<CustomersPage />} />
                <Route path="customers/new" element={<CustomerNewPage />} />
                <Route path="customers/:id/edit" element={<CustomerEditPage />} />

                {/* Products */}
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/new" element={<ProductNewPage />} />
                <Route path="products/import" element={<ProductImportPage />} />
                <Route path="products/:id/edit" element={<ProductEditPage />} />

                {/* Quotes */}
                <Route path="quotes" element={<QuotesPage />} />
                <Route path="quotes/new" element={<QuoteNewPage />} />
                <Route path="quotes/quick" element={<QuickQuotePage />} />
                <Route path="quotes/:id" element={<QuoteViewPage />} />
                <Route path="quotes/:id/edit" element={<QuoteEditPage />} />

                {/* Profile Settings */}
                <Route path="settings/profile" element={<ProfileSettingsLayout />}>
                  <Route index element={<ProfileSettingsIndexPage />} />
                  <Route path="account" element={<AccountSettingsPage />} />
                  <Route path="preferences" element={<PreferencesSettingsPage />} />
                </Route>

                {/* Organization Settings */}
                <Route path="settings/organization" element={<OrganizationSettingsLayout />}>
                  <Route index element={<OrganizationSettingsIndexPage />} />
                  <Route path="general" element={<GeneralSettingsPage />} />
                  <Route path="billing" element={<BillingSettingsPage />} />
                  <Route path="branding" element={<BrandingSettingsPage />} />
                  <Route path="team" element={<TeamSettingsPage />} />
                </Route>

                {/* Settings index redirect */}
                <Route path="settings" element={<Navigate to="/settings/profile/account" replace />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
