import { useState } from "react";
import { Copy, Check, MoreHorizontal, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, isPast } from "date-fns";
import { revokeInvitation, getInvitationUrl } from "@/services/invitations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import type { Invitation } from "@/types";

interface InvitationListProps {
  invitations: Invitation[];
  onInvitationRevoked?: (invitationId: string) => void;
  canManage?: boolean;
}

export function InvitationList({
  invitations,
  onInvitationRevoked,
  canManage = false,
}: InvitationListProps) {
  const { t } = useTranslation(["team", "common"]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [invitationToRevoke, setInvitationToRevoke] = useState<Invitation | null>(
    null
  );
  const [isRevoking, setIsRevoking] = useState(false);

  const copyInviteLink = async (invitation: Invitation) => {
    const url = getInvitationUrl(invitation.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invitation.id);
      toast.success(t("team:copyLink.success"));
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleRevoke = async () => {
    if (!invitationToRevoke) return;

    setIsRevoking(true);
    try {
      await revokeInvitation(invitationToRevoke.orgId, invitationToRevoke.id);
      toast.success(t("team:revokeInvite.success"));
      onInvitationRevoked?.(invitationToRevoke.id);
    } catch (error) {
      console.error("Error revoking invitation:", error);
      toast.error(t("team:revokeInvite.error"));
    } finally {
      setIsRevoking(false);
      setRevokeDialogOpen(false);
      setInvitationToRevoke(null);
    }
  };

  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  if (pendingInvitations.length === 0) {
    return (
      <EmptyState
        icon={Link2}
        title={t("team:invitations.empty.title")}
        description={t("team:invitations.empty.description")}
      />
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("team:createInvite.role")}</TableHead>
              <TableHead>{t("team:invitations.title")}</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingInvitations.map((invitation) => {
              const expiresAt = invitation.expiresAt.toDate();
              const isExpired = isPast(expiresAt);

              return (
                <TableRow key={invitation.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {t(`team:roles.${invitation.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {invitation.type === "link"
                        ? t("team:invitations.linkType")
                        : t("team:invitations.emailType")}
                    </Badge>
                    {invitation.email && (
                      <span className="ml-2 text-muted-foreground">
                        {invitation.email}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isExpired ? (
                      <span className="text-destructive">
                        {t("team:invitations.expired")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {t("team:invitations.expires", {
                          date: formatDistanceToNow(expiresAt, {
                            addSuffix: true,
                          }),
                        })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {invitation.type === "link" && !isExpired && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyInviteLink(invitation)}
                        >
                          {copiedId === invitation.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setInvitationToRevoke(invitation);
                                setRevokeDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("team:revokeInvite.button")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={revokeDialogOpen}
        onOpenChange={setRevokeDialogOpen}
        title={t("team:revokeInvite.title")}
        description={t("team:revokeInvite.description")}
        confirmLabel={t("team:revokeInvite.button")}
        variant="destructive"
        onConfirm={handleRevoke}
        isLoading={isRevoking}
      />
    </>
  );
}
