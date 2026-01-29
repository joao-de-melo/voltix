import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useOrganization } from "@/contexts/organization-context";
import { docs, updateDocument } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional()
    .or(z.literal("")),
  headerText: z.string().optional(),
  footerText: z.string().optional(),
  termsAndConditions: z.string().optional(),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

export function BrandingSettingsPage() {
  const { t } = useTranslation(["settings", "common"]);
  const { organization } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primaryColor: organization?.branding?.primaryColor || "#3b82f6",
      secondaryColor: organization?.branding?.secondaryColor || "",
      headerText: organization?.branding?.headerText || "",
      footerText: organization?.branding?.footerText || "",
      termsAndConditions: organization?.branding?.termsAndConditions || "",
    },
  });

  const onSubmit = async (data: BrandingFormData) => {
    if (!organization?.id) return;

    setIsSubmitting(true);
    try {
      await updateDocument(docs.organization(organization.id), {
        branding: {
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor || undefined,
          headerText: data.headerText || undefined,
          footerText: data.footerText || undefined,
          termsAndConditions: data.termsAndConditions || undefined,
        },
      });

      toast.success(t("settings:branding.save.success"));
    } catch (error) {
      console.error("Error updating branding:", error);
      toast.error(t("settings:branding.save.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings:branding.colors")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings:branding.primaryColor")}</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            {...field}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input {...field} placeholder="#3b82f6" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {t("settings:branding.primaryColorDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings:branding.secondaryColor")}</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={field.value || "#64748b"}
                            onChange={field.onChange}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input {...field} placeholder="#64748b" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {t("settings:branding.secondaryColorDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings:branding.quoteCustomization")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="headerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings:branding.headerText")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={2}
                        placeholder={t("settings:branding.headerTextPlaceholder")}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("settings:branding.headerTextDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="footerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings:branding.footerText")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={2}
                        placeholder={t("settings:branding.footerTextPlaceholder")}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("settings:branding.footerTextDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="termsAndConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings:branding.termsAndConditions")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={6}
                        placeholder={t(
                          "settings:branding.termsAndConditionsPlaceholder"
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("settings:branding.termsAndConditionsDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("common:buttons.saving")
                : t("common:buttons.saveChanges")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
