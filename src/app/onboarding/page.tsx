"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";

interface Permission {
  id: string;
  name: string;
  label: string;
  description: string;
}

interface RoleSetup {
  name: string;
  description: string;
  permissions: string[];
}

const steps = [
  { id: 1, title: "Organization Setup", icon: Building2 },
  { id: 2, title: "Define Roles", icon: Shield },
  { id: 3, title: "Review & Finish", icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Organization info
  const [orgInfo, setOrgInfo] = useState({
    industry: "",
    teamSize: "",
  });

  // Roles setup
  const [roles, setRoles] = useState<RoleSetup[]>([
    { name: "", description: "", permissions: [] },
  ]);

  useEffect(() => {
    if (session?.user?.onboardingCompleted) {
      router.push("/dashboard");
    }
    fetchPermissions();
  }, [session, router]);

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/permissions");
      const data = await response.json();
      setPermissions(data.permissions || []);
    } catch (error) {
      console.error("Failed to fetch permissions");
    }
  };

  const handleAddRole = () => {
    setRoles([...roles, { name: "", description: "", permissions: [] }]);
  };

  const handleRemoveRole = (index: number) => {
    if (roles.length > 1) {
      setRoles(roles.filter((_, i) => i !== index));
    }
  };

  const handleRoleChange = (index: number, field: keyof RoleSetup, value: any) => {
    const updated = roles.map((role, i) =>
      i === index ? { ...role, [field]: value } : role
    );
    setRoles(updated);
  };

  const togglePermission = (roleIndex: number, permissionName: string) => {
    const role = roles[roleIndex];
    const newPermissions = role.permissions.includes(permissionName)
      ? role.permissions.filter((p) => p !== permissionName)
      : [...role.permissions, permissionName];
    handleRoleChange(roleIndex, "permissions", newPermissions);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Filter out empty roles
      const validRoles = roles.filter((r) => r.name.trim() !== "");

      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgInfo,
          roles: validRoles,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      // Update session
      await updateSession({ onboardingCompleted: true });

      toast.success("Setup complete! Welcome to JANAKI");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to complete setup");
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return true; // Optional info
    }
    if (currentStep === 2) {
      return true; // Roles are optional at first
    }
    return true;
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to JANAKI</CardTitle>
          <CardDescription>
            Let&apos;s set up your workspace in a few simple steps
          </CardDescription>
          <Progress value={progress} className="mt-4" />
          <div className="flex justify-center gap-8 mt-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= step.id ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-sm hidden md:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Organization Setup */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Tell us about your organization</h3>
                <p className="text-muted-foreground">This helps us customize your experience</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={orgInfo.industry}
                    onChange={(e) => setOrgInfo({ ...orgInfo, industry: e.target.value })}
                    placeholder="e.g., Technology, Healthcare, Retail"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Input
                    id="teamSize"
                    value={orgInfo.teamSize}
                    onChange={(e) => setOrgInfo({ ...orgInfo, teamSize: e.target.value })}
                    placeholder="e.g., 1-10, 11-50, 51-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Define Roles */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Define roles for your team</h3>
                <p className="text-muted-foreground">
                  Create roles and assign permissions. You can add more later.
                </p>
              </div>

              <div className="space-y-6">
                {roles.map((role, roleIndex) => (
                  <Card key={roleIndex} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Role {roleIndex + 1}</h4>
                        {roles.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRole(roleIndex)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Role Name</Label>
                          <Input
                            value={role.name}
                            onChange={(e) => handleRoleChange(roleIndex, "name", e.target.value)}
                            placeholder="e.g., Sales Manager, Accountant"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={role.description}
                            onChange={(e) =>
                              handleRoleChange(roleIndex, "description", e.target.value)
                            }
                            placeholder="Brief description"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Permissions</Label>
                        <div className="flex flex-wrap gap-2">
                          {permissions
                            .filter((p) => p.name !== "dashboard") // Dashboard is always included
                            .map((permission) => (
                              <Badge
                                key={permission.id}
                                variant={
                                  role.permissions.includes(permission.name)
                                    ? "default"
                                    : "outline"
                                }
                                className="cursor-pointer"
                                onClick={() => togglePermission(roleIndex, permission.name)}
                              >
                                {permission.label}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button variant="outline" onClick={handleAddRole} className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Add Another Role
              </Button>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Review your setup</h3>
                <p className="text-muted-foreground">
                  You can always change these settings later
                </p>
              </div>

              <div className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Organization</h4>
                  <p className="text-sm text-muted-foreground">
                    {session?.user?.organizationName}
                    {orgInfo.industry && ` • ${orgInfo.industry}`}
                    {orgInfo.teamSize && ` • ${orgInfo.teamSize} people`}
                  </p>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">Roles Created</h4>
                  {roles.filter((r) => r.name.trim() !== "").length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No custom roles yet. You can add them later from Settings.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {roles
                        .filter((r) => r.name.trim() !== "")
                        .map((role, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="font-medium">{role.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {role.permissions.length} permissions
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </Card>

                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">AI Workflows Ready</h4>
                      <p className="text-sm text-muted-foreground">
                        Our AI will automatically suggest workflows based on your roles and
                        permissions. You can customize them anytime.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {currentStep < 3 ? (
              <Button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed()}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
