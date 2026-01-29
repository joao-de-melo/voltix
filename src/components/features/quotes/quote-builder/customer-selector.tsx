import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, Plus, User, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Customer, QuoteContactInfo } from "@/types";

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer | null) => void;
  contactInfo: QuoteContactInfo;
  onContactInfoChange: (info: QuoteContactInfo) => void;
}

function normalizeString(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function CustomerSelector({
  customers,
  selectedCustomer,
  onSelect,
  contactInfo,
  onContactInfoChange,
}: CustomerSelectorProps) {
  const { t } = useTranslation(["quotes", "customers", "common"]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"existing" | "manual">(() => {
    if (selectedCustomer) return "existing";
    if (contactInfo.name) return "manual";
    return "existing";
  });

  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const searchNormalized = normalizeString(search);
    return customers.filter((customer) => {
      const nameMatch = normalizeString(customer.name).includes(searchNormalized);
      const emailMatch =
        customer.email &&
        normalizeString(customer.email).includes(searchNormalized);
      return nameMatch || emailMatch;
    });
  }, [customers, search]);

  const handleModeChange = (newMode: string) => {
    setMode(newMode as "existing" | "manual");
    if (newMode === "manual") {
      onSelect(null);
    } else {
      onContactInfoChange({ name: "" });
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer);
    setSearch("");
  };

  const handleClearCustomer = () => {
    onSelect(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t("quotes:customerSelection.title")}
        </CardTitle>
        <CardDescription>
          {t("quotes:customerSelection.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("quotes:customerSelection.tabs.existing")}
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {t("quotes:customerSelection.tabs.manual")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4 mt-4">
            {/* Selected Customer Display */}
            {selectedCustomer ? (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium">{selectedCustomer.name}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1 -mr-1"
                    onClick={handleClearCustomer}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {selectedCustomer.email && <div>{selectedCustomer.email}</div>}
                  {selectedCustomer.phone && <div>{selectedCustomer.phone}</div>}
                  {selectedCustomer.taxId && (
                    <div>
                      {t("customers:form.taxId")}: {selectedCustomer.taxId}
                    </div>
                  )}
                  {selectedCustomer.billingAddress && (
                    <div className="pt-2">
                      {selectedCustomer.billingAddress.street}
                      <br />
                      {selectedCustomer.billingAddress.postalCode}{" "}
                      {selectedCustomer.billingAddress.city}
                      <br />
                      {selectedCustomer.billingAddress.country}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("quotes:customerSelection.searchCustomers")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Customer List */}
                {customers.length > 0 ? (
                  <ScrollArea className="h-[240px] rounded-md border">
                    <div className="p-2">
                      {filteredCustomers.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          {t("quotes:customerSelection.noCustomerFound")}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {filteredCustomers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleSelectCustomer(customer)}
                              className="w-full rounded-md px-3 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                            >
                              <div className="font-medium">{customer.name}</div>
                              {customer.email && (
                                <div className="text-sm text-muted-foreground">
                                  {customer.email}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">
                      {t("quotes:customerSelection.noCustomersYet")}
                    </p>
                    <Button variant="outline" asChild>
                      <a href="/customers/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("customers:addCustomer")}
                      </a>
                    </Button>
                  </div>
                )}

                {customers.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("quotes:customerSelection.proceedWithoutCustomer")}
                  </p>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">
                  {t("quotes:contactInfo.nameRequired")}
                </Label>
                <Input
                  id="contact-name"
                  placeholder={t("quotes:contactInfo.namePlaceholder")}
                  value={contactInfo.name}
                  onChange={(e) =>
                    onContactInfoChange({ ...contactInfo, name: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">
                    {t("quotes:contactInfo.email")}
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder={t("quotes:contactInfo.emailPlaceholder")}
                    value={contactInfo.email || ""}
                    onChange={(e) =>
                      onContactInfoChange({
                        ...contactInfo,
                        email: e.target.value || undefined,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-phone">
                    {t("quotes:contactInfo.phone")}
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder={t("quotes:contactInfo.phonePlaceholder")}
                    value={contactInfo.phone || ""}
                    onChange={(e) =>
                      onContactInfoChange({
                        ...contactInfo,
                        phone: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-company">
                  {t("quotes:contactInfo.company")}
                </Label>
                <Input
                  id="contact-company"
                  placeholder={t("quotes:contactInfo.companyPlaceholder")}
                  value={contactInfo.company || ""}
                  onChange={(e) =>
                    onContactInfoChange({
                      ...contactInfo,
                      company: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {t("quotes:customerSelection.manualEntry.description")}
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
