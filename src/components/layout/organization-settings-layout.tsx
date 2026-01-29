import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Building2, CreditCard, Palette, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const organizationNavigation = [
  {
    name: "General",
    href: "/settings/organization/general",
    icon: Building2,
    i18nKey: "settings:nav.general",
  },
  {
    name: "Team",
    href: "/settings/organization/team",
    icon: Users,
    i18nKey: "settings:nav.team",
  },
  {
    name: "Billing",
    href: "/settings/organization/billing",
    icon: CreditCard,
    i18nKey: "settings:nav.billing",
  },
  {
    name: "Branding",
    href: "/settings/organization/branding",
    icon: Palette,
    i18nKey: "settings:nav.branding",
  },
];

export function OrganizationSettingsLayout() {
  const { t } = useTranslation(["settings"]);
  const location = useLocation();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("settings:organization.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("settings:organization.description")}
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <nav className="flex flex-col gap-1 md:w-64">
          {organizationNavigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                location.pathname === item.href
                  ? "bg-muted font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{t(item.i18nKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
