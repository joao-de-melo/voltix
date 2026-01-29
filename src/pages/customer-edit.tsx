import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useOrganization } from "@/contexts/organization-context";
import { getCustomer } from "@/services/customers";
import { CustomerForm } from "@/components/features/customers";
import { PageHeader } from "@/components/shared/page-header";
import { PageLoader } from "@/components/shared/loading-spinner";
import type { Customer } from "@/types";

export function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const { organization } = useOrganization();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organization?.id || !id) return;

    const loadCustomer = async () => {
      setIsLoading(true);
      try {
        const data = await getCustomer(organization.id, id);
        setCustomer(data);
      } catch (error) {
        console.error("Error loading customer:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomer();
  }, [organization?.id, id]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!customer) {
    return <Navigate to="/customers" replace />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Customer"
        description={`Editing ${customer.name}`}
      />
      <CustomerForm customer={customer} />
    </div>
  );
}
