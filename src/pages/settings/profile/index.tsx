import { Navigate } from "react-router-dom";

export function ProfileSettingsIndexPage() {
  return <Navigate to="/settings/profile/account" replace />;
}
