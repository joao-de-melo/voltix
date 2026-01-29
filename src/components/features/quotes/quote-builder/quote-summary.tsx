import { Sun, Battery, Zap, User } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Customer, QuoteSystemSummary, QuoteContactInfo } from "@/types";

interface QuoteSummaryProps {
  customer: Customer | null;
  contactInfo?: QuoteContactInfo;
  totals: {
    subtotal: number;
    totalDiscount: number;
    taxAmount: number;
    total: number;
  };
  systemSummary: Partial<QuoteSystemSummary>;
}

export function QuoteSummary({
  customer,
  contactInfo,
  totals,
  systemSummary,
}: QuoteSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Customer Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customer ? (
            <div className="text-sm">
              <div className="font-medium">{customer.name}</div>
              <div className="text-muted-foreground">{customer.email}</div>
            </div>
          ) : contactInfo?.name ? (
            <div className="text-sm">
              <div className="font-medium">{contactInfo.name}</div>
              {contactInfo.company && (
                <div className="text-muted-foreground">{contactInfo.company}</div>
              )}
              {contactInfo.email && (
                <div className="text-muted-foreground">{contactInfo.email}</div>
              )}
              {contactInfo.phone && (
                <div className="text-muted-foreground">{contactInfo.phone}</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No customer selected
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Summary */}
      {(systemSummary.totalPanels || 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sun className="h-4 w-4" />
              System Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(systemSummary.totalPanels || 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Solar Panels
                </span>
                <span className="font-medium">
                  {systemSummary.totalPanels} panels
                </span>
              </div>
            )}

            {(systemSummary.totalKwp || 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Total Capacity
                </span>
                <span className="font-medium">
                  {formatNumber(systemSummary.totalKwp || 0)} kWp
                </span>
              </div>
            )}

            {(systemSummary.inverterCapacityKw || 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Inverter
                </span>
                <span className="font-medium">
                  {formatNumber(systemSummary.inverterCapacityKw || 0)} kW
                </span>
              </div>
            )}

            {(systemSummary.batteryCapacityKwh || 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  Battery Storage
                </span>
                <span className="font-medium">
                  {formatNumber(systemSummary.batteryCapacityKwh || 0)} kWh
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Price Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Price Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>

          {totals.totalDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(totals.totalDiscount)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">IVA</span>
            <span>{formatCurrency(totals.taxAmount)}</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold">
              {formatCurrency(totals.total)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
