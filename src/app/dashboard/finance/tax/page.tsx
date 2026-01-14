"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Plus, Edit, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

const defaultFormData = {
  name: "",
  rate: "",
  type: "sales_tax",
  description: "",
  isDefault: false,
};

export default function TaxPage() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxRate | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const fetchTaxRates = async () => {
    try {
      const response = await fetch("/api/tax-rates");
      const data = await response.json();
      setTaxRates(data.taxRates || []);
    } catch (error) {
      toast.error("Failed to fetch tax rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingTax ? `/api/tax-rates/${editingTax.id}` : "/api/tax-rates";
      const method = editingTax ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rate: parseFloat(formData.rate),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save tax rate");
      }

      toast.success(
        editingTax ? "Tax rate updated successfully" : "Tax rate created successfully"
      );
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      setEditingTax(null);
      fetchTaxRates();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save tax rate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tax: TaxRate) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      rate: tax.rate.toString(),
      type: tax.type,
      description: tax.description || "",
      isDefault: tax.isDefault,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tax rate?")) return;

    try {
      const response = await fetch(`/api/tax-rates/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete tax rate");
      toast.success("Tax rate deleted successfully");
      fetchTaxRates();
    } catch (error) {
      toast.error("Failed to delete tax rate");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/tax-rates/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      toast.success(`Tax rate ${!currentStatus ? "activated" : "deactivated"}`);
      fetchTaxRates();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/tax-rates/${id}/default`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to set as default");
      toast.success("Default tax rate updated");
      fetchTaxRates();
    } catch (error) {
      toast.error("Failed to set as default");
    }
  };

  const activeTaxRates = taxRates.filter((t) => t.isActive);
  const defaultTaxRate = taxRates.find((t) => t.isDefault);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tax Settings</h1>
          <p className="text-muted-foreground mt-1">Configure tax rates and settings</p>
        </div>
        <Button
          onClick={() => {
            setEditingTax(null);
            setFormData(defaultFormData);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Tax Rate
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Tax Rates</div>
            <div className="text-2xl font-bold">{taxRates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Active Tax Rates</div>
            <div className="text-2xl font-bold">{activeTaxRates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Default Tax Rate</div>
            <div className="text-2xl font-bold">
              {defaultTaxRate ? `${defaultTaxRate.rate}%` : "None"}
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
          ) : taxRates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No tax rates yet</h3>
              <p className="text-muted-foreground mb-4">Add your first tax rate</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tax Rate
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxRates.map((tax) => (
                  <TableRow key={tax.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {tax.name}
                        {tax.isDefault && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Default
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{tax.rate}%</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tax.type.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{tax.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={tax.isActive ? "default" : "secondary"}>
                        {tax.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={tax.isActive}
                        onCheckedChange={() => toggleActive(tax.id, tax.isActive)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!tax.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAsDefault(tax.id)}
                            title="Set as default"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(tax)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tax.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTax ? "Edit Tax Rate" : "Add Tax Rate"}</DialogTitle>
            <DialogDescription>
              {editingTax ? "Update tax rate details" : "Create a new tax rate"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tax Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard VAT"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate (%) *</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales_tax">Sales Tax</SelectItem>
                      <SelectItem value="vat">VAT</SelectItem>
                      <SelectItem value="gst">GST</SelectItem>
                      <SelectItem value="income_tax">Income Tax</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                />
                <Label htmlFor="isDefault">Set as default tax rate</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTax ? "Update" : "Create"} Tax Rate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
