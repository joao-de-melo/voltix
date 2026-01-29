import { CheckCircle2, Package, AlertTriangle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ValidatedProduct } from "@/services/product-import";

interface StepConfirmProps {
  validProducts: ValidatedProduct[];
  skippedCount: number;
  isImporting: boolean;
  importProgress: number;
  importResult: { success: number; failed: number; errors: string[] } | null;
  onImport: () => void;
}

export function StepConfirm({
  validProducts,
  skippedCount,
  isImporting,
  importProgress,
  importResult,
}: StepConfirmProps) {
  if (importResult) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.failed === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              )}
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600">
                  {importResult.success}
                </div>
                <div className="text-sm text-muted-foreground">
                  Products Imported
                </div>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="text-3xl font-bold text-red-600">
                  {importResult.failed}
                </div>
                <div className="text-sm text-muted-foreground">
                  Failed
                </div>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="text-3xl font-bold text-muted-foreground">
                  {skippedCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Skipped
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-4 rounded-lg border border-red-300 bg-red-100 p-4 dark:border-red-700 dark:bg-red-950">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                  Import Errors:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-800 dark:text-red-200">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isImporting) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium mb-4">Importing Products...</p>
            <Progress value={importProgress} className="w-64 mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">
              {Math.round(importProgress)}% complete
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ready to Import
          </CardTitle>
          <CardDescription>
            Review the summary below and click "Import Products" to complete the process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-300 bg-emerald-100 p-4 dark:border-emerald-700 dark:bg-emerald-950">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                <div>
                  <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {validProducts.length}
                  </div>
                  <div className="text-sm text-emerald-800 dark:text-emerald-200">
                    Products to Import
                  </div>
                </div>
              </div>
            </div>

            {skippedCount > 0 && (
              <div className="rounded-lg border border-orange-300 bg-orange-100 p-4 dark:border-orange-700 dark:bg-orange-950">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {skippedCount}
                    </div>
                    <div className="text-sm text-orange-800 dark:text-orange-200">
                      Products Skipped
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {validProducts.length === 0 && (
            <div className="mt-4 rounded-lg border border-orange-300 bg-orange-100 p-4 dark:border-orange-700 dark:bg-orange-950">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                No products to import. Please go back and fix validation errors or upload a new file.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {validProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Products to Import</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {validProducts.map((item) => (
                  <div
                    key={item.rowNumber}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.product.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {item.product.unitPrice.toLocaleString("pt-PT", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        per {item.product.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
