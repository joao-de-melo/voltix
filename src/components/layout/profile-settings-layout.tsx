import { NavLink, Outlet, useLocation } from "react-router-dom";
import { User, Sliders } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const profileNavigation = [
  {
    name: "Account",
    href: "/settings/profile/account",
    icon: User,
    i18nKey: "settings:nav.account",
  },
  {
    name: "Preferences",
    href: "/settings/profile/preferences",
    icon: Sliders,
    i18nKey: "settings:nav.preferences",
  },
];

export function ProfileSettingsLayout() {
  const { t } = useTranslation(["settings"]);
  const location = useLocation();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("settings:profile.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("settings:profile.description")}
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <nav className="flex flex-col gap-1 md:w-64">
          {profileNavigation.map((item) => (
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
