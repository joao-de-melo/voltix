import { useState } from "react";
import { MoreHorizontal, UserMinus, Shield } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import {
  updateMemberRole,
  removeMember,
  canRemoveMember,
  canChangeRole,
} from "@/services/members";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import type { Membership, UserRole } from "@/types";

interface MemberListProps {
  members: Membership[];
  orgId: string;
  onMemberRemoved?: (userId: string) => void;
  onMemberRoleChanged?: (userId: string, newRole: UserRole) => void;
  canManage?: boolean;
}

const ROLES: UserRole[] = ["owner", "admin", "manager", "sales", "viewer"];

export function MemberList({
  members,
  orgId,
  onMemberRemoved,
  onMemberRoleChanged,
  canManage = false,
}: MemberListProps) {
  const { t } = useTranslation(["team", "common"]);
  const { user } = useAuth();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Membership | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);

  const handleRemove = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      const check = await canRemoveMember(orgId, memberToRemove.userId);
      if (!check.canRemove) {
        toast.error(t("team:removeMember.cannotRemoveLastOwner"));
        return;
      }

      await removeMember(orgId, memberToRemove.userId);
      toast.success(t("team:removeMember.success"));
      onMemberRemoved?.(memberToRemove.userId);
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(t("team:removeMember.error"));
    } finally {
      setIsRemoving(false);
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
    }
  };

  const handleRoleChange = async (member: Membership, newRole: UserRole) => {
    if (newRole === member.role) return;

    setIsChangingRole(true);
    try {
      const check = await canChangeRole(orgId, member.userId, newRole);
      if (!check.canChange) {
        toast.error(t("team:changeRole.cannotDemoteLastOwner"));
        return;
      }

      await updateMemberRole(orgId, member.userId, newRole);
      toast.success(t("team:changeRole.success"));
      onMemberRoleChanged?.(member.userId, newRole);
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error(t("team:changeRole.error"));
    } finally {
      setIsChangingRole(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title={t("team:members.empty.title")}
        description={t("team:members.empty.description")}
      />
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>{t("team:createInvite.role")}</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isCurrentUser = member.userId === user?.id;
              const joinedAt = member.joinedAt?.toDate?.() ?? new Date();

              return (
                <TableRow key={member.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(member.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {member.userName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({t("team:members.you")})
                            </span>
                          )}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {member.userEmail}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {t(`team:roles.${member.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {format(joinedAt, "MMM d, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {canManage && !isCurrentUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isChangingRole}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Shield className="mr-2 h-4 w-4" />
                              {t("team:changeRole.title")}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {ROLES.map((role) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => handleRoleChange(member, role)}
                                  disabled={role === member.role}
                                >
                                  <span
                                    className={
                                      role === member.role
                                        ? "font-medium"
                                        : undefined
                                    }
                                  >
                                    {t(`team:roles.${role}`)}
                                  </span>
                                  {role === member.role && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      (current)
                                    </span>
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setMemberToRemove(member);
                              setRemoveDialogOpen(true);
                            }}
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            {t("team:removeMember.button")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        title={t("team:removeMember.title")}
        description={t("team:removeMember.description", {
          name: memberToRemove?.userName,
        })}
        confirmLabel={t("team:removeMember.button")}
        variant="destructive"
        onConfirm={handleRemove}
        isLoading={isRemoving}
      />
    </>
  );
}
