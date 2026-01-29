import {
  Sun,
  Zap,
  Cable,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { estimateAnnualSavings, estimatePaybackYears } from "@/services/system-sizing";
import type {
  SystemSizingResult,
  ProductSelectionResult,
  Customer,
  Site,
  QuoteContactInfo,
} from "@/types";

interface StepReviewProps {
  customer: Customer | null;
  contactInfo?: QuoteContactInfo;
  site: Site | null;
  sizingResult: SystemSizingResult;
  productSelection: ProductSelectionResult;
  totalPrice: number;
}

export function StepReview({
  customer,
  contactInfo,
  site,
  sizingResult,
  productSelection,
  totalPrice,
}: StepReviewProps) {
  const annualSavings = estimateAnnualSavings(
    sizingResult.estimatedAnnualProductionKwh
  );
  const paybackYears = estimatePaybackYears(totalPrice, annualSavings);

  const equipmentProducts = productSelection.selectedProducts.filter(
    (p) => p.section === "equipment"
  );
  const installationProducts = productSelection.selectedProducts.filter(
    (p) => p.section === "installation"
  );
  const accessoryProducts = productSelection.selectedProducts.filter(
    (p) => p.section === "accessories"
  );

  const calculateSectionTotal = (
    products: typeof productSelection.selectedProducts
  ) =>
    products.reduce((sum, p) => sum + p.product.unitPrice * p.quantity, 0);

  return (
    <div className="space-y-6">
      {/* System Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            System Summary
          </CardTitle>
          <CardDescription>
            Recommended solar installation{customer?.name ? ` for ${customer.name}` : contactInfo?.name ? ` for ${contactInfo.name}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold text-primary">
                {sizingResult.recommendedKwp}
              </div>
              <div className="text-sm text-muted-foreground">kWp System</div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold">
                {sizingResult.numberOfPanels}
              </div>
              <div className="text-sm text-muted-foreground">
                Solar Panels ({sizingResult.panelWattage}W)
              </div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold">
                {sizingResult.maxInverterKw}
              </div>
              <div className="text-sm text-muted-foreground">kW Inverter</div>
            </div>
            {sizingResult.batteryKwh && (
              <div className="rounded-lg border p-4 text-center">
                <div className="text-3xl font-bold">
                  {sizingResult.batteryKwh}
                </div>
                <div className="text-sm text-muted-foreground">kWh Battery</div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Production & Savings */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium">
                  {sizingResult.estimatedAnnualProductionKwh.toLocaleString()} kWh
                </div>
                <div className="text-sm text-muted-foreground">
                  Annual Production
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium">
                  {formatCurrency(annualSavings)}/year
                </div>
                <div className="text-sm text-muted-foreground">
                  Est. Savings
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900">
                <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="font-medium">
                  {paybackYears === Infinity ? "N/A" : `${paybackYears} years`}
                </div>
                <div className="text-sm text-muted-foreground">
                  Est. Payback
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {productSelection.warnings.length > 0 && (
        <Card className="border-orange-300 bg-orange-100 dark:border-orange-700 dark:bg-orange-950">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <AlertTriangle className="h-5 w-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {productSelection.warnings.map((warning, index) => (
                <li
                  key={index}
                  className="text-sm font-medium text-orange-800 dark:text-orange-200"
                >
                  {warning}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm font-medium text-orange-900 dark:text-orange-100">
              Some products may need to be added manually after quote creation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Equipment Section */}
      {equipmentProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipmentProducts.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div className="font-medium">{item.product.name}</div>
                      {item.product.description && (
                        <div className="text-sm text-muted-foreground">
                          {item.product.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity} {item.product.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.product.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.product.unitPrice * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="font-medium">
                    Equipment Subtotal
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(calculateSectionTotal(equipmentProducts))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Installation Section */}
      {installationProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Installation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installationProducts.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div className="font-medium">{item.product.name}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity} {item.product.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.product.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.product.unitPrice * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="font-medium">
                    Installation Subtotal
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(calculateSectionTotal(installationProducts))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Accessories Section */}
      {accessoryProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cable className="h-5 w-5" />
              Accessories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessoryProducts.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div className="font-medium">{item.product.name}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity} {item.product.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.product.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.product.unitPrice * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="font-medium">
                    Accessories Subtotal
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(calculateSectionTotal(accessoryProducts))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Total */}
      <Card className="bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium">Total (excl. tax)</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(totalPrice)}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            This is an estimated price. Final quote may vary based on site
            assessment and product availability.
          </p>
        </CardContent>
      </Card>

      {/* Customer & Site Info */}
      {(customer || contactInfo || site) && (
        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {customer && (
                <div>
                  <h4 className="font-medium mb-1">Customer</h4>
                  <div className="text-sm text-muted-foreground">
                    <div>{customer.name}</div>
                    <div>{customer.email}</div>
                    {customer.phone && <div>{customer.phone}</div>}
                  </div>
                </div>
              )}
              {!customer && contactInfo && (
                <div>
                  <h4 className="font-medium mb-1">Contact</h4>
                  <div className="text-sm text-muted-foreground">
                    <div>{contactInfo.name}</div>
                    {contactInfo.email && <div>{contactInfo.email}</div>}
                    {contactInfo.phone && <div>{contactInfo.phone}</div>}
                    {contactInfo.company && <div>{contactInfo.company}</div>}
                  </div>
                </div>
              )}
              {site && (
                <div>
                  <h4 className="font-medium mb-1">Installation Site</h4>
                  <div className="text-sm text-muted-foreground">
                    <div>{site.name}</div>
                    <div>{site.address.street}</div>
                    <div>
                      {site.address.postalCode} {site.address.city}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
