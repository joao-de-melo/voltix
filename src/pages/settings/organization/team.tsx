import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useOrganization } from "@/contexts/organization-context";
import { getMembers } from "@/services/members";
import { getPendingInvitations } from "@/services/invitations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/loading-spinner";
import {
  CreateInviteDialog,
  InvitationList,
  MemberList,
} from "@/components/features/team";
import type { Membership, Invitation, UserRole } from "@/types";

export function TeamSettingsPage() {
  const { t } = useTranslation(["team", "common"]);
  const { organization, hasPermission } = useOrganization();
  const [members, setMembers] = useState<Membership[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canInvite = hasPermission("users:invite");
  const canManage = hasPermission("users:manage");

  useEffect(() => {
    if (!organization?.id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [membersData, invitationsData] = await Promise.all([
          getMembers(organization.id),
          getPendingInvitations(organization.id),
        ]);
        setMembers(membersData);
        setInvitations(invitationsData);
      } catch (error) {
        console.error("Error loading team data:", error);
        toast.error(t("common:errors.generic"));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [organization?.id, t]);

  const handleInviteCreated = (invitation: Invitation) => {
    setInvitations((prev) => [invitation, ...prev]);
  };

  const handleInvitationRevoked = (invitationId: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
  };

  const handleMemberRemoved = (userId: string) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const handleMemberRoleChanged = (userId: string, newRole: UserRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
    );
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header with create invite button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">{t("team:title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("team:description")}
          </p>
        </div>
        {canInvite && (
          <CreateInviteDialog onInviteCreated={handleInviteCreated} />
        )}
      </div>

      {/* Members section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("team:members.title")}</CardTitle>
          <CardDescription>{t("team:members.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <MemberList
            members={members}
            orgId={organization?.id || ""}
            onMemberRemoved={handleMemberRemoved}
            onMemberRoleChanged={handleMemberRoleChanged}
            canManage={canManage}
          />
        </CardContent>
      </Card>

      {/* Invitations section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("team:invitations.title")}</CardTitle>
          <CardDescription>{t("team:invitations.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <InvitationList
            invitations={invitations}
            onInvitationRevoked={handleInvitationRevoked}
            canManage={canManage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
