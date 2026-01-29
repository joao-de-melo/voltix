import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/organization-context";
import { getQuote } from "@/services/quotes";
import { QuoteBuilder } from "@/components/features/quotes/quote-builder";
import { PageLoader } from "@/components/shared/loading-spinner";
import type { Quote } from "@/types";

export function QuoteEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organization?.id || !id) return;

    const loadQuote = async () => {
      setIsLoading(true);
      try {
        const data = await getQuote(organization.id, id);
        if (data) {
          setQuote(data);
        } else {
          toast.error("Quote not found");
          navigate("/quotes");
        }
      } catch (error) {
        console.error("Error loading quote:", error);
        toast.error("Failed to load quote");
        navigate("/quotes");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuote();
  }, [organization?.id, id, navigate]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!quote) {
    return null;
  }

  return <QuoteBuilder quote={quote} />;
}
