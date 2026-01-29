import { useTranslation } from "react-i18next";
import { useOrganization } from "@/contexts/organization-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function BillingSettingsPage() {
  const { t } = useTranslation(["settings"]);
  const { organization } = useOrganization();

  const subscription = organization?.subscription;
  const quotesUsed = subscription?.quotesUsed ?? 0;
  const quotesLimit = subscription?.quotesLimit ?? 10;
  const usagePercentage = quotesLimit > 0 ? (quotesUsed / quotesLimit) * 100 : 0;

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case "enterprise":
      case "professional":
        return "default";
      case "starter":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "trialing":
        return "secondary";
      case "past_due":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings:billing.currentPlan")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("settings:billing.plan")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getPlanBadgeVariant(subscription?.plan || "free")}>
                  {t(`settings:billing.plans.${subscription?.plan || "free"}`)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("settings:billing.status")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={getStatusBadgeVariant(subscription?.status || "active")}
                >
                  {t(`settings:billing.statuses.${subscription?.status || "active"}`)}
                </Badge>
              </div>
            </div>
          </div>

          {subscription?.currentPeriodEnd && (
            <div>
              <p className="text-sm text-muted-foreground">
                {t("settings:billing.renewsOn")}
              </p>
              <p className="text-sm font-medium">
                {subscription.currentPeriodEnd.toDate().toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings:billing.usage")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                {t("settings:billing.quotesUsed", {
                  used: quotesUsed,
                  limit: quotesLimit,
                })}
              </p>
              <p className="text-sm font-medium">{Math.round(usagePercentage)}%</p>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>

          {usagePercentage >= 80 && (
            <p className="text-sm text-amber-600">
              {t("settings:billing.usageWarning")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
