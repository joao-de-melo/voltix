import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Settings2,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";
import { getCustomers, getCustomerEnergyProfiles } from "@/services/customers";
import { getProducts } from "@/services/products";
import { calculateSystemSize } from "@/services/system-sizing";
import { selectProducts } from "@/services/product-selection";
import { generateQuickQuote } from "@/services/quotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/shared/loading-spinner";
import { StepCustomer } from "./step-customer";
import { StepRequirements } from "./step-requirements";
import { StepReview } from "./step-review";
import type {
  Customer,
  Site,
  Product,
  EnergyProfile,
  SystemSizingInput,
  SystemSizingResult,
  ProductSelectionResult,
  QuoteContactInfo,
  ProductCategorySelection,
} from "@/types";
import { DEFAULT_PRODUCT_CATEGORIES } from "@/types";

const STEPS = [
  { id: "customer", label: "Customer", icon: User },
  { id: "requirements", label: "Requirements", icon: Settings2 },
  { id: "review", label: "Review", icon: FileCheck },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const DEFAULT_SIZING_INPUT: SystemSizingInput = {
  annualConsumptionKwh: 0,
  contractedPowerKva: 6.9, // Most common in Portugal
  cableDistanceM: 15,
  roofType: "tile",
  shadingFactor: 0.85,
  includeBattery: false,
};

const DEFAULT_CONTACT_INFO: QuoteContactInfo = {
  name: "",
};

export function QuickQuoteWizard() {
  const navigate = useNavigate();
  const { organization, hasPermission } = useOrganization();
  const { user, firebaseUser } = useAuth();

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<StepId>("customer");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [contactInfo, setContactInfo] = useState<QuoteContactInfo>(DEFAULT_CONTACT_INFO);
  const [energyProfile, setEnergyProfile] = useState<EnergyProfile | null>(null);
  const [sizingInput, setSizingInput] = useState<SystemSizingInput>(DEFAULT_SIZING_INPUT);
  const [categorySelection, setCategorySelection] = useState<ProductCategorySelection>(DEFAULT_PRODUCT_CATEGORIES);

  const canCreate = hasPermission("quotes:create");

  // Load initial data
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
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [organization?.id]);

  // Load energy profile when site is selected
  useEffect(() => {
    if (!selectedCustomer || !selectedSite || !organization?.id) {
      return;
    }

    const loadEnergyProfile = async () => {
      try {
        const profiles = await getCustomerEnergyProfiles(
          organization.id,
          selectedCustomer.id
        );
        const siteProfile = profiles.find((p) => p.siteId === selectedSite.id);
        if (siteProfile) {
          setEnergyProfile(siteProfile);
          // Pre-fill sizing input from profile
          setSizingInput((prev) => ({
            ...prev,
            annualConsumptionKwh:
              siteProfile.annualConsumptionKwh || prev.annualConsumptionKwh,
            contractedPowerKva:
              siteProfile.contractedPowerKva || prev.contractedPowerKva,
          }));
        }
      } catch (error) {
        console.error("Error loading energy profile:", error);
      }
    };

    loadEnergyProfile();
  }, [selectedCustomer, selectedSite, organization?.id]);

  // Update sizing input from site
  useEffect(() => {
    if (selectedSite) {
      setSizingInput((prev) => ({
        ...prev,
        roofType: selectedSite.roofType || prev.roofType,
        shadingFactor: selectedSite.shadingFactor || prev.shadingFactor,
      }));
    }
  }, [selectedSite]);

  // Calculate sizing result
  const sizingResult: SystemSizingResult | null = useMemo(() => {
    if (sizingInput.annualConsumptionKwh <= 0) return null;
    return calculateSystemSize(sizingInput);
  }, [sizingInput]);

  // Select products based on sizing
  const productSelection: ProductSelectionResult | null = useMemo(() => {
    if (!sizingResult) return null;
    return selectProducts(sizingResult, products, sizingInput.roofType, categorySelection);
  }, [sizingResult, products, sizingInput.roofType, categorySelection]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!productSelection) return 0;
    return productSelection.selectedProducts.reduce(
      (sum, p) => sum + p.product.unitPrice * p.quantity,
      0
    );
  }, [productSelection]);

  // Step navigation
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "customer":
        // Customer step is now optional - can always proceed
        return true;
      case "requirements":
        return sizingInput.annualConsumptionKwh > 0 && sizingResult !== null;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1 && canProceed()) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const handleGenerate = async () => {
    if (!organization?.id || !firebaseUser || !user) {
      toast.error("Missing required data");
      return;
    }

    if (!sizingResult || !productSelection) {
      toast.error("System sizing not calculated");
      return;
    }

    setIsGenerating(true);
    try {
      const quoteId = await generateQuickQuote(organization.id, {
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        contactInfo: !selectedCustomer && contactInfo.name ? contactInfo : undefined,
        siteId: selectedSite?.id,
        siteName: selectedSite?.name,
        sizingInput,
        sizingResult,
        productSelection,
        createdBy: firebaseUser.uid,
        createdByName: user.displayName,
      });

      toast.success("Quote generated successfully!");
      navigate(`/quotes/${quoteId}`);
    } catch (error) {
      console.error("Error generating quote:", error);
      toast.error("Failed to generate quote");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          You don't have permission to create quotes.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quick Quote"
        description="Generate a solar system quote from basic requirements"
        actions={
          <Button variant="outline" onClick={() => navigate("/quotes")}>
            Cancel
          </Button>
        }
      />

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => {
                      if (isCompleted) setCurrentStep(step.id);
                    }}
                    disabled={!isCompleted && !isActive}
                    className={`flex items-center gap-2 ${
                      isCompleted ? "cursor-pointer" : ""
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCompleted
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-sm font-medium hidden sm:block ${
                        isActive
                          ? "text-primary"
                          : isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === "customer" && (
          <StepCustomer
            orgId={organization?.id || ""}
            customers={customers}
            selectedCustomer={selectedCustomer}
            selectedSite={selectedSite}
            contactInfo={contactInfo}
            energyProfile={energyProfile}
            onSelectCustomer={setSelectedCustomer}
            onSelectSite={setSelectedSite}
            onContactInfoChange={setContactInfo}
            onEnergyProfileLoaded={setEnergyProfile}
          />
        )}

        {currentStep === "requirements" && (
          <StepRequirements
            sizingInput={sizingInput}
            onInputChange={(updates) =>
              setSizingInput((prev) => ({ ...prev, ...updates }))
            }
            categorySelection={categorySelection}
            onCategoryChange={(updates) =>
              setCategorySelection((prev) => ({ ...prev, ...updates }))
            }
            energyProfile={energyProfile}
            selectedSite={selectedSite}
          />
        )}

        {currentStep === "review" && sizingResult && productSelection && (
          <StepReview
            customer={selectedCustomer}
            contactInfo={!selectedCustomer && contactInfo.name ? contactInfo : undefined}
            site={selectedSite}
            sizingResult={sizingResult}
            productSelection={productSelection}
            totalPrice={totalPrice}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep === "review" ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !canProceed()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Quote
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
