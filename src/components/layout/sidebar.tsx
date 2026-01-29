import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Settings,
  ChevronLeft,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navigationItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "customers", href: "/customers", icon: Users },
  { key: "products", href: "/products", icon: Package },
  { key: "quotes", href: "/quotes", icon: FileText },
];

const bottomNavigationItems = [
  { key: "settings", href: "/settings/organization", icon: Settings },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { t } = useTranslation('common');
  const location = useLocation();

  const navigation = navigationItems.map(item => ({
    ...item,
    name: t(`nav.${item.key}`),
  }));

  const bottomNavigation = bottomNavigationItems.map(item => ({
    ...item,
    name: t(`nav.${item.key}`),
  }));

  const NavItem = ({
    item,
    isActive,
  }: {
    item: (typeof navigation)[0];
    isActive: boolean;
  }) => {
    const content = (
      <NavLink
        to={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span>{item.name}</span>}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{item.name}</TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sun className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold">Voltix</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", isCollapsed && "rotate-180")}
          onClick={onToggle}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={location.pathname.startsWith(item.href)}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="border-t px-3 py-4">
        <nav className="flex flex-col gap-1">
          {bottomNavigation.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={location.pathname.startsWith(item.href)}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
