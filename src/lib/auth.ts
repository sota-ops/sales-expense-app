import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            userRoles: { include: { role: true } },
            department: true,
            employeePosition: true,
          },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.userRoles.map((ur) => ur.role.roleCode),
          departmentId: user.departmentId,
          positionRank: user.employeePosition?.positionRank ?? 3,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as Record<string, unknown>).roles as string[];
        token.departmentId = (user as Record<string, unknown>).departmentId as
          | string
          | null;
        token.positionRank = (user as Record<string, unknown>)
          .positionRank as number;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as Record<string, unknown>).roles = token.roles;
        (session.user as unknown as Record<string, unknown>).departmentId =
          token.departmentId;
        (session.user as unknown as Record<string, unknown>).positionRank =
          token.positionRank;
      }
      return session;
    },
  },
});
