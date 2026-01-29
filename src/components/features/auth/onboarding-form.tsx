import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/auth-context";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Organization, Membership } from "@/types";

export function OnboardingForm() {
  const { t } = useTranslation(['auth', 'validation']);
  const navigate = useNavigate();
  const { firebaseUser, user, refreshMemberships } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const onboardingSchema = z.object({
    organizationName: z.string().min(2, t('validation:organization.nameMinLength', { count: 2 })),
    regionCode: z.string().min(2, t('validation:organization.regionRequired')),
    taxId: z.string().optional(),
  });

  type OnboardingFormData = z.infer<typeof onboardingSchema>;

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationName: "",
      regionCode: "PT",
      taxId: "",
    },
  });

  const onSubmit = async (data: OnboardingFormData) => {
    if (!firebaseUser) {
      toast.error(t('auth:onboarding.errors.notLoggedIn'));
      return;
    }

    setIsLoading(true);
    try {
      const orgId = crypto.randomUUID();
      const slug = slugify(data.organizationName);
      const displayName = user?.displayName || firebaseUser.displayName || "User";

      const organization: Omit<Organization, "id"> = {
        name: data.organizationName,
        slug,
        regionCode: data.regionCode,
        settings: {
          defaultTaxRate: 23,
          quotePrefix: "QT",
          quoteStartNumber: 1,
          quoteValidityDays: 30,
          currency: "EUR",
          taxId: data.taxId,
        },
        branding: {
          primaryColor: "#1e40af",
        },
        subscription: {
          plan: "free",
          status: "active",
          quotesUsed: 0,
          quotesLimit: 10,
        },
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      const membership: Omit<Membership, "id"> = {
        orgId,
        orgName: data.organizationName,
        userId: firebaseUser.uid,
        userEmail: firebaseUser.email!,
        userName: displayName,
        role: "owner",
        joinedAt: serverTimestamp() as any,
      };

      // Create organization
      await setDoc(doc(db, "organizations", orgId), organization);

      // Create membership in both locations
      await Promise.all([
        setDoc(
          doc(db, "organizations", orgId, "members", firebaseUser.uid),
          membership
        ),
        setDoc(
          doc(db, "users", firebaseUser.uid, "memberships", orgId),
          membership
        ),
      ]);

      // Update user's primary org
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        { primaryOrgId: orgId, updatedAt: serverTimestamp() },
        { merge: true }
      );

      await refreshMemberships();

      toast.success(t('auth:onboarding.success'));
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || t('auth:onboarding.errors.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('auth:onboarding.title')}</CardTitle>
        <CardDescription>
          {t('auth:onboarding.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:onboarding.organizationName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('auth:onboarding.organizationNamePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('auth:onboarding.organizationNameDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="regionCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:onboarding.region')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('auth:onboarding.regionPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PT">{t('auth:onboarding.regions.PT')}</SelectItem>
                      <SelectItem value="ES">{t('auth:onboarding.regions.ES')}</SelectItem>
                      <SelectItem value="FR">{t('auth:onboarding.regions.FR')}</SelectItem>
                      <SelectItem value="DE">{t('auth:onboarding.regions.DE')}</SelectItem>
                      <SelectItem value="IT">{t('auth:onboarding.regions.IT')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('auth:onboarding.regionDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:onboarding.taxId')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('auth:onboarding.taxIdPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('auth:onboarding.taxIdDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth:onboarding.creatingOrganization') : t('auth:onboarding.createOrganization')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
