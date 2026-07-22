import type { ReactNode } from "react";

export type Role = "admin" | "user" | "member";

interface PermissionWrapperProps {
  allowedRoles?: Role[];
  currentRole?: Role | null;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionWrapper({
  allowedRoles,
  currentRole,
  fallback,
  children,
}: PermissionWrapperProps) {
  // If no roles defined, allow all
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // If no current role, show fallback or nothing
  if (!currentRole) {
    return <>{fallback ?? null}</>;
  }

  if (allowedRoles.includes(currentRole)) {
    return <>{children}</>;
  }

  return <>{fallback ?? null}</>;
}
