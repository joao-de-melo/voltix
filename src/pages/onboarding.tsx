import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { OnboardingForm } from "@/components/features/auth";
import { signOut } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";

export function OnboardingPage() {
  const { t } = useTranslation(["common"]);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {t("common:header.signOut")}
        </Button>
      </div>
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          </div>
          <span className="text-2xl font-bold">Voltix</span>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
