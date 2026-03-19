import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/lib/auth-types";

export async function getSessionUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    roles: session.user.roles ?? [],
    departmentId: session.user.departmentId ?? null,
    positionRank: session.user.positionRank ?? 3,
  };
}

export function hasRole(user: SessionUser, roleCode: string): boolean {
  return user.roles.includes(roleCode);
}

export function isAdmin(user: SessionUser): boolean {
  return hasRole(user, "ADMIN");
}

export function isManager(user: SessionUser): boolean {
  return hasRole(user, "MANAGER") || hasRole(user, "APPROVER_MANAGER");
}

export function isCeo(user: SessionUser): boolean {
  return hasRole(user, "CEO");
}
