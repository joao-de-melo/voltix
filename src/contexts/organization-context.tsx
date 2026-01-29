import React, { createContext, useContext, useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { useAuth } from "./auth-context";
import { docs } from "@/lib/firebase/firestore";
import type { Organization, Membership, UserRole, Permission } from "@/types";

interface OrganizationContextType {
  organization: Organization | null;
  membership: Membership | null;
  isLoading: boolean;
  switchOrganization: (orgId: string) => void;
  hasPermission: (permission: Permission) => boolean;
  role: UserRole | null;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

const STORAGE_KEY = "voltix_current_org";

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, memberships, isAuthenticated, isLoading: authLoading } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const switchOrganization = (orgId: string) => {
    localStorage.setItem(STORAGE_KEY, orgId);
    const newMembership = memberships.find((m) => m.orgId === orgId) || null;
    setMembership(newMembership);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!membership) return false;
    const rolePermissions = {
      owner: [
        "quotes:create", "quotes:edit", "quotes:delete", "quotes:approve", "quotes:send",
        "customers:create", "customers:edit", "customers:delete",
        "products:create", "products:edit", "products:delete",
        "users:invite", "users:manage",
        "settings:edit",
        "reports:view",
      ],
      admin: [
        "quotes:create", "quotes:edit", "quotes:delete", "quotes:approve", "quotes:send",
        "customers:create", "customers:edit", "customers:delete",
        "products:create", "products:edit", "products:delete",
        "users:invite", "users:manage",
        "settings:edit",
        "reports:view",
      ],
      manager: [
        "quotes:create", "quotes:edit", "quotes:approve", "quotes:send",
        "customers:create", "customers:edit",
        "products:create", "products:edit",
        "users:invite",
        "reports:view",
      ],
      sales: [
        "quotes:create", "quotes:edit", "quotes:send",
        "customers:create", "customers:edit",
        "reports:view",
      ],
      viewer: [
        "reports:view",
      ],
    };
    return rolePermissions[membership.role]?.includes(permission) ?? false;
  };

  // Determine which org to load
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || memberships.length === 0) {
      setOrganization(null);
      setMembership(null);
      setIsLoading(false);
      return;
    }

    // Try to load from localStorage or user preference
    const storedOrgId = localStorage.getItem(STORAGE_KEY);
    const primaryOrgId = user?.primaryOrgId;

    let targetOrgId = storedOrgId || primaryOrgId;

    // Verify the user has access to this org
    let targetMembership = memberships.find((m) => m.orgId === targetOrgId);

    // Fallback to first membership if no valid org found
    if (!targetMembership) {
      targetMembership = memberships[0];
      targetOrgId = targetMembership?.orgId;
    }

    if (targetOrgId) {
      localStorage.setItem(STORAGE_KEY, targetOrgId);
    }

    setMembership(targetMembership || null);
  }, [isAuthenticated, memberships, user, authLoading]);

  // Load organization document when membership changes
  useEffect(() => {
    if (!membership?.orgId) {
      setOrganization(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      docs.organization(membership.orgId),
      (snapshot) => {
        if (snapshot.exists()) {
          setOrganization({
            id: snapshot.id,
            ...snapshot.data(),
          } as Organization);
        } else {
          setOrganization(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error loading organization:", error);
        setOrganization(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [membership?.orgId]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        membership,
        isLoading,
        switchOrganization,
        hasPermission,
        role: membership?.role || null,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
}
