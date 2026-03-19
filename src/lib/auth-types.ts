import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
      departmentId: string | null;
      positionRank: number;
    } & DefaultSession["user"];
  }
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  departmentId: string | null;
  positionRank: number;
};
