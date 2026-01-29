import { useState } from "react";
import { AlertTriangle, Pencil, Check, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VALID_CATEGORIES, getCategoryLabel } from "@/services/product-import";
import type { ValidatedProduct } from "@/services/product-import";

interface StepFixErrorsProps {
  products: ValidatedProduct[];
  onUpdateProduct: (index: number, product: ValidatedProduct) => void;
  onRemoveProduct: (index: number) => void;
}

export function StepFixErrors({
  products,
  onUpdateProduct,
  onRemoveProduct,
}: StepFixErrorsProps) {
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
            <Check className="mx-auto h-12 w-12 text-emerald-600 mb-4" />
            <p className="text-lg font-medium">No errors to fix!</p>
            <p className="text-sm text-muted-foreground">
              All products passed validation. You can proceed to import.
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
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Products with Errors ({products.length})
          </CardTitle>
          <CardDescription>
            These products have validation errors. Fix them to include in the import, or remove them to skip.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {products.map((item, index) => (
              <AccordionItem key={item.rowNumber} value={`item-${item.rowNumber}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Badge variant="outline" className="font-mono">
                      Row {item.rowNumber}
                    </Badge>
                    <span className="font-medium">
                      {item.product.name || "(No name)"}
                    </span>
                    <Badge variant="destructive" className="ml-auto mr-4">
                      {item.errors.length} error{item.errors.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Errors List */}
                    <div className="rounded-lg border border-orange-300 bg-orange-100 p-3 dark:border-orange-700 dark:bg-orange-950">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
                        Validation Errors:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {item.errors.map((error, errIndex) => (
                          <li
                            key={errIndex}
                            className="text-sm text-orange-800 dark:text-orange-200"
                          >
                            <span className="font-medium">{error.field}:</span> {error.message}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    {/* Edit Form */}
                    {editingIndex === index && editingProduct ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${index}`}>Name *</Label>
                            <Input
                              id={`name-${index}`}
                              value={editingProduct.product.name}
                              onChange={(e) => handleFieldChange("name", e.target.value)}
                              className={item.errors.some((e) => e.field === "name") ? "border-red-500" : ""}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`sku-${index}`}>SKU *</Label>
                            <Input
                              id={`sku-${index}`}
                              value={editingProduct.product.sku}
                              onChange={(e) => handleFieldChange("sku", e.target.value)}
                              className={item.errors.some((e) => e.field === "sku") ? "border-red-500" : ""}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`category-${index}`}>Category *</Label>
                            <Select
                              value={editingProduct.product.category}
                              onValueChange={(v) => handleFieldChange("category", v)}
                            >
                              <SelectTrigger
                                id={`category-${index}`}
                                className={item.errors.some((e) => e.field === "category") ? "border-red-500" : ""}
                              >
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {VALID_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {getCategoryLabel(cat)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`unit-${index}`}>Unit *</Label>
                            <Input
                              id={`unit-${index}`}
                              value={editingProduct.product.unit}
                              onChange={(e) => handleFieldChange("unit", e.target.value)}
                              className={item.errors.some((e) => e.field === "unit") ? "border-red-500" : ""}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`price-${index}`}>Unit Price *</Label>
                            <Input
                              id={`price-${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingProduct.product.unitPrice}
                              onChange={(e) => handleFieldChange("unitPrice", parseFloat(e.target.value) || 0)}
                              className={item.errors.some((e) => e.field === "unitPrice") ? "border-red-500" : ""}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`tax-${index}`}>Tax Rate (%) *</Label>
                            <Input
                              id={`tax-${index}`}
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={editingProduct.product.taxRate}
                              onChange={(e) => handleFieldChange("taxRate", parseFloat(e.target.value) || 0)}
                              className={item.errors.some((e) => e.field === "taxRate") ? "border-red-500" : ""}
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor={`desc-${index}`}>Description</Label>
                            <Input
                              id={`desc-${index}`}
                              value={editingProduct.product.description || ""}
                              onChange={(e) => handleFieldChange("description", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`manufacturer-${index}`}>Manufacturer</Label>
                            <Input
                              id={`manufacturer-${index}`}
                              value={editingProduct.product.manufacturer || ""}
                              onChange={(e) => handleFieldChange("manufacturer", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`model-${index}`}>Model</Label>
                            <Input
                              id={`model-${index}`}
                              value={editingProduct.product.model || ""}
                              onChange={(e) => handleFieldChange("model", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveEdit}>
                            <Check className="mr-2 h-4 w-4" />
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Read-only view */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
                            <p className="text-sm">{item.product.name || "-"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">SKU</p>
                            <p className="text-sm font-mono">{item.product.sku || "-"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Category</p>
                            <p className="text-sm">
                              {item.product.category ? getCategoryLabel(item.product.category) : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Unit Price</p>
                            <p className="text-sm">{item.product.unitPrice}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Unit</p>
                            <p className="text-sm">{item.product.unit || "-"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Tax Rate</p>
                            <p className="text-sm">{item.product.taxRate}%</p>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            className="text-destructive"
                            onClick={() => onRemoveProduct(index)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                          <Button variant="outline" onClick={() => handleStartEdit(index)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
