import { ProductForm } from "@/components/features/products";
import { PageHeader } from "@/components/shared/page-header";

export function ProductNewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Product"
        description="Add a new product to your catalog"
      />
      <ProductForm />
    </div>
  );
}
