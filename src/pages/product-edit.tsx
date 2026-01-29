import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useOrganization } from "@/contexts/organization-context";
import { getProduct } from "@/services/products";
import { ProductForm } from "@/components/features/products";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/shared/loading-spinner";
import type { Product } from "@/types";

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const { organization } = useOrganization();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organization?.id || !id) return;

    const loadProduct = async () => {
      setIsLoading(true);
      try {
        const data = await getProduct(organization.id, id);
        setProduct(data);
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [organization?.id, id]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!product) {
    return <Navigate to="/products" replace />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Product"
        description={`Editing ${product.name}`}
      />
      <ProductForm product={product} />
    </div>
  );
}
