import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Shield, Users, Settings } from "lucide-react";
import Link from "next/link";

export default async function RoleManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    redirect("/dashboard");
  }

  const roles = await prisma.role.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const permissions = await prisma.permission.findMany();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Create and manage roles with specific permissions
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/settings/roles/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {role.isSystem && <Shield className="h-4 w-4 text-primary" />}
                    {role.name}
                  </CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
                <Badge variant="outline">{role._count.users} users</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Permissions:</h4>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No permissions assigned</p>
                  ) : (
                    role.permissions.map((rp) => (
                      <Badge key={rp.id} variant="secondary" className="text-xs">
                        {rp.permission.label}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/settings/roles/${role.id}`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {roles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No roles yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first role to manage user permissions
            </p>
            <Button asChild>
              <Link href="/dashboard/settings/roles/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
