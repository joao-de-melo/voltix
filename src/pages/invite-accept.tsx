import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Users, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth-context";
import {
  getInvitationByToken,
  acceptInvitation,
  isUserMemberOfOrg,
} from "@/services/invitations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Invitation } from "@/types";

export function InviteAcceptPage() {
  const { t } = useTranslation(["team", "common"]);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, firebaseUser, isLoading: authLoading, isAuthenticated, refreshMemberships } = useAuth();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Only load invitation data AFTER user is authenticated
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Don't load if not authenticated - we'll show login prompt
    if (!isAuthenticated) return;

    // Need a valid token
    if (!token) {
      setError("invalidToken");
      return;
    }

    // Don't reload if we already have the invitation
    if (invitation) return;

    const loadInvitation = async () => {
      setIsLoading(true);
      try {
        const inv = await getInvitationByToken(token);
        if (!inv) {
          setError("invalidToken");
          return;
        }

        // Check if expired
        const expiresAt = inv.expiresAt.toDate();
        if (expiresAt < new Date()) {
          setError("expired");
          return;
        }

        setInvitation(inv);
      } catch (err) {
        console.error("Error loading invitation:", err);
        setError("invalidToken");
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitation();
  }, [token, authLoading, isAuthenticated, invitation]);

  // Check if user is already a member
  useEffect(() => {
    if (!invitation || !firebaseUser) return;

    const checkMembership = async () => {
      const isMember = await isUserMemberOfOrg(invitation.orgId, firebaseUser.uid);
      setAlreadyMember(isMember);
    };

    checkMembership();
  }, [invitation, firebaseUser]);

  const handleAccept = async () => {
    if (!invitation || !firebaseUser || !user) return;

    setIsAccepting(true);
    try {
      await acceptInvitation(
        invitation,
        firebaseUser.uid,
        user.email,
        user.displayName
      );

      setAccepted(true);
      toast.success(t("team:acceptInvite.success", { orgName: invitation.orgName }));

      // Refresh memberships in auth context
      await refreshMemberships();

      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error accepting invitation:", err);
      toast.error(t("team:acceptInvite.error"));
    } finally {
      setIsAccepting(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {t("team:acceptInvite.loading")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login required state BEFORE trying to load invitation
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(`/invite/${token}`);
    // Also store in sessionStorage as backup for OAuth flows
    sessionStorage.setItem('voltix_invite_return', `/invite/${token}`);
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">{t("team:acceptInvite.title")}</CardTitle>
            <CardDescription>
              {t("team:acceptInvite.loginRequired")}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" asChild>
              <Link to={`/login?returnUrl=${returnUrl}`}>
                {t("team:acceptInvite.loginButton")}
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to={`/register?returnUrl=${returnUrl}`}>
                {t("team:acceptInvite.registerButton")}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show loading while fetching invitation (after auth is confirmed)
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {t("team:acceptInvite.loading")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="mt-4">
              {error === "expired"
                ? t("team:acceptInvite.expired")
                : t("team:acceptInvite.invalidToken")}
            </CardTitle>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link to="/dashboard">{t("common:buttons.goToDashboard")}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show already member state
  if (alreadyMember) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="mt-4">
              {t("team:acceptInvite.alreadyMember")}
            </CardTitle>
            <CardDescription>
              {invitation?.orgName}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link to="/dashboard">{t("common:buttons.goToDashboard")}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show accepted state
  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="mt-4">
              {t("team:acceptInvite.success", { orgName: invitation?.orgName })}
            </CardTitle>
            <CardDescription>Redirecting to dashboard...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Still loading invitation (no error, no invitation yet)
  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {t("team:acceptInvite.loading")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show invitation details and accept button
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="mt-4">{t("team:acceptInvite.title")}</CardTitle>
          <CardDescription>
            {t("team:acceptInvite.description", {
              orgName: invitation.orgName,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("team:acceptInvite.role")}
              </span>
              <Badge variant="secondary">
                {t(`team:roles.${invitation.role}`)}
              </Badge>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("team:acceptInvite.invitedBy")}
              </span>
              <span className="text-sm font-medium">
                {invitation.invitedByName}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("team:acceptInvite.joining")}
              </>
            ) : (
              t("team:acceptInvite.joinButton")
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
