import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { addDays } from "date-fns";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";
import { getCustomers } from "@/services/customers";
import { getProducts } from "@/services/products";
import {
  createQuote,
  updateQuote,
  calculateLineItem,
  calculateQuoteTotals,
  generateId,
} from "@/services/quotes";
import { toTimestamp } from "@/lib/firebase/firestore";
import { CustomerSelector } from "./customer-selector";
import { ProductSelector } from "./product-selector";
import { LineItemsEditor } from "./line-items-editor";
import { QuoteSummary } from "./quote-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/shared/loading-spinner";
import type { Quote, Customer, Product, QuoteSection, QuoteLineItem, QuoteContactInfo } from "@/types";

interface QuoteBuilderProps {
  quote?: Quote;
}

export function QuoteBuilder({ quote }: QuoteBuilderProps) {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const { user, firebaseUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Quote state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sections, setSections] = useState<QuoteSection[]>(
    quote?.sections || [
      {
        id: generateId(),
        name: "Equipment",
        sortOrder: 0,
        items: [],
        subtotal: 0,
      },
      {
        id: generateId(),
        name: "Installation",
        sortOrder: 1,
        items: [],
        subtotal: 0,
      },
    ]
  );
  const [notes, setNotes] = useState(quote?.notes || "");
  const [internalNotes, setInternalNotes] = useState(quote?.internalNotes || "");
  const [contactInfo, setContactInfo] = useState<QuoteContactInfo>(
    quote?.contactInfo || { name: "" }
  );
  // Default to customer tab for new quotes, items for editing
  const [activeTab, setActiveTab] = useState(quote ? "items" : "customer");

  // Load data
  useEffect(() => {
    if (!organization?.id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [customersData, productsData] = await Promise.all([
          getCustomers(organization.id),
          getProducts(organization.id),
        ]);
        setCustomers(customersData);
        setProducts(productsData);

        // If editing, set the selected customer
        if (quote) {
          const customer = customersData.find((c) => c.id === quote.customerId);
          if (customer) setSelectedCustomer(customer);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [organization?.id, quote]);

  // Add product to quote
  const handleAddProduct = useCallback(
    (product: Product, sectionId?: string) => {
      const targetSectionId = sectionId || sections[0]?.id;
      if (!targetSectionId) return;

      const lineItem = calculateLineItem({
        id: generateId(),
        productId: product.id,
        name: product.name,
        description: product.description ?? undefined,
        quantity: 1,
        unit: product.unit,
        unitPrice: product.unitPrice,
        taxRate: product.taxRate,
        discount: null,
        specs: product.specs,
      });

      setSections((prev) =>
        prev.map((section) =>
          section.id === targetSectionId
            ? {
                ...section,
                items: [...section.items, lineItem],
                subtotal: section.subtotal + lineItem.subtotal,
              }
            : section
        )
      );
    },
    [sections]
  );

  // Update line item
  const handleUpdateLineItem = useCallback(
    (sectionId: string, itemId: string, updates: Partial<QuoteLineItem>) => {
      setSections((prev) =>
        prev.map((section) => {
          if (section.id !== sectionId) return section;

          const updatedItems = section.items.map((item) => {
            if (item.id !== itemId) return item;

            const updatedItem = { ...item, ...updates };
            return calculateLineItem(updatedItem);
          });

          return {
            ...section,
            items: updatedItems,
            subtotal: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
          };
        })
      );
    },
    []
  );

  // Remove line item
  const handleRemoveLineItem = useCallback(
    (sectionId: string, itemId: string) => {
      setSections((prev) =>
        prev.map((section) => {
          if (section.id !== sectionId) return section;

          const updatedItems = section.items.filter((item) => item.id !== itemId);
          return {
            ...section,
            items: updatedItems,
            subtotal: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
          };
        })
      );
    },
    []
  );

  // Add section
  const handleAddSection = useCallback(() => {
    setSections((prev) => [
      ...prev,
      {
        id: generateId(),
        name: `Section ${prev.length + 1}`,
        sortOrder: prev.length,
        items: [],
        subtotal: 0,
      },
    ]);
  }, []);

  // Remove section
  const handleRemoveSection = useCallback((sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }, []);

  // Rename section
  const handleRenameSection = useCallback((sectionId: string, name: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, name } : s))
    );
  }, []);

  // Calculate totals
  const totals = calculateQuoteTotals(sections);

  // Calculate system summary
  const systemSummary = {
    totalPanels: sections.reduce(
      (sum, s) =>
        sum +
        s.items
          .filter((i) => i.specs && "wattage" in i.specs)
          .reduce((acc, i) => acc + i.quantity, 0),
      0
    ),
    totalWattage: sections.reduce(
      (sum, s) =>
        sum +
        s.items
          .filter((i) => i.specs && "wattage" in i.specs)
          .reduce((acc, i) => acc + i.quantity * ((i.specs as any)?.wattage || 0), 0),
      0
    ),
    totalKwp: 0,
    batteryCapacityKwh: sections.reduce(
      (sum, s) =>
        sum +
        s.items
          .filter((i) => i.specs && "capacityKwh" in i.specs)
          .reduce((acc, i) => acc + i.quantity * ((i.specs as any)?.capacityKwh || 0), 0),
      0
    ),
    inverterCapacityKw: sections.reduce(
      (sum, s) =>
        sum +
        s.items
          .filter((i) => i.specs && "powerRating" in i.specs)
          .reduce((acc, i) => acc + i.quantity * ((i.specs as any)?.powerRating || 0), 0),
      0
    ),
  };
  systemSummary.totalKwp = systemSummary.totalWattage / 1000;

  // Save quote
  const handleSave = async (status: "draft" | "pending_approval" = "draft") => {
    if (!organization?.id || !firebaseUser || !user) {
      toast.error("Missing required data");
      return;
    }

    if (!selectedCustomer && !contactInfo.name.trim()) {
      toast.error("Please select a customer or enter contact details");
      setActiveTab("customer");
      return;
    }

    const hasItems = sections.some((s) => s.items.length > 0);
    if (!hasItems) {
      toast.error("Please add at least one item to the quote");
      setActiveTab("items");
      return;
    }

    setIsSaving(true);
    try {
      const validUntil = toTimestamp(
        addDays(new Date(), organization.settings.quoteValidityDays || 30)
      );

      const quoteData: Record<string, unknown> = {
        customerId: selectedCustomer?.id ?? null,
        customerName: selectedCustomer?.name || contactInfo.name,
        status,
        validUntil,
        sections,
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        taxAmount: totals.taxAmount,
        total: totals.total,
        notes,
        internalNotes,
        createdBy: firebaseUser.uid,
        createdByName: user.displayName,
        systemSummary,
      };

      // Only include contactInfo when no customer is selected
      if (!selectedCustomer && contactInfo.name) {
        quoteData.contactInfo = contactInfo;
      } else {
        quoteData.contactInfo = null;
      }

      if (quote) {
        await updateQuote(organization.id, quote.id, quoteData);
        toast.success("Quote updated successfully");
      } else {
        await createQuote(organization.id, quoteData as any);
        toast.success("Quote created successfully");
      }

      navigate("/quotes");
    } catch (error) {
      console.error("Error saving quote:", error);
      toast.error("Failed to save quote");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={quote ? `Edit Quote ${quote.number}` : "New Quote"}
        description={
          quote
            ? "Modify the quote details"
            : "Create a new solar installation quote"
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="items">Line Items</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="customer" className="space-y-4 mt-4">
              <CustomerSelector
                customers={customers}
                selectedCustomer={selectedCustomer}
                onSelect={setSelectedCustomer}
                contactInfo={contactInfo}
                onContactInfoChange={setContactInfo}
              />
            </TabsContent>

            <TabsContent value="items" className="space-y-4 mt-4">
              <ProductSelector
                products={products}
                sections={sections}
                onAddProduct={handleAddProduct}
              />

              <LineItemsEditor
                sections={sections}
                onUpdateItem={handleUpdateLineItem}
                onRemoveItem={handleRemoveLineItem}
                onAddSection={handleAddSection}
                onRemoveSection={handleRemoveSection}
                onRenameSection={handleRenameSection}
              />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Notes visible to the customer..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Internal notes (not visible to customer)..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-4">
          <QuoteSummary
            customer={selectedCustomer}
            contactInfo={contactInfo}
            totals={totals}
            systemSummary={systemSummary}
          />

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Button
                className="w-full"
                onClick={() => handleSave("draft")}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save as Draft"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSave("pending_approval")}
                disabled={isSaving}
              >
                Submit for Approval
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/quotes")}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
