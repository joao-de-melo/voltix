import { useState } from "react";
import { Plus, Search, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getCategoryLabel } from "@/services/products";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Product, ProductCategory, QuoteSection } from "@/types";

interface ProductSelectorProps {
  products: Product[];
  sections: QuoteSection[];
  onAddProduct: (product: Product, sectionId?: string) => void;
}

export function ProductSelector({
  products,
  sections,
  onAddProduct,
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
  const [selectedSection, setSelectedSection] = useState<string>(sections[0]?.id || "");

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = (product: Product) => {
    onAddProduct(product, selectedSection);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>
            Search and add products to your quote
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Section Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Add to:</span>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as ProductCategory | "all")}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="solar_panel">Solar Panels</SelectItem>
                <SelectItem value="inverter">Inverters</SelectItem>
                <SelectItem value="battery">Batteries</SelectItem>
                <SelectItem value="mounting">Mounting Systems</SelectItem>
                <SelectItem value="labor">Labor & Services</SelectItem>
                <SelectItem value="accessory">Accessories</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Product List */}
          <ScrollArea className="h-[400px] rounded-md border">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {product.name}
                        </span>
                        <Badge variant="outline" className="shrink-0">
                          {getCategoryLabel(product.category)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{product.sku}</span>
                        {product.manufacturer && (
                          <>
                            <span>·</span>
                            <span>{product.manufacturer}</span>
                          </>
                        )}
                      </div>
                      {product.specs && "wattage" in product.specs && (
                        <div className="text-sm text-muted-foreground">
                          {(product.specs as any).wattage}W
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(product.unitPrice)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per {product.unit}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddProduct(product)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
