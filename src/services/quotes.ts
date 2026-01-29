import {
  collections,
  docs,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  where,
  orderBy,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toTimestamp } from "@/lib/firebase/firestore";
import { addDays } from "date-fns";
import type { TFunction } from "i18next";
import type {
  Quote,
  QuoteStatus,
  QuoteLineItem,
  QuoteSection,
  QuoteContactInfo,
  SystemSizingInput,
  SystemSizingResult,
  ProductSelectionResult,
  QuoteSystemSummary,
  SolarPanelSpecs,
} from "@/types";

export async function getQuotes(orgId: string): Promise<Quote[]> {
  return getDocuments<Quote>(
    collections.quotes(orgId),
    orderBy("createdAt", "desc")
  );
}

export async function getQuotesByStatus(
  orgId: string,
  status: QuoteStatus
): Promise<Quote[]> {
  return getDocuments<Quote>(
    collections.quotes(orgId),
    where("status", "==", status),
    orderBy("createdAt", "desc")
  );
}

export async function getQuote(
  orgId: string,
  quoteId: string
): Promise<Quote | null> {
  return getDocument<Quote>(docs.quote(orgId, quoteId));
}

export async function createQuote(
  orgId: string,
  data: Omit<Quote, "id" | "createdAt" | "updatedAt" | "orgId" | "number">
): Promise<string> {
  // Generate quote number using a transaction
  const orgRef = doc(db, "organizations", orgId);

  return runTransaction(db, async (transaction) => {
    const orgDoc = await transaction.get(orgRef);
    if (!orgDoc.exists()) throw new Error("Organization not found");

    const orgData = orgDoc.data();
    const settings = orgData.settings || {};
    const prefix = settings.quotePrefix || "QT";
    const nextNumber = (settings.quoteStartNumber || 1) + (orgData.quotesCount || 0);
    const quoteNumber = `${prefix}-${nextNumber.toString().padStart(5, "0")}`;

    // Update org quotes count
    transaction.update(orgRef, {
      quotesCount: (orgData.quotesCount || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    // Create quote
    const quoteRef = doc(collections.quotes(orgId));
    transaction.set(quoteRef, {
      ...data,
      orgId,
      number: quoteNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return quoteRef.id;
  });
}

export async function updateQuote(
  orgId: string,
  quoteId: string,
  data: Partial<Omit<Quote, "id" | "createdAt" | "updatedAt" | "orgId" | "number">>
): Promise<void> {
  return updateDocument(docs.quote(orgId, quoteId), data);
}

export async function deleteQuote(
  orgId: string,
  quoteId: string
): Promise<void> {
  return deleteDocument(docs.quote(orgId, quoteId));
}

export async function updateQuoteStatus(
  orgId: string,
  quoteId: string,
  status: QuoteStatus,
  additionalData?: Partial<Quote>
): Promise<void> {
  const updates: Partial<Quote> = { status, ...additionalData };

  // Set timestamp based on status
  switch (status) {
    case "sent":
      updates.sentAt = serverTimestamp() as any;
      break;
    case "viewed":
      updates.viewedAt = serverTimestamp() as any;
      break;
    case "accepted":
      updates.acceptedAt = serverTimestamp() as any;
      break;
    case "rejected":
      updates.rejectedAt = serverTimestamp() as any;
      break;
  }

  return updateDocument(docs.quote(orgId, quoteId), updates);
}

// Quote calculations
export function calculateLineItem(
  item: Omit<QuoteLineItem, "subtotal" | "taxAmount" | "total">
): QuoteLineItem {
  const baseAmount = item.quantity * item.unitPrice;
  let discountAmount = 0;

  if (item.discount) {
    if (item.discount.type === "percentage") {
      discountAmount = (baseAmount * item.discount.value) / 100;
    } else {
      discountAmount = item.discount.value;
    }
  }

  const subtotal = baseAmount - discountAmount;
  const taxAmount = (subtotal * item.taxRate) / 100;
  const total = subtotal + taxAmount;

  return {
    ...item,
    discount: item.discount
      ? { ...item.discount, amount: discountAmount }
      : null,
    subtotal,
    taxAmount,
    total,
  };
}

export function calculateSection(section: Omit<QuoteSection, "subtotal">): QuoteSection {
  const subtotal = section.items.reduce((sum, item) => sum + item.subtotal, 0);
  return { ...section, subtotal };
}

export function calculateQuoteTotals(sections: QuoteSection[]): {
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  total: number;
} {
  let subtotal = 0;
  let totalDiscount = 0;
  let taxAmount = 0;

  sections.forEach((section) => {
    section.items.forEach((item) => {
      subtotal += item.quantity * item.unitPrice;
      if (item.discount) {
        totalDiscount += item.discount.amount;
      }
      taxAmount += item.taxAmount;
    });
  });

  const total = subtotal - totalDiscount + taxAmount;

  return { subtotal, totalDiscount, taxAmount, total };
}

// Status label function that accepts t function for i18n
export function getStatusLabel(status: QuoteStatus, t?: TFunction): string {
  if (t) {
    return t(`quotes:status.${status}`);
  }
  // Fallback for non-translated contexts
  const labels: Record<QuoteStatus, string> = {
    draft: "Draft",
    pending_approval: "Pending Approval",
    approved: "Approved",
    sent: "Sent",
    viewed: "Viewed",
    accepted: "Accepted",
    rejected: "Rejected",
    expired: "Expired",
  };
  return labels[status];
}

export function getStatusVariant(
  status: QuoteStatus
): "default" | "secondary" | "success" | "destructive" | "warning" | "outline" {
  const variants: Record<QuoteStatus, "default" | "secondary" | "success" | "destructive" | "warning" | "outline"> = {
    draft: "secondary",
    pending_approval: "warning",
    approved: "default",
    sent: "default",
    viewed: "default",
    accepted: "success",
    rejected: "destructive",
    expired: "outline",
  };
  return variants[status];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Quick Quote Generation
export interface QuickQuoteInput {
  customerId?: string;
  customerName?: string;
  contactInfo?: QuoteContactInfo;
  siteId?: string;
  siteName?: string;
  sizingInput: SystemSizingInput;
  sizingResult: SystemSizingResult;
  productSelection: ProductSelectionResult;
  createdBy: string;
  createdByName: string;
}

/**
 * Generate a quick quote from system sizing and product selection
 */
export async function generateQuickQuote(
  orgId: string,
  input: QuickQuoteInput
): Promise<string> {
  const { sizingResult, productSelection } = input;

  // Build quote sections from selected products
  const equipmentSection: QuoteSection = {
    id: generateId(),
    name: "Equipment",
    sortOrder: 0,
    items: [],
    subtotal: 0,
  };

  const installationSection: QuoteSection = {
    id: generateId(),
    name: "Installation",
    sortOrder: 1,
    items: [],
    subtotal: 0,
  };

  const accessoriesSection: QuoteSection = {
    id: generateId(),
    name: "Accessories",
    sortOrder: 2,
    items: [],
    subtotal: 0,
  };

  // Map selected products to line items
  for (const selection of productSelection.selectedProducts) {
    const lineItem = calculateLineItem({
      id: generateId(),
      productId: selection.productId,
      name: selection.product.name,
      description: selection.product.description || undefined,
      quantity: selection.quantity,
      unit: selection.product.unit,
      unitPrice: selection.product.unitPrice,
      taxRate: selection.product.taxRate,
      discount: null,
      specs: selection.product.specs,
    });

    switch (selection.section) {
      case "equipment":
        equipmentSection.items.push(lineItem);
        equipmentSection.subtotal += lineItem.subtotal;
        break;
      case "installation":
        installationSection.items.push(lineItem);
        installationSection.subtotal += lineItem.subtotal;
        break;
      case "accessories":
        accessoriesSection.items.push(lineItem);
        accessoriesSection.subtotal += lineItem.subtotal;
        break;
    }
  }

  // Only include non-empty sections
  const sections: QuoteSection[] = [];
  if (equipmentSection.items.length > 0) sections.push(equipmentSection);
  if (installationSection.items.length > 0) sections.push(installationSection);
  if (accessoriesSection.items.length > 0) sections.push(accessoriesSection);

  // Calculate totals
  const totals = calculateQuoteTotals(sections);

  // Build system summary
  const systemSummary: QuoteSystemSummary = {
    totalPanels: sizingResult.numberOfPanels,
    totalWattage: sizingResult.numberOfPanels * sizingResult.panelWattage,
    totalKwp: sizingResult.recommendedKwp,
    batteryCapacityKwh: sizingResult.batteryKwh || 0,
    inverterCapacityKw: sizingResult.maxInverterKw,
    estimatedAnnualProductionKwh: sizingResult.estimatedAnnualProductionKwh,
  };

  // Add estimated savings and payback from panels
  const panelItem = equipmentSection.items.find(
    (item) => item.specs && "wattage" in item.specs
  );
  if (panelItem) {
    const panelSpecs = panelItem.specs as SolarPanelSpecs;
    systemSummary.totalWattage = sizingResult.numberOfPanels * (panelSpecs.wattage || sizingResult.panelWattage);
    systemSummary.totalKwp = systemSummary.totalWattage / 1000;
  }

  // Create the quote
  const validUntil = toTimestamp(addDays(new Date(), 30));

  const quoteData = {
    ...(input.customerId && { customerId: input.customerId }),
    ...(input.customerName && { customerName: input.customerName }),
    ...(input.contactInfo && { contactInfo: input.contactInfo }),
    ...(input.siteId && { siteId: input.siteId }),
    ...(input.siteName && { siteName: input.siteName }),
    status: "draft" as QuoteStatus,
    validUntil,
    sections,
    subtotal: totals.subtotal,
    totalDiscount: totals.totalDiscount,
    taxAmount: totals.taxAmount,
    total: totals.total,
    notes: generateQuoteNotes(sizingResult, input.sizingInput),
    internalNotes: `Generated via Quick Quote.\nAnnual consumption: ${input.sizingInput.annualConsumptionKwh} kWh\nContracted power: ${input.sizingInput.contractedPowerKva} kVA`,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    systemSummary,
  };

  return createQuote(orgId, quoteData as any);
}

/**
 * Generate customer-facing notes for the quote
 */
function generateQuoteNotes(
  sizingResult: SystemSizingResult,
  sizingInput: SystemSizingInput
): string {
  const lines: string[] = [
    `System Size: ${sizingResult.recommendedKwp} kWp`,
    `Number of Panels: ${sizingResult.numberOfPanels} x ${sizingResult.panelWattage}W`,
    `Estimated Annual Production: ${sizingResult.estimatedAnnualProductionKwh.toLocaleString()} kWh`,
  ];

  if (sizingResult.batteryKwh) {
    lines.push(`Battery Storage: ${sizingResult.batteryKwh} kWh`);
  }

  lines.push("");
  lines.push("This quote is based on the following assumptions:");
  lines.push(`- Annual electricity consumption: ${sizingInput.annualConsumptionKwh.toLocaleString()} kWh`);
  lines.push(`- Contracted power: ${sizingInput.contractedPowerKva} kVA`);
  lines.push(`- Roof type: ${sizingInput.roofType || "tile"}`);

  return lines.join("\n");
}
