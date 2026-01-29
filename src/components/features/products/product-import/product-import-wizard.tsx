import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  FileCheck,
  AlertTriangle,
  Package,
} from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StepUpload } from "./step-upload";
import { StepReview } from "./step-review";
import { StepFixErrors } from "./step-fix-errors";
import { StepConfirm } from "./step-confirm";
import {
  parseCsv,
  validateImport,
  importProducts,
  readFileAsText,
  revalidateProduct,
  getProducts,
} from "@/services/product-import";
import type { ValidatedProduct, ImportResult } from "@/services/product-import";

const STEPS = [
  { id: "upload", label: "Upload", icon: Upload },
  { id: "review", label: "Review", icon: FileCheck },
  { id: "fix", label: "Fix Errors", icon: AlertTriangle },
  { id: "confirm", label: "Import", icon: Package },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function ProductImportWizard() {
  const navigate = useNavigate();
  const { organization, hasPermission } = useOrganization();

  // Step state
  const [currentStep, setCurrentStep] = useState<StepId>("upload");

  // Upload state
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Validation state
  const [validProducts, setValidProducts] = useState<ValidatedProduct[]>([]);
  const [invalidProducts, setInvalidProducts] = useState<ValidatedProduct[]>([]);
  const [existingSkus, setExistingSkus] = useState<Set<string>>(new Set());
  const [, setTotalRows] = useState(0);
  const [removedCount, setRemovedCount] = useState(0);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const canCreate = hasPermission("products:create");

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!organization?.id) return;

      setUploadError(null);
      setIsProcessing(true);

      try {
        // Read file content
        const content = await readFileAsText(file);

        // Parse CSV
        const rows = parseCsv(content);
        if (rows.length === 0) {
          setUploadError("The file is empty or has no data rows");
          setIsProcessing(false);
          return;
        }

        // Validate against existing products
        const result: ImportResult = await validateImport(organization.id, rows);

        // Store existing SKUs for later re-validation
        const products = await getProducts(organization.id);
        setExistingSkus(new Set(products.map((p) => p.sku.toLowerCase())));

        setValidProducts(result.validProducts);
        setInvalidProducts(result.invalidProducts);
        setTotalRows(result.totalRows);
        setRemovedCount(0);

        // Move to next step
        if (result.invalidProducts.length > 0) {
          // If there are errors, go to review first then fix
          setCurrentStep("review");
        } else {
          setCurrentStep("review");
        }

        toast.success(`Processed ${rows.length} rows`);
      } catch (error) {
        console.error("Error processing file:", error);
        setUploadError(
          error instanceof Error ? error.message : "Failed to process file"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [organization?.id]
  );

  // Update valid product
  const handleUpdateValidProduct = useCallback(
    (index: number, product: ValidatedProduct) => {
      // Build import SKUs map (excluding the one being updated)
      const importSkus = new Map<string, number>();
      validProducts.forEach((p, i) => {
        if (i !== index && p.product.sku) {
          importSkus.set(p.product.sku.toLowerCase(), p.rowNumber);
        }
      });

      // Re-validate
      const revalidated = revalidateProduct(product, existingSkus, importSkus);

      if (revalidated.errors.length > 0) {
        // Move to invalid
        setValidProducts((prev) => prev.filter((_, i) => i !== index));
        setInvalidProducts((prev) => [...prev, revalidated]);
      } else {
        setValidProducts((prev) =>
          prev.map((p, i) => (i === index ? revalidated : p))
        );
      }
    },
    [validProducts, existingSkus]
  );

  // Update invalid product
  const handleUpdateInvalidProduct = useCallback(
    (index: number, product: ValidatedProduct) => {
      // Build import SKUs map (excluding the one being updated)
      const importSkus = new Map<string, number>();
      validProducts.forEach((p) => {
        if (p.product.sku) {
          importSkus.set(p.product.sku.toLowerCase(), p.rowNumber);
        }
      });
      invalidProducts.forEach((p, i) => {
        if (i !== index && p.product.sku) {
          importSkus.set(p.product.sku.toLowerCase(), p.rowNumber);
        }
      });

      // Re-validate
      const revalidated = revalidateProduct(product, existingSkus, importSkus);

      if (revalidated.errors.length === 0) {
        // Move to valid
        setInvalidProducts((prev) => prev.filter((_, i) => i !== index));
        setValidProducts((prev) => [...prev, revalidated]);
        toast.success("Product fixed and moved to valid list");
      } else {
        setInvalidProducts((prev) =>
          prev.map((p, i) => (i === index ? revalidated : p))
        );
      }
    },
    [validProducts, invalidProducts, existingSkus]
  );

  // Remove invalid product
  const handleRemoveInvalidProduct = useCallback((index: number) => {
    setInvalidProducts((prev) => prev.filter((_, i) => i !== index));
    setRemovedCount((prev) => prev + 1);
    toast.info("Product removed from import");
  }, []);

  // Import products
  const handleImport = useCallback(async () => {
    if (!organization?.id || validProducts.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Import in batches for progress tracking
      const batchSize = 5;
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < validProducts.length; i += batchSize) {
        const batch = validProducts.slice(i, i + batchSize);
        const result = await importProducts(organization.id, batch);
        success += result.success;
        failed += result.failed;
        errors.push(...result.errors);

        setImportProgress(((i + batch.length) / validProducts.length) * 100);
      }

      setImportResult({ success, failed, errors });

      if (failed === 0) {
        toast.success(`Successfully imported ${success} products`);
      } else {
        toast.warning(`Imported ${success} products, ${failed} failed`);
      }
    } catch (error) {
      console.error("Error importing products:", error);
      toast.error("Failed to import products");
    } finally {
      setIsImporting(false);
    }
  }, [organization?.id, validProducts]);

  // Navigation
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case "upload":
        return false; // Handled by file upload
      case "review":
        return true;
      case "fix":
        return true;
      case "confirm":
        return validProducts.length > 0 && !isImporting && !importResult;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === "review") {
      if (invalidProducts.length > 0) {
        setCurrentStep("fix");
      } else {
        setCurrentStep("confirm");
      }
    } else if (currentStep === "fix") {
      setCurrentStep("confirm");
    } else if (currentStep === "confirm") {
      handleImport();
    }
  };

  const handleBack = () => {
    if (currentStep === "review") {
      setCurrentStep("upload");
      // Reset state
      setValidProducts([]);
      setInvalidProducts([]);
      setTotalRows(0);
      setRemovedCount(0);
    } else if (currentStep === "fix") {
      setCurrentStep("review");
    } else if (currentStep === "confirm") {
      if (invalidProducts.length > 0) {
        setCurrentStep("fix");
      } else {
        setCurrentStep("review");
      }
    }
  };

  if (!canCreate) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          You don't have permission to create products.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Products"
        description="Import products from a CSV file"
        actions={
          <Button variant="outline" onClick={() => navigate("/products")}>
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

              // Skip fix step indicator if no errors
              if (step.id === "fix" && invalidProducts.length === 0 && currentStep !== "fix") {
                return null;
              }

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
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
                      {step.id === "fix" && invalidProducts.length > 0 && (
                        <span className="ml-1 text-orange-600">
                          ({invalidProducts.length})
                        </span>
                      )}
                    </span>
                  </div>
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
        {currentStep === "upload" && (
          <StepUpload
            onFileSelect={handleFileSelect}
            isProcessing={isProcessing}
            error={uploadError}
          />
        )}

        {currentStep === "review" && (
          <StepReview
            products={validProducts}
            onUpdateProduct={handleUpdateValidProduct}
          />
        )}

        {currentStep === "fix" && (
          <StepFixErrors
            products={invalidProducts}
            onUpdateProduct={handleUpdateInvalidProduct}
            onRemoveProduct={handleRemoveInvalidProduct}
          />
        )}

        {currentStep === "confirm" && (
          <StepConfirm
            validProducts={validProducts}
            skippedCount={invalidProducts.length + removedCount}
            isImporting={isImporting}
            importProgress={importProgress}
            importResult={importResult}
            onImport={handleImport}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={importResult ? () => navigate("/products") : handleBack}
              disabled={currentStep === "upload" && !importResult}
            >
              {importResult ? (
                "Go to Products"
              ) : (
                <>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </>
              )}
            </Button>

            {!importResult && (
              <Button
                onClick={handleNext}
                disabled={!canGoNext() || (currentStep === "upload")}
              >
                {currentStep === "confirm" ? (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Import {validProducts.length} Products
                  </>
                ) : currentStep === "fix" ? (
                  <>
                    Skip & Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
