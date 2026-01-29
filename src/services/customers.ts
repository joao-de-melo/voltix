import {
  collections,
  docs,
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
} from "@/lib/firebase/firestore";
import type { Customer, CustomerStatus, Site, EnergyProfile } from "@/types";

export async function getCustomers(orgId: string): Promise<Customer[]> {
  return getDocuments<Customer>(
    collections.customers(orgId),
    orderBy("name")
  );
}

export async function getCustomersByStatus(
  orgId: string,
  status: CustomerStatus
): Promise<Customer[]> {
  return getDocuments<Customer>(
    collections.customers(orgId),
    where("status", "==", status),
    orderBy("name")
  );
}

export async function getCustomer(
  orgId: string,
  customerId: string
): Promise<Customer | null> {
  return getDocument<Customer>(docs.customer(orgId, customerId));
}

export async function createCustomer(
  orgId: string,
  data: Omit<Customer, "id" | "createdAt" | "updatedAt" | "orgId">
): Promise<string> {
  return createDocument(collections.customers(orgId), {
    ...data,
    orgId,
  });
}

export async function updateCustomer(
  orgId: string,
  customerId: string,
  data: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt" | "orgId">>
): Promise<void> {
  return updateDocument(docs.customer(orgId, customerId), data);
}

export async function deleteCustomer(
  orgId: string,
  customerId: string
): Promise<void> {
  return deleteDocument(docs.customer(orgId, customerId));
}

// Sites
export async function getCustomerSites(
  orgId: string,
  customerId: string
): Promise<Site[]> {
  return getDocuments<Site>(
    collections.customerSites(orgId, customerId),
    orderBy("name")
  );
}

export async function getSite(
  orgId: string,
  customerId: string,
  siteId: string
): Promise<Site | null> {
  return getDocument<Site>(docs.customerSite(orgId, customerId, siteId));
}

export async function createSite(
  orgId: string,
  customerId: string,
  data: Omit<Site, "id" | "createdAt" | "updatedAt" | "customerId">
): Promise<string> {
  return createDocument(collections.customerSites(orgId, customerId), {
    ...data,
    customerId,
  });
}

export async function updateSite(
  orgId: string,
  customerId: string,
  siteId: string,
  data: Partial<Omit<Site, "id" | "createdAt" | "updatedAt" | "customerId">>
): Promise<void> {
  return updateDocument(docs.customerSite(orgId, customerId, siteId), data);
}

export async function deleteSite(
  orgId: string,
  customerId: string,
  siteId: string
): Promise<void> {
  return deleteDocument(docs.customerSite(orgId, customerId, siteId));
}

// Energy Profiles
export async function getCustomerEnergyProfiles(
  orgId: string,
  customerId: string
): Promise<EnergyProfile[]> {
  return getDocuments<EnergyProfile>(
    collections.customerEnergyProfiles(orgId, customerId)
  );
}

export async function createEnergyProfile(
  orgId: string,
  customerId: string,
  data: Omit<EnergyProfile, "id" | "createdAt" | "updatedAt" | "customerId">
): Promise<string> {
  return createDocument(collections.customerEnergyProfiles(orgId, customerId), {
    ...data,
    customerId,
  });
}

export async function updateEnergyProfile(
  orgId: string,
  customerId: string,
  profileId: string,
  data: Partial<Omit<EnergyProfile, "id" | "createdAt" | "updatedAt" | "customerId">>
): Promise<void> {
  return updateDocument(
    docs.customerEnergyProfile(orgId, customerId, profileId),
    data
  );
}

export function getStatusLabel(status: CustomerStatus): string {
  const labels: Record<CustomerStatus, string> = {
    lead: "Lead",
    prospect: "Prospect",
    active: "Active",
    inactive: "Inactive",
  };
  return labels[status];
}

export function getStatusVariant(
  status: CustomerStatus
): "default" | "secondary" | "success" | "warning" {
  const variants: Record<CustomerStatus, "default" | "secondary" | "success" | "warning"> = {
    lead: "secondary",
    prospect: "warning",
    active: "success",
    inactive: "default",
  };
  return variants[status];
}
