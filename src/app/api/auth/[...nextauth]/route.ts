import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { 
            organization: true,
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        });

        if (!user || !user.isActive) {
          throw new Error("User not found or inactive");
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // Get permissions from role
        const permissions = user.isAdmin 
          ? ["dashboard", "crm", "hr", "tasks", "finance", "automations", "assistant", "settings", "tickets", "users", "roles"]
          : user.role?.permissions.map(rp => rp.permission.name) || [];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
          onboardingCompleted: user.organization.onboardingCompleted,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.onboardingCompleted = user.onboardingCompleted;
        token.permissions = user.permissions;
      }
      
      // Handle session update
      if (trigger === "update" && session) {
        token.onboardingCompleted = session.onboardingCompleted ?? token.onboardingCompleted;
        token.permissions = session.permissions ?? token.permissions;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
