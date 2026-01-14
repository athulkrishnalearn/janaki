"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Key, Loader2, Plus, Copy, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ApiToken {
  id: string;
  name: string;
  token: string;
  permissions: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: "",
    permissions: "read",
    expiresIn: "never",
  });

  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/cms/api-tokens");
      const data = await response.json();
      setTokens(data.tokens || []);
    } catch (error) {
      toast.error("Failed to fetch API tokens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/cms/api-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create API token");
      }

      const data = await response.json();
      setNewToken(data.token.token);
      toast.success("API token created successfully");
      fetchTokens();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create API token");
      setIsDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API token? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/cms/api-tokens/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete API token");
      toast.success("API token deleted successfully");
      fetchTokens();
    } catch (error) {
      toast.error("Failed to delete API token");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/cms/api-tokens/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Failed to update API token");
      toast.success(`Token ${isActive ? "activated" : "deactivated"}`);
      fetchTokens();
    } catch (error) {
      toast.error("Failed to update API token");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Token copied to clipboard");
  };

  const toggleTokenVisibility = (id: string) => {
    const newVisibleTokens = new Set(visibleTokens);
    if (newVisibleTokens.has(id)) {
      newVisibleTokens.delete(id);
    } else {
      newVisibleTokens.add(id);
    }
    setVisibleTokens(newVisibleTokens);
  };

  const maskToken = (token: string) => {
    return token.substring(0, 8) + "•".repeat(32) + token.substring(token.length - 8);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setNewToken(null);
    setFormData({ name: "", permissions: "read", expiresIn: "never" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Tokens</h1>
          <p className="text-muted-foreground mt-1">
            Manage API tokens for headless CMS access
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Token
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Tokens</div>
            <div className="text-2xl font-bold">{tokens.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Active Tokens</div>
            <div className="text-2xl font-bold">
              {tokens.filter((t) => t.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Inactive Tokens</div>
            <div className="text-2xl font-bold">
              {tokens.filter((t) => !t.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No API tokens yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first API token to access your content via API
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Token
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="font-medium">{token.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {visibleTokens.has(token.id) ? token.token : maskToken(token.token)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTokenVisibility(token.id)}
                        >
                          {visibleTokens.has(token.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(token.token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{token.permissions}</Badge>
                    </TableCell>
                    <TableCell>
                      {token.lastUsedAt
                        ? format(new Date(token.lastUsedAt), "MMM d, yyyy")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {token.expiresAt
                        ? format(new Date(token.expiresAt), "MMM d, yyyy")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={token.isActive}
                        onCheckedChange={(checked) =>
                          handleToggleActive(token.id, checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(token.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newToken ? "API Token Created" : "Create API Token"}
            </DialogTitle>
            <DialogDescription>
              {newToken
                ? "Save this token securely. You won't be able to see it again."
                : "Create a new API token for headless CMS access"}
            </DialogDescription>
          </DialogHeader>

          {newToken ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Your API Token</Label>
                <div className="flex items-center gap-2">
                  <Input value={newToken} readOnly className="font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(newToken)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Make sure to copy this token now. You won&apos;t be able to see it again!
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Token Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Production API"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permissions">Permissions</Label>
                  <Select
                    value={formData.permissions}
                    onValueChange={(value) => setFormData({ ...formData, permissions: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Read Only</SelectItem>
                      <SelectItem value="write">Read & Write</SelectItem>
                      <SelectItem value="admin">Full Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiresIn">Expiration</Label>
                  <Select
                    value={formData.expiresIn}
                    onValueChange={(value) => setFormData({ ...formData, expiresIn: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="7d">7 Days</SelectItem>
                      <SelectItem value="30d">30 Days</SelectItem>
                      <SelectItem value="90d">90 Days</SelectItem>
                      <SelectItem value="1y">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Token
                </Button>
              </DialogFooter>
            </form>
          )}

          {newToken && (
            <DialogFooter>
              <Button onClick={closeDialog}>Done</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
