import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Package, MoreHorizontal, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useOrganization } from "@/contexts/organization-context";
import { getProducts, deleteProduct } from "@/services/products";
import { formatCurrency } from "@/lib/utils";
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
import type { Product, ProductCategory } from "@/types";

export function ProductList() {
  const { t } = useTranslation(['products', 'common']);
  const { organization, hasPermission } = useOrganization();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasPermission("products:create");
  const canEdit = hasPermission("products:edit");
  const canDelete = hasPermission("products:delete");

  useEffect(() => {
    if (!organization?.id) return;

    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const data = await getProducts(organization.id);
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error(t('common:errors.generic'));
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [organization?.id, t]);

  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.manufacturer?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, products]);

  const handleDelete = async () => {
    if (!productToDelete || !organization?.id) return;

    setIsDeleting(true);
    try {
      await deleteProduct(organization.id, productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      toast.success(t('products:delete.success'));
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(t('products:delete.error'));
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('products:title')}
        description={t('products:description')}
        actions={
          canCreate && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/products/import">
                  <Upload className="mr-2 h-4 w-4" />
                  {t('common:buttons.import')}
                </Link>
              </Button>
              <Button asChild>
                <Link to="/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('products:addProduct')}
                </Link>
              </Button>
            </div>
          )
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('products:empty.title')}
          description={t('products:empty.description')}
          action={
            canCreate
              ? {
                  label: t('products:empty.action'),
                  onClick: () => (window.location.href = "/products/new"),
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
                placeholder={t('products:list.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as ProductCategory | "all")}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t('products:form.categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common:buttons.filter')} - All</SelectItem>
                <SelectItem value="solar_panel">{t('products:categories.solar_panel')}</SelectItem>
                <SelectItem value="inverter">{t('products:categories.inverter')}</SelectItem>
                <SelectItem value="battery">{t('products:categories.battery')}</SelectItem>
                <SelectItem value="mounting">{t('products:categories.mounting')}</SelectItem>
                <SelectItem value="labor">Labor & Services</SelectItem>
                <SelectItem value="accessory">{t('products:categories.accessory')}</SelectItem>
                <SelectItem value="other">{t('products:categories.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('products:list.columns.name')}</TableHead>
                  <TableHead>{t('products:list.columns.sku')}</TableHead>
                  <TableHead>{t('products:list.columns.category')}</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead className="text-right">{t('products:list.columns.unitPrice')}</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      {t('common:empty.noResults')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/products/${product.id}`}
                          className="hover:underline"
                        >
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.sku}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(`products:categories.${product.category}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.manufacturer || "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.unitPrice)} / {product.unit}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && (
                              <DropdownMenuItem asChild>
                                <Link to={`/products/${product.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t('common:buttons.edit')}
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setProductToDelete(product);
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
        title={t('products:delete.title')}
        description={t('products:delete.description')}
        confirmLabel={t('common:buttons.delete')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
