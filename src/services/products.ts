import {
  collections,
  docs,
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  where,
  orderBy,
} from "@/lib/firebase/firestore";
import type { Product, ProductCategory, ProductCategoryInfo } from "@/types";

export async function getProducts(orgId: string): Promise<Product[]> {
  return getDocuments<Product>(
    collections.products(orgId),
    where("isActive", "==", true),
    orderBy("name")
  );
}

export async function getProductsByCategory(
  orgId: string,
  category: ProductCategory
): Promise<Product[]> {
  return getDocuments<Product>(
    collections.products(orgId),
    where("category", "==", category),
    where("isActive", "==", true),
    orderBy("name")
  );
}

export async function getProduct(
  orgId: string,
  productId: string
): Promise<Product | null> {
  return getDocument<Product>(docs.product(orgId, productId));
}

export async function createProduct(
  orgId: string,
  data: Omit<Product, "id" | "createdAt" | "updatedAt" | "orgId">
): Promise<string> {
  return createDocument(collections.products(orgId), {
    ...data,
    orgId,
  });
}

export async function updateProduct(
  orgId: string,
  productId: string,
  data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt" | "orgId">>
): Promise<void> {
  return updateDocument(docs.product(orgId, productId), data);
}

export async function deleteProduct(
  orgId: string,
  productId: string
): Promise<void> {
  // Soft delete by setting isActive to false
  return updateDocument(docs.product(orgId, productId), { isActive: false });
}

export async function getProductCategories(
  orgId: string
): Promise<ProductCategoryInfo[]> {
  return getDocuments<ProductCategoryInfo>(
    collections.productCategories(orgId),
    orderBy("sortOrder")
  );
}

export const DEFAULT_CATEGORIES: Omit<
  ProductCategoryInfo,
  "id" | "createdAt" | "updatedAt" | "orgId"
>[] = [
  {
    code: "solar_panel",
    name: "Solar Panels",
    description: "Photovoltaic solar panels",
    sortOrder: 1,
    isActive: true,
  },
  {
    code: "inverter",
    name: "Inverters",
    description: "String, micro, and hybrid inverters",
    sortOrder: 2,
    isActive: true,
  },
  {
    code: "battery",
    name: "Batteries",
    description: "Energy storage systems",
    sortOrder: 3,
    isActive: true,
  },
  {
    code: "mounting",
    name: "Mounting Systems",
    description: "Roof and ground mounting solutions",
    sortOrder: 4,
    isActive: true,
  },
  {
    code: "labor",
    name: "Labor & Services",
    description: "Installation and service items",
    sortOrder: 5,
    isActive: true,
  },
  {
    code: "accessory",
    name: "Accessories",
    description: "Cables, connectors, and other accessories",
    sortOrder: 6,
    isActive: true,
  },
  {
    code: "other",
    name: "Other",
    description: "Miscellaneous items",
    sortOrder: 7,
    isActive: true,
  },
];

export function getCategoryLabel(category: ProductCategory): string {
  const labels: Record<ProductCategory, string> = {
    solar_panel: "Solar Panels",
    inverter: "Inverters",
    battery: "Batteries",
    mounting: "Mounting Systems",
    labor: "Labor & Services",
    accessory: "Accessories",
    other: "Other",
  };
  return labels[category];
}
