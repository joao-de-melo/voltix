import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Users, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useOrganization } from "@/contexts/organization-context";
import { getCustomers, deleteCustomer, getStatusLabel, getStatusVariant } from "@/services/customers";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Customer, CustomerStatus } from "@/types";

export function CustomerList() {
  const { t } = useTranslation(['customers', 'common']);
  const { organization, hasPermission } = useOrganization();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasPermission("customers:create");
  const canEdit = hasPermission("customers:edit");
  const canDelete = hasPermission("customers:delete");

  useEffect(() => {
    if (!organization?.id) return;

    const loadCustomers = async () => {
      setIsLoading(true);
      try {
        const data = await getCustomers(organization.id);
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        console.error("Error loading customers:", error);
        toast.error(t('common:errors.generic'));
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, [organization?.id, t]);

  useEffect(() => {
    let filtered = customers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  }, [searchQuery, statusFilter, customers]);

  const handleDelete = async () => {
    if (!customerToDelete || !organization?.id) return;

    setIsDeleting(true);
    try {
      await deleteCustomer(organization.id, customerToDelete.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
      toast.success(t('customers:delete.success'));
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error(t('customers:delete.error'));
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('customers:title')}
        description={t('customers:description')}
        actions={
          canCreate && (
            <Button asChild>
              <Link to="/customers/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('customers:addCustomer')}
              </Link>
            </Button>
          )
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('customers:empty.title')}
          description={t('customers:empty.description')}
          action={
            canCreate
              ? {
                  label: t('customers:empty.action'),
                  onClick: () => (window.location.href = "/customers/new"),
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
                placeholder={t('customers:list.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as CustomerStatus | "all")}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder={t('common:status.active')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common:buttons.filter')} - All</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">{t('common:status.active')}</SelectItem>
                <SelectItem value="inactive">{t('common:status.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customers Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('customers:list.columns.name')}</TableHead>
                  <TableHead>{t('customers:list.columns.email')}</TableHead>
                  <TableHead>{t('customers:list.columns.phone')}</TableHead>
                  <TableHead>{t('quotes:list.columns.status')}</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      {t('common:empty.noResults')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="hover:underline"
                        >
                          {customer.name}
                        </Link>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(customer.status)}>
                          {getStatusLabel(customer.status)}
                        </Badge>
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
                              <Link to={`/customers/${customer.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('customers:customerDetails')}
                              </Link>
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem asChild>
                                <Link to={`/customers/${customer.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t('common:buttons.edit')}
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setCustomerToDelete(customer);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('common:buttons.delete')}
                              </DropdownMenuItem>
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
        title={t('customers:delete.title')}
        description={t('customers:delete.description')}
        confirmLabel={t('common:buttons.delete')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
