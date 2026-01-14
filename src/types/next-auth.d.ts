import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      isAdmin: boolean;
      organizationId: string;
      organizationName: string;
      onboardingCompleted: boolean;
      permissions: string[];
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    organizationId: string;
    organizationName: string;
    onboardingCompleted: boolean;
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    organizationId: string;
    organizationName: string;
    onboardingCompleted: boolean;
    permissions: string[];
  }
}
