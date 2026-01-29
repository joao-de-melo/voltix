import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { docs, updateDocument } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  locale: z.string(),
  emailNotifications: z.boolean(),
  quoteUpdates: z.boolean(),
  teamActivity: z.boolean(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

export function PreferencesSettingsPage() {
  const { t, i18n } = useTranslation(["settings", "common"]);
  const { user, firebaseUser, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: user?.preferences?.theme || "system",
      locale: user?.preferences?.locale || "pt",
      emailNotifications: user?.preferences?.notifications?.email ?? true,
      quoteUpdates: user?.preferences?.notifications?.quoteUpdates ?? true,
      teamActivity: user?.preferences?.notifications?.teamActivity ?? true,
    },
  });

  useEffect(() => {
    if (user?.preferences?.locale) {
      const lang = user.preferences.locale.split("-")[0];
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
    }
  }, [user?.preferences?.locale, i18n]);

  const onSubmit = async (data: PreferencesFormData) => {
    if (!firebaseUser || !user) return;

    setIsSubmitting(true);
    try {
      await updateDocument(docs.user(firebaseUser.uid), {
        preferences: {
          theme: data.theme,
          locale: data.locale,
          notifications: {
            email: data.emailNotifications,
            quoteUpdates: data.quoteUpdates,
            teamActivity: data.teamActivity,
          },
        },
      });

      const newLang = data.locale.split("-")[0];
      if (i18n.language !== newLang) {
        await i18n.changeLanguage(newLang);
      }

      await refreshUser();
      toast.success(t("settings:preferences.save.success"));
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error(t("settings:preferences.save.error"));
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
              <CardTitle>{t("settings:preferences.appearance")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings:preferences.theme")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">
                          {t("settings:preferences.themes.light")}
                        </SelectItem>
                        <SelectItem value="dark">
                          {t("settings:preferences.themes.dark")}
                        </SelectItem>
                        <SelectItem value="system">
                          {t("settings:preferences.themes.system")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings:preferences.languageRegion")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pt">
                          {t("settings:preferences.languages.pt")}
                        </SelectItem>
                        <SelectItem value="en">
                          {t("settings:preferences.languages.en")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings:preferences.notifications")}</CardTitle>
              <CardDescription>
                {t("settings:preferences.notificationsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>
                        {t("settings:preferences.emailNotifications")}
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {t("settings:preferences.emailNotificationsDescription")}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quoteUpdates"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>
                        {t("settings:preferences.quoteUpdates")}
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {t("settings:preferences.quoteUpdatesDescription")}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teamActivity"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>
                        {t("settings:preferences.teamActivity")}
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {t("settings:preferences.teamActivityDescription")}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
