import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, FileText, MoreHorizontal, Pencil, Trash2, Eye, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useOrganization } from "@/contexts/organization-context";
import { getQuotes, deleteQuote, getStatusVariant } from "@/services/quotes";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Quote, QuoteStatus } from "@/types";

export function QuoteList() {
  const { t } = useTranslation(['quotes', 'common']);
  const { organization, hasPermission } = useOrganization();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasPermission("quotes:create");
  const canEdit = hasPermission("quotes:edit");
  const canDelete = hasPermission("quotes:delete");

  useEffect(() => {
    if (!organization?.id) return;

    const loadQuotes = async () => {
      setIsLoading(true);
      try {
        const data = await getQuotes(organization.id);
        setQuotes(data);
        setFilteredQuotes(data);
      } catch (error) {
        console.error("Error loading quotes:", error);
        toast.error(t('common:errors.generic'));
      } finally {
        setIsLoading(false);
      }
    };

    loadQuotes();
  }, [organization?.id, t]);

  useEffect(() => {
    let filtered = quotes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.number.toLowerCase().includes(query) ||
          q.customerName?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((q) => q.status === statusFilter);
    }

    setFilteredQuotes(filtered);
  }, [searchQuery, statusFilter, quotes]);

  const handleDelete = async () => {
    if (!quoteToDelete || !organization?.id) return;

    setIsDeleting(true);
    try {
      await deleteQuote(organization.id, quoteToDelete.id);
      setQuotes((prev) => prev.filter((q) => q.id !== quoteToDelete.id));
      toast.success(t('quotes:delete.success'));
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast.error(t('quotes:delete.error'));
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('quotes:title')}
        description={t('quotes:description')}
        actions={
          canCreate && (
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
          )
        }
      />

      {quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('quotes:empty.title')}
          description={t('quotes:empty.description')}
          action={
            canCreate
              ? {
                  label: t('quotes:empty.action'),
                  onClick: () => (window.location.href = "/quotes/new"),
                }
              : undefined
          }
        />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('quotes:list.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as QuoteStatus | "all")}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('common:status.active')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common:buttons.filter')} - All</SelectItem>
                <SelectItem value="draft">{t('quotes:status.draft')}</SelectItem>
                <SelectItem value="pending_approval">{t('quotes:status.pending_approval')}</SelectItem>
                <SelectItem value="approved">{t('quotes:status.approved')}</SelectItem>
                <SelectItem value="sent">{t('quotes:status.sent')}</SelectItem>
                <SelectItem value="viewed">{t('quotes:status.viewed')}</SelectItem>
                <SelectItem value="accepted">{t('quotes:status.accepted')}</SelectItem>
                <SelectItem value="rejected">{t('quotes:status.rejected')}</SelectItem>
                <SelectItem value="expired">{t('quotes:status.expired')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quotes Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('quotes:list.columns.number')}</TableHead>
                  <TableHead>{t('quotes:list.columns.customer')}</TableHead>
                  <TableHead>{t('quotes:list.columns.status')}</TableHead>
                  <TableHead className="text-right">{t('quotes:list.columns.total')}</TableHead>
                  <TableHead>{t('quotes:list.columns.createdAt')}</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      {t('common:empty.noResults')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/quotes/${quote.id}`}
                          className="hover:underline"
                        >
                          {quote.number}
                        </Link>
                      </TableCell>
                      <TableCell>{quote.customerName}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(quote.status)}>
                          {t(`quotes:status.${quote.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(quote.total)}
                      </TableCell>
                      <TableCell>
                        {formatDate(quote.createdAt.toDate())}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/quotes/${quote.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('quotes:viewQuote')}
                              </Link>
                            </DropdownMenuItem>
                            {canEdit && quote.status === "draft" && (
                              <DropdownMenuItem asChild>
                                <Link to={`/quotes/${quote.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t('common:buttons.edit')}
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {quote.status === "approved" && (
                              <DropdownMenuItem>
                                <Send className="mr-2 h-4 w-4" />
                                {t('quotes:actions.send')}
                              </DropdownMenuItem>
                            )}
                            {canDelete && quote.status === "draft" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setQuoteToDelete(quote);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('common:buttons.delete')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('quotes:delete.title')}
        description={t('quotes:delete.description')}
        confirmLabel={t('common:buttons.delete')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
