import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Pencil, ArrowLeft, FileText, User, Calendar, DollarSign } from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import { getQuote, getStatusVariant } from "@/services/quotes";
import { formatCurrency } from "@/lib/utils";
import { fromTimestamp } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/shared/loading-spinner";
import type { Quote } from "@/types";

export function QuoteViewPage() {
  const { t } = useTranslation(['quotes', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organization, hasPermission } = useOrganization();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canEdit = hasPermission("quotes:edit");

  useEffect(() => {
    if (!organization?.id || !id) return;

    const loadQuote = async () => {
      setIsLoading(true);
      try {
        const data = await getQuote(organization.id, id);
        if (data) {
          setQuote(data);
        } else {
          toast.error(t('common:errors.notFound'));
          navigate("/quotes");
        }
      } catch (error) {
        console.error("Error loading quote:", error);
        toast.error(t('common:errors.generic'));
        navigate("/quotes");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuote();
  }, [organization?.id, id, navigate, t]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!quote) {
    return null;
  }

  const validUntilDate = quote.validUntil ? fromTimestamp(quote.validUntil) : null;
  const createdDate = quote.createdAt ? fromTimestamp(quote.createdAt) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('quotes:title')} ${quote.number}`}
        description={quote.customerName || quote.contactInfo?.name || t('common:empty.noData')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/quotes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common:buttons.back')}
              </Link>
            </Button>
            {canEdit && (
              <Button asChild>
                <Link to={`/quotes/${quote.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('common:buttons.edit')}
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          {quote.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {section.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {section.items.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t('common:empty.noData')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('quotes:lineItems.product')}</TableHead>
                        <TableHead className="text-right">{t('quotes:lineItems.quantity')}</TableHead>
                        <TableHead className="text-right">{t('quotes:lineItems.unitPrice')}</TableHead>
                        <TableHead className="text-right">{t('quotes:lineItems.subtotal')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Notes */}
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t('quotes:form.notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('quotes:list.columns.status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusVariant(quote.status)}>
                {t(`quotes:status.${quote.status}`)}
              </Badge>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                {t('quotes:list.columns.customer')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">
                {quote.customerName || quote.contactInfo?.name || t('common:empty.noData')}
              </p>
              {quote.contactInfo?.email && (
                <p className="text-muted-foreground">{quote.contactInfo.email}</p>
              )}
              {quote.contactInfo?.phone && (
                <p className="text-muted-foreground">{quote.contactInfo.phone}</p>
              )}
              {quote.contactInfo?.company && (
                <p className="text-muted-foreground">{quote.contactInfo.company}</p>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                {t('quotes:list.columns.createdAt')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {createdDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('quotes:list.columns.createdAt')}</span>
                  <span>{format(createdDate, "MMM d, yyyy")}</span>
                </div>
              )}
              {validUntilDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('quotes:list.columns.validUntil')}</span>
                  <span>{format(validUntilDate, "MMM d, yyyy")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Summary */}
          {quote.systemSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('quotes:systemSummary.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {quote.systemSummary.totalPanels > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('quotes:systemSummary.totalPanels')}</span>
                    <span>{quote.systemSummary.totalPanels}</span>
                  </div>
                )}
                {quote.systemSummary.totalKwp > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('quotes:systemSummary.totalPower')}</span>
                    <span>{quote.systemSummary.totalKwp.toFixed(2)} kWp</span>
                  </div>
                )}
                {quote.systemSummary.inverterCapacityKw > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('quotes:systemSummary.inverterCapacity')}</span>
                    <span>{quote.systemSummary.inverterCapacityKw} kW</span>
                  </div>
                )}
                {quote.systemSummary.batteryCapacityKwh > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('quotes:systemSummary.batteryCapacity')}</span>
                    <span>{quote.systemSummary.batteryCapacityKwh} kWh</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                {t('quotes:totals.total')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('quotes:totals.subtotal')}</span>
                <span>{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('quotes:totals.discount')}</span>
                  <span>-{formatCurrency(quote.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('quotes:totals.tax')}</span>
                <span>{formatCurrency(quote.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-medium text-base pt-2 border-t">
                <span>{t('quotes:totals.total')}</span>
                <span>{formatCurrency(quote.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
