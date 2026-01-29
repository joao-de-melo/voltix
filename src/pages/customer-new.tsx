import { CustomerForm } from "@/components/features/customers";
import { PageHeader } from "@/components/shared/page-header";

export function CustomerNewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Customer"
        description="Add a new customer to your database"
      />
      <CustomerForm />
    </div>
  );
}
