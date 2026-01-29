import { useState } from "react";
import { CheckCircle2, Pencil, X, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getCategoryLabel, VALID_CATEGORIES } from "@/services/product-import";
import type { ValidatedProduct } from "@/services/product-import";

interface StepReviewProps {
  products: ValidatedProduct[];
  onUpdateProduct: (index: number, product: ValidatedProduct) => void;
}

export function StepReview({ products, onUpdateProduct }: StepReviewProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<ValidatedProduct | null>(null);

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingProduct({ ...products[index] });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingProduct(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingProduct) {
      onUpdateProduct(editingIndex, editingProduct);
      setEditingIndex(null);
      setEditingProduct(null);
    }
  };

  const handleFieldChange = (field: keyof ValidatedProduct["product"], value: string | number) => {
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        product: {
          ...editingProduct.product,
          [field]: value,
        },
      });
    }
  };

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No valid products to review</p>
            <p className="text-sm text-muted-foreground">
              All products have validation errors. Please fix them in the next step.
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
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Valid Products ({products.length})
          </CardTitle>
          <CardDescription>
            These products passed validation and are ready to import. You can edit them inline if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Row</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Tax %</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((item, index) => (
                  <TableRow key={item.rowNumber}>
                    {editingIndex === index && editingProduct ? (
                      <>
                        <TableCell className="font-mono text-sm">
                          {item.rowNumber}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editingProduct.product.name}
                            onChange={(e) => handleFieldChange("name", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editingProduct.product.sku}
                            onChange={(e) => handleFieldChange("sku", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={editingProduct.product.category}
                            onValueChange={(v) => handleFieldChange("category", v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VALID_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {getCategoryLabel(cat)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editingProduct.product.unitPrice}
                            onChange={(e) => handleFieldChange("unitPrice", parseFloat(e.target.value) || 0)}
                            className="h-8 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editingProduct.product.unit}
                            onChange={(e) => handleFieldChange("unit", e.target.value)}
                            className="h-8 w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editingProduct.product.taxRate}
                            onChange={(e) => handleFieldChange("taxRate", parseFloat(e.target.value) || 0)}
                            className="h-8 w-16 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={handleSaveEdit}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {item.rowNumber}
                        </TableCell>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell className="font-mono text-sm">{item.product.sku}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCategoryLabel(item.product.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.product.unitPrice)}
                        </TableCell>
                        <TableCell>{item.product.unit}</TableCell>
                        <TableCell className="text-right">{item.product.taxRate}%</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(index)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Re-export for use in import service
export { VALID_CATEGORIES, getCategoryLabel } from "@/services/product-import";
