import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { createInvitation, getInvitationUrl } from "@/services/invitations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import type { UserRole, Invitation } from "@/types";

const createInviteSchema = z.object({
  role: z.enum(["admin", "manager", "sales", "viewer"] as const),
  expirationDays: z.number().min(1).max(30),
});

type CreateInviteFormData = z.infer<typeof createInviteSchema>;

interface CreateInviteDialogProps {
  onInviteCreated?: (invitation: Invitation) => void;
}

export function CreateInviteDialog({ onInviteCreated }: CreateInviteDialogProps) {
  const { t } = useTranslation(["team", "common"]);
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<CreateInviteFormData>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: {
      role: "viewer",
      expirationDays: 7,
    },
  });

  const onSubmit = async (data: CreateInviteFormData) => {
    if (!organization?.id || !user) return;

    setIsSubmitting(true);
    try {
      const invitation = await createInvitation({
        orgId: organization.id,
        orgName: organization.name,
        role: data.role as UserRole,
        invitedBy: user.id,
        invitedByName: user.displayName,
        type: "link",
        expirationDays: data.expirationDays,
      });

      const url = getInvitationUrl(invitation.token);
      setCreatedInviteUrl(url);
      toast.success(t("team:createInvite.success"));
      onInviteCreated?.(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      toast.error(t("team:createInvite.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!createdInviteUrl) return;

    try {
      await navigator.clipboard.writeText(createdInviteUrl);
      setCopied(true);
      toast.success(t("team:copyLink.success"));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when dialog closes
      setCreatedInviteUrl(null);
      setCopied(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Link2 className="mr-2 h-4 w-4" />
          {t("team:createInvite.button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("team:createInvite.title")}</DialogTitle>
          <DialogDescription>
            {t("team:createInvite.description")}
          </DialogDescription>
        </DialogHeader>

        {createdInviteUrl ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={createdInviteUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t("common:buttons.close")}
              </Button>
              <Button
                onClick={() => {
                  setCreatedInviteUrl(null);
                  form.reset();
                }}
              >
                {t("team:createInvite.button")}
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("team:createInvite.role")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("team:createInvite.rolePlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex flex-col">
                            <span>{t("team:roles.admin")}</span>
                            <span className="text-xs text-muted-foreground">
                              {t("team:roleDescriptions.admin")}
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="manager">
                          <div className="flex flex-col">
                            <span>{t("team:roles.manager")}</span>
                            <span className="text-xs text-muted-foreground">
                              {t("team:roleDescriptions.manager")}
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="sales">
                          <div className="flex flex-col">
                            <span>{t("team:roles.sales")}</span>
                            <span className="text-xs text-muted-foreground">
                              {t("team:roleDescriptions.sales")}
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex flex-col">
                            <span>{t("team:roles.viewer")}</span>
                            <span className="text-xs text-muted-foreground">
                              {t("team:roleDescriptions.viewer")}
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expirationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("team:createInvite.expiration")}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">
                          {t("team:createInvite.expirationOptions.1")}
                        </SelectItem>
                        <SelectItem value="3">
                          {t("team:createInvite.expirationOptions.3")}
                        </SelectItem>
                        <SelectItem value="7">
                          {t("team:createInvite.expirationOptions.7")}
                        </SelectItem>
                        <SelectItem value="14">
                          {t("team:createInvite.expirationOptions.14")}
                        </SelectItem>
                        <SelectItem value="30">
                          {t("team:createInvite.expirationOptions.30")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  {t("common:buttons.cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? t("common:buttons.loading")
                    : t("team:createInvite.button")}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
