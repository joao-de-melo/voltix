import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Users,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import { collections, getDocuments, orderBy, limit } from "@/lib/firebase/firestore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusVariant } from "@/services/quotes";
import type { Quote, Customer } from "@/types";

interface DashboardStats {
  totalQuotes: number;
  pendingQuotes: number;
  totalCustomers: number;
  totalRevenue: number;
}

export function DashboardPage() {
  const { t } = useTranslation(['quotes', 'common']);
  const { organization } = useOrganization();
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotes: 0,
    pendingQuotes: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  });
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organization?.id) return;

    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [quotes, customers] = await Promise.all([
          getDocuments<Quote>(
            collections.quotes(organization.id),
            orderBy("createdAt", "desc"),
            limit(50)
          ),
          getDocuments<Customer>(collections.customers(organization.id)),
        ]);

        const pendingQuotes = quotes.filter(
          (q) => q.status === "sent" || q.status === "pending_approval"
        );
        const acceptedQuotes = quotes.filter((q) => q.status === "accepted");
        const totalRevenue = acceptedQuotes.reduce((sum, q) => sum + q.total, 0);

        setStats({
          totalQuotes: quotes.length,
          pendingQuotes: pendingQuotes.length,
          totalCustomers: customers.length,
          totalRevenue,
        });

        setRecentQuotes(quotes.slice(0, 5));
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [organization?.id]);

  const getStatusBadge = (status: Quote["status"]) => {
    const variant = getStatusVariant(status);
    return <Badge variant={variant}>{t(`quotes:status.${status}`)}</Badge>;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('common:nav.dashboard')}
        description={t('quotes:dashboard.welcome', { organization: organization?.name })}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/quotes/quick">
                <Sparkles className="mr-2 h-4 w-4" />
                {t('quotes:quickQuote')}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/quotes/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('quotes:newQuote')}
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('quotes:dashboard.totalQuotes')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalQuotes}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('quotes:dashboard.pendingQuotes')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.pendingQuotes}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('quotes:dashboard.totalCustomers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('quotes:dashboard.totalRevenue')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('quotes:dashboard.recentQuotes')}</CardTitle>
            <CardDescription>
              {t('quotes:dashboard.recentActivity')}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/quotes">
              {t('common:buttons.viewAll')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : recentQuotes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('quotes:dashboard.noQuotes')}
            </div>
          ) : (
            <div className="space-y-4">
              {recentQuotes.map((quote) => (
                <Link
                  key={quote.id}
                  to={`/quotes/${quote.id}`}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">
                      {quote.number} - {quote.customerName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(quote.total)} • {formatDate(quote.createdAt.toDate())}
                    </div>
                  </div>
                  {getStatusBadge(quote.status)}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
