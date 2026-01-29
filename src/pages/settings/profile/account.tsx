import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { updateProfile } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { auth } from "@/lib/firebase/config";
import { docs, updateDocument } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const accountSchema = z.object({
  displayName: z.string().min(2),
});

type AccountFormData = z.infer<typeof accountSchema>;

export function AccountSettingsPage() {
  const { t } = useTranslation(["settings", "common"]);
  const { user, firebaseUser, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      displayName: user?.displayName || "",
    },
  });

  const onSubmit = async (data: AccountFormData) => {
    if (!firebaseUser || !user) return;

    setIsSubmitting(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: data.displayName,
        });
      }

      await updateDocument(docs.user(firebaseUser.uid), {
        displayName: data.displayName,
      });

      await refreshUser();
      toast.success(t("settings:account.save.success"));
    } catch (error) {
      console.error("Error updating account:", error);
      toast.error(t("settings:account.save.error"));
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
              <CardTitle>{t("settings:account.personalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings:account.displayName")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>{t("settings:account.email")}</Label>
                <Input value={firebaseUser?.email || ""} disabled />
                <p className="text-sm text-muted-foreground">
                  {t("settings:account.emailCannotBeChanged")}
                </p>
              </div>
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
