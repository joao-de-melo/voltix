import type { Timestamp } from "firebase/firestore";

// ============================================
// Base Types
// ============================================

export type FirestoreTimestamp = Timestamp;

export interface BaseEntity {
  id: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

// ============================================
// User & Organization
// ============================================

export type UserRole = "owner" | "admin" | "manager" | "sales" | "viewer";

export type Permission =
  | "quotes:create"
  | "quotes:edit"
  | "quotes:delete"
  | "quotes:approve"
  | "quotes:send"
  | "customers:create"
  | "customers:edit"
  | "customers:delete"
  | "products:create"
  | "products:edit"
  | "products:delete"
  | "users:invite"
  | "users:manage"
  | "settings:edit"
  | "reports:view";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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

export interface User extends BaseEntity {
  email: string;
  displayName: string;
  photoURL?: string | null;
  primaryOrgId?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  locale: string;
  notifications: {
    email: boolean;
    quoteUpdates: boolean;
    teamActivity: boolean;
  };
}

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  logoURL?: string;
  regionCode: string;
  settings: OrganizationSettings;
  subscription: SubscriptionInfo;
  branding: OrganizationBranding;
}

export interface OrganizationSettings {
  defaultTaxRate: number;
  quotePrefix: string;
  quoteStartNumber: number;
  quoteValidityDays: number;
  currency: string;
  taxId?: string;
  address?: Address;
  contactEmail?: string;
  contactPhone?: string;
}

export interface OrganizationBranding {
  primaryColor: string;
  secondaryColor?: string;
  headerText?: string;
  footerText?: string;
  termsAndConditions?: string;
}

export interface SubscriptionInfo {
  plan: "free" | "starter" | "professional" | "enterprise";
  status: "active" | "trialing" | "past_due" | "canceled";
  currentPeriodEnd?: FirestoreTimestamp;
  quotesUsed: number;
  quotesLimit: number;
}

export interface Membership {
  orgId: string;
  orgName: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  joinedAt: FirestoreTimestamp;
  invitedBy?: string;
}

export interface Invitation extends BaseEntity {
  orgId: string;
  orgName: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedByName: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  token: string;
  expiresAt: FirestoreTimestamp;
}

// ============================================
// Address
// ============================================

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  state?: string;
}

// ============================================
// Products
// ============================================

export type ProductCategory =
  | "solar_panel"
  | "inverter"
  | "battery"
  | "mounting"
  | "labor"
  | "accessory"
  | "other";

export interface ProductBase extends BaseEntity {
  orgId: string;
  name: string;
  sku: string;
  description?: string | null;
  category: ProductCategory;
  unitPrice: number;
  unit: string;
  taxRate: number;
  isActive: boolean;
  imageURL?: string | null;
  manufacturer?: string | null;
  model?: string | null;
}

export interface SolarPanelSpecs {
  wattage: number;
  efficiency: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  warrantyYears: number;
  cellType: "monocrystalline" | "polycrystalline" | "thin_film";
  tempCoefficient?: number;
}

export interface InverterSpecs {
  type: "string" | "micro" | "hybrid";
  powerRating: number;
  mpptChannels: number;
  efficiency: number;
  phases: 1 | 3;
  warrantyYears: number;
  hasWifi?: boolean;
}

export interface BatterySpecs {
  chemistry: "lithium_ion" | "lfp" | "lead_acid";
  capacityKwh: number;
  usableCapacityKwh: number;
  cycles: number;
  depthOfDischarge: number;
  warrantyYears: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  weight?: number;
}

export interface MountingSpecs {
  roofType: "tile" | "flat" | "metal" | "ground";
  material: "aluminum" | "steel" | "galvanized";
  maxPanels?: number;
  windLoad?: number;
  snowLoad?: number;
}

export interface LaborSpecs {
  unitType: "hour" | "day" | "fixed" | "per_panel" | "per_kw";
  estimatedDuration?: number;
  requiresCertification?: boolean;
}

export type ProductSpecs =
  | SolarPanelSpecs
  | InverterSpecs
  | BatterySpecs
  | MountingSpecs
  | LaborSpecs
  | Record<string, unknown>;

export interface Product extends ProductBase {
  specs: ProductSpecs;
}

export interface ProductCategoryInfo extends BaseEntity {
  orgId: string;
  code: ProductCategory;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

// ============================================
// Customers
// ============================================

export type CustomerStatus = "lead" | "prospect" | "active" | "inactive";

export interface Customer extends BaseEntity {
  orgId: string;
  name: string;
  email: string;
  phone?: string;
  taxId?: string;
  status: CustomerStatus;
  billingAddress?: Address;
  notes?: string;
  tags?: string[];
}

export interface Site extends BaseEntity {
  customerId: string;
  name: string;
  address: Address;
  coordinates?: {
    lat: number;
    lng: number;
  };
  roofType?: "tile" | "flat" | "metal" | "ground";
  roofOrientation?: "north" | "south" | "east" | "west" | "mixed";
  roofArea?: number;
  shadingFactor?: number;
  notes?: string;
  photoURLs?: string[];
  documentURLs?: string[];
}

export interface EnergyProfile extends BaseEntity {
  customerId: string;
  siteId: string;
  annualConsumptionKwh: number;
  monthlyConsumption?: number[];
  peakDemandKw?: number;
  currentProvider?: string;
  currentRatePerkWh?: number;
  tariffType?: "simple" | "bi_horario" | "tri_horario";
  contractedPowerKva?: number;
  notes?: string;
}

// ============================================
// Quotes
// ============================================

export type QuoteStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired";

export interface QuoteContactInfo {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface Quote extends BaseEntity {
  orgId: string;
  number: string;
  customerId?: string;
  customerName?: string;
  contactInfo?: QuoteContactInfo;
  siteId?: string;
  siteName?: string;
  status: QuoteStatus;
  validUntil: FirestoreTimestamp;
  sections: QuoteSection[];
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  total: number;
  notes?: string;
  internalNotes?: string;
  terms?: string;
  createdBy: string;
  createdByName: string;
  approvedBy?: string;
  approvedAt?: FirestoreTimestamp;
  sentAt?: FirestoreTimestamp;
  viewedAt?: FirestoreTimestamp;
  acceptedAt?: FirestoreTimestamp;
  rejectedAt?: FirestoreTimestamp;
  rejectionReason?: string;
  pdfURL?: string;
  systemSummary?: QuoteSystemSummary;
}

export interface QuoteSection {
  id: string;
  name: string;
  sortOrder: number;
  items: QuoteLineItem[];
  subtotal: number;
}

export interface QuoteLineItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: LineItemDiscount | null;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  specs?: Partial<ProductSpecs>;
}

export interface LineItemDiscount {
  type: "percentage" | "fixed";
  value: number;
  amount: number;
}

export interface QuoteDiscount {
  id: string;
  type: "percentage" | "fixed";
  value: number;
  amount: number;
  description?: string;
}

export interface QuoteSystemSummary {
  totalPanels: number;
  totalWattage: number;
  totalKwp: number;
  batteryCapacityKwh: number;
  inverterCapacityKw: number;
  estimatedAnnualProductionKwh?: number;
  estimatedSavingsPerYear?: number;
  paybackYears?: number;
}

// ============================================
// Region
// ============================================

export interface Region extends BaseEntity {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  dateFormat: string;
  taxRates: TaxRate[];
  defaultTaxRateCode: string;
}

export interface TaxRate {
  code: string;
  name: string;
  rate: number;
  description?: string;
}

// ============================================
// Audit Log
// ============================================

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "login"
  | "invite"
  | "join";

export interface AuditLog extends BaseEntity {
  orgId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entityType: "quote" | "customer" | "product" | "user" | "organization" | "invitation";
  entityId: string;
  entityName?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
}

// ============================================
// Quick Quote / System Sizing
// ============================================

export type RoofType = "tile" | "flat" | "metal" | "ground";

export interface SystemSizingInput {
  annualConsumptionKwh: number;
  contractedPowerKva: number;
  cableDistanceM: number;
  roofType?: RoofType;
  shadingFactor?: number;
  includeBattery: boolean;
}

export interface SystemSizingResult {
  recommendedKwp: number;
  maxInverterKw: number;
  numberOfPanels: number;
  panelWattage: number;
  cableSizeDC: number;
  cableSizeAC: number;
  cableLengthDC: number;
  cableLengthAC: number;
  batteryKwh?: number;
  estimatedAnnualProductionKwh: number;
}

export interface ProductSelectionResult {
  selectedProducts: SelectedProduct[];
  warnings: string[];
}

export interface SelectedProduct {
  productId: string;
  product: Product;
  quantity: number;
  section: "equipment" | "installation" | "accessories";
}

export interface ProductCategorySelection {
  panels: boolean;
  inverter: boolean;
  battery: boolean;
  mounting: boolean;
  dcCable: boolean;
  acCable: boolean;
  labor: boolean;
}

export const DEFAULT_PRODUCT_CATEGORIES: ProductCategorySelection = {
  panels: true,
  inverter: true,
  battery: true,
  mounting: true,
  dcCable: true,
  acCable: true,
  labor: true,
};
