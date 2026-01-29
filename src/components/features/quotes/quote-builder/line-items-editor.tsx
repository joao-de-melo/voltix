import { useState } from "react";
import { Trash2, GripVertical, Pencil, Plus, ChevronDown, ChevronUp, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { QuoteSection, QuoteLineItem, LineItemDiscount } from "@/types";

interface LineItemsEditorProps {
  sections: QuoteSection[];
  onUpdateItem: (sectionId: string, itemId: string, updates: Partial<QuoteLineItem>) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onAddSection: () => void;
  onRemoveSection: (sectionId: string) => void;
  onRenameSection: (sectionId: string, name: string) => void;
}

export function LineItemsEditor({
  sections,
  onUpdateItem,
  onRemoveItem,
  onAddSection,
  onRemoveSection,
  onRenameSection,
}: LineItemsEditorProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    sections.map((s) => s.id)
  );
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState("");
  const [discountDialog, setDiscountDialog] = useState<{
    sectionId: string;
    itemId: string;
    discount: LineItemDiscount | null;
  } | null>(null);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const startEditingSection = (section: QuoteSection) => {
    setEditingSectionId(section.id);
    setEditingSectionName(section.name);
  };

  const saveSection = () => {
    if (editingSectionId && editingSectionName.trim()) {
      onRenameSection(editingSectionId, editingSectionName.trim());
    }
    setEditingSectionId(null);
    setEditingSectionName("");
  };

  const openDiscountDialog = (
    sectionId: string,
    item: QuoteLineItem
  ) => {
    setDiscountDialog({
      sectionId,
      itemId: item.id,
      discount: item.discount,
    });
    setDiscountType(item.discount?.type || "percentage");
    setDiscountValue(item.discount?.value.toString() || "");
  };

  const applyDiscount = () => {
    if (!discountDialog) return;

    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      onUpdateItem(discountDialog.sectionId, discountDialog.itemId, {
        discount: null,
      });
    } else {
      onUpdateItem(discountDialog.sectionId, discountDialog.itemId, {
        discount: {
          type: discountType,
          value,
          amount: 0, // Will be calculated
        },
      });
    }
    setDiscountDialog(null);
  };

  const removeDiscount = () => {
    if (!discountDialog) return;
    onUpdateItem(discountDialog.sectionId, discountDialog.itemId, {
      discount: null,
    });
    setDiscountDialog(null);
  };

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Collapsible
          key={section.id}
          open={expandedSections.includes(section.id)}
          onOpenChange={() => toggleSection(section.id)}
        >
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {expandedSections.includes(section.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  {editingSectionId === section.id ? (
                    <Input
                      value={editingSectionName}
                      onChange={(e) => setEditingSectionName(e.target.value)}
                      onBlur={saveSection}
                      onKeyDown={(e) => e.key === "Enter" && saveSection()}
                      className="h-8 w-48"
                      autoFocus
                    />
                  ) : (
                    <CardTitle
                      className="text-base cursor-pointer hover:text-primary"
                      onClick={() => startEditingSection(section)}
                    >
                      {section.name}
                      <Pencil className="inline-block ml-2 h-3 w-3 opacity-50" />
                    </CardTitle>
                  )}

                  <span className="text-sm text-muted-foreground">
                    ({section.items.length} items)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {formatCurrency(section.subtotal)}
                  </span>
                  {sections.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveSection(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CollapsibleContent>
              <CardContent className="pt-0">
                {section.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No items in this section. Use "Add Product" to add items.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="text-muted-foreground cursor-move">
                          <GripVertical className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {item.name}
                              </div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {item.description}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => onRemoveItem(section.id, item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Qty:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  onUpdateItem(section.id, item.id, {
                                    quantity: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="h-8 w-20"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Price:</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  onUpdateItem(section.id, item.id, {
                                    unitPrice: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="h-8 w-28"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Tax:</Label>
                              <Select
                                value={item.taxRate.toString()}
                                onValueChange={(v) =>
                                  onUpdateItem(section.id, item.id, {
                                    taxRate: parseFloat(v),
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">0%</SelectItem>
                                  <SelectItem value="6">6%</SelectItem>
                                  <SelectItem value="13">13%</SelectItem>
                                  <SelectItem value="23">23%</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDiscountDialog(section.id, item)}
                              className="h-8"
                            >
                              <Percent className="h-3 w-3 mr-1" />
                              {item.discount
                                ? `${item.discount.value}${
                                    item.discount.type === "percentage" ? "%" : "€"
                                  }`
                                : "Discount"}
                            </Button>

                            <div className="ml-auto text-right">
                              <div className="font-medium">
                                {formatCurrency(item.total)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(item.subtotal)} + {formatCurrency(item.taxAmount)} IVA
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}

      <Button variant="outline" onClick={onAddSection}>
        <Plus className="mr-2 h-4 w-4" />
        Add Section
      </Button>

      {/* Discount Dialog */}
      <Dialog open={!!discountDialog} onOpenChange={() => setDiscountDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>
              Add a percentage or fixed amount discount to this item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Select
                value={discountType}
                onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (€)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step={discountType === "percentage" ? "1" : "0.01"}
                min="0"
                max={discountType === "percentage" ? "100" : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "10" : "50.00"}
              />
            </div>
          </div>
          <DialogFooter>
            {discountDialog?.discount && (
              <Button variant="outline" onClick={removeDiscount}>
                Remove Discount
              </Button>
            )}
            <Button onClick={applyDiscount}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
