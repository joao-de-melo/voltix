import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronsUpDown, Plus, User, MapPin, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCustomerSites } from "@/services/customers";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Customer, Site, EnergyProfile, QuoteContactInfo } from "@/types";

interface StepCustomerProps {
  orgId: string;
  customers: Customer[];
  selectedCustomer: Customer | null;
  selectedSite: Site | null;
  contactInfo: QuoteContactInfo;
  energyProfile: EnergyProfile | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onSelectSite: (site: Site | null) => void;
  onContactInfoChange: (info: QuoteContactInfo) => void;
  onEnergyProfileLoaded: (profile: EnergyProfile | null) => void;
}

function normalizeString(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function StepCustomer({
  orgId,
  customers,
  selectedCustomer,
  selectedSite,
  contactInfo,
  energyProfile,
  onSelectCustomer,
  onSelectSite,
  onContactInfoChange,
  onEnergyProfileLoaded,
}: StepCustomerProps) {
  const { t } = useTranslation(['quotes', 'customers', 'common']);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [siteOpen, setSiteOpen] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [mode, setMode] = useState<"existing" | "manual">(
    selectedCustomer ? "existing" : contactInfo.name ? "manual" : "existing"
  );

  const filteredCustomers = customers.filter((customer) => {
    if (!customerSearch) return true;
    const searchNormalized = normalizeString(customerSearch);
    const nameMatch = normalizeString(customer.name).includes(searchNormalized);
    const emailMatch = customer.email && normalizeString(customer.email).includes(searchNormalized);
    return nameMatch || emailMatch;
  });

  // Load sites when customer is selected
  useEffect(() => {
    if (!selectedCustomer || !orgId) {
      setSites([]);
      onSelectSite(null);
      onEnergyProfileLoaded(null);
      return;
    }

    const loadSites = async () => {
      setIsLoadingSites(true);
      try {
        const customerSites = await getCustomerSites(orgId, selectedCustomer.id);
        setSites(customerSites);
        // Auto-select if only one site
        if (customerSites.length === 1) {
          onSelectSite(customerSites[0]);
        }
      } catch (error) {
        console.error("Error loading sites:", error);
      } finally {
        setIsLoadingSites(false);
      }
    };

    loadSites();
  }, [selectedCustomer, orgId, onSelectSite, onEnergyProfileLoaded]);

  // Clear customer when switching to manual mode
  const handleModeChange = (newMode: string) => {
    setMode(newMode as "existing" | "manual");
    if (newMode === "manual") {
      onSelectCustomer(null);
      onSelectSite(null);
    } else {
      onContactInfoChange({ name: "" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('quotes:customerSelection.title')}
          </CardTitle>
          <CardDescription>
            {t('quotes:customerSelection.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={handleModeChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('quotes:customerSelection.tabs.existing')}
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {t('quotes:customerSelection.tabs.manual')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4 mt-4">
              <Popover open={customerOpen} onOpenChange={(isOpen) => {
                setCustomerOpen(isOpen);
                if (!isOpen) setCustomerSearch("");
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerOpen}
                    className="w-full justify-between"
                  >
                    {selectedCustomer ? (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedCustomer.name}
                      </span>
                    ) : (
                      t('quotes:customerSelection.selectCustomerOptional')
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder={t('quotes:customerSelection.searchCustomers')}
                      value={customerSearch}
                      onValueChange={setCustomerSearch}
                    />
                    <CommandList>
                      {filteredCustomers.length === 0 && (
                        <CommandEmpty>{t('quotes:customerSelection.noCustomerFound')}</CommandEmpty>
                      )}
                      <CommandGroup>
                        {filteredCustomers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.id}
                            onSelect={() => {
                              onSelectCustomer(customer);
                              setCustomerOpen(false);
                              setCustomerSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomer?.id === customer.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {customer.email}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Customer Details */}
              {selectedCustomer && (
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="font-medium">{selectedCustomer.name}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>{selectedCustomer.email}</div>
                    {selectedCustomer.phone && <div>{selectedCustomer.phone}</div>}
                    {selectedCustomer.taxId && (
                      <div>{t('customers:form.taxId')}: {selectedCustomer.taxId}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => onSelectCustomer(null)}
                  >
                    {t('quotes:customerSelection.clearSelection')}
                  </Button>
                </div>
              )}

              {!selectedCustomer && (
                <p className="text-sm text-muted-foreground">
                  {t('quotes:customerSelection.proceedWithoutCustomer')}
                </p>
              )}

              {customers.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">{t('quotes:customerSelection.noCustomersYet')}</p>
                  <Button variant="outline" asChild>
                    <a href="/customers/new">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('customers:addCustomer')}
                    </a>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">{t('quotes:contactInfo.nameRequired')}</Label>
                  <Input
                    id="contact-name"
                    placeholder={t('quotes:contactInfo.namePlaceholder')}
                    value={contactInfo.name}
                    onChange={(e) =>
                      onContactInfoChange({ ...contactInfo, name: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">{t('quotes:contactInfo.email')}</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder={t('quotes:contactInfo.emailPlaceholder')}
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
                    <Label htmlFor="contact-phone">{t('quotes:contactInfo.phone')}</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      placeholder={t('quotes:contactInfo.phonePlaceholder')}
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
                  <Label htmlFor="contact-company">{t('quotes:contactInfo.company')}</Label>
                  <Input
                    id="contact-company"
                    placeholder={t('quotes:contactInfo.companyPlaceholder')}
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
                {t('quotes:customerSelection.manualEntry.description')}
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Site Selection - Only show when customer is selected */}
      {selectedCustomer && mode === "existing" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('quotes:siteSelection.title')}
            </CardTitle>
            <CardDescription>
              {t('quotes:siteSelection.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSites ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : sites.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="mb-2">{t('quotes:siteSelection.noSitesForCustomer')}</p>
                <p className="text-sm">
                  {t('quotes:siteSelection.continueWithoutSite')}
                </p>
              </div>
            ) : (
              <>
                <Popover open={siteOpen} onOpenChange={setSiteOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={siteOpen}
                      className="w-full justify-between"
                    >
                      {selectedSite ? (
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {selectedSite.name}
                        </span>
                      ) : (
                        t('quotes:siteSelection.selectSite')
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder={t('quotes:siteSelection.searchSites')} />
                      <CommandList>
                        <CommandEmpty>{t('quotes:siteSelection.noSiteFound')}</CommandEmpty>
                        <CommandGroup>
                          {sites.map((site) => (
                            <CommandItem
                              key={site.id}
                              value={site.name}
                              onSelect={() => {
                                onSelectSite(site);
                                setSiteOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedSite?.id === site.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{site.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {site.address.city}, {site.address.country}
                                </div>
                              </div>
                              {site.roofType && (
                                <Badge variant="outline" className="ml-2">
                                  {site.roofType}
                                </Badge>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Site Details */}
                {selectedSite && (
                  <div className="rounded-lg border p-4 space-y-2">
                    <h4 className="font-medium">{selectedSite.name}</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>{selectedSite.address.street}</div>
                      <div>
                        {selectedSite.address.postalCode}{" "}
                        {selectedSite.address.city}
                      </div>
                      <div className="pt-2 flex gap-2">
                        {selectedSite.roofType && (
                          <Badge variant="outline">
                            {t('quotes:siteSelection.roof')}: {selectedSite.roofType}
                          </Badge>
                        )}
                        {selectedSite.roofOrientation && (
                          <Badge variant="outline">
                            {t('quotes:siteSelection.orientation')}: {selectedSite.roofOrientation}
                          </Badge>
                        )}
                        {selectedSite.shadingFactor && (
                          <Badge variant="outline">
                            {t('quotes:siteSelection.shading')}: {Math.round(selectedSite.shadingFactor * 100)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Energy Profile Info */}
                {energyProfile && (
                  <div className="rounded-lg border border-emerald-300 bg-emerald-100 p-4 dark:border-emerald-700 dark:bg-emerald-950">
                    <h4 className="font-medium text-emerald-900 dark:text-emerald-100">
                      {t('quotes:siteSelection.energyProfileFound')}
                    </h4>
                    <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mt-1">
                      {t('quotes:siteSelection.annualConsumption')}: {energyProfile.annualConsumptionKwh.toLocaleString()} kWh
                      {energyProfile.contractedPowerKva && (
                        <span className="ml-2">
                          | {t('quotes:siteSelection.contracted')}: {energyProfile.contractedPowerKva} kVA
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
