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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PieChart, Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Budget {
  id: string;
  name: string;
  description: string | null;
  period: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  spent: number;
  isActive: boolean;
  categories: {
    id: string;
    categoryName: string;
    allocated: number;
    spent: number;
  }[];
}

const defaultFormData = {
  name: "",
  description: "",
  period: "monthly",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  totalAmount: "",
  categories: [
    { categoryName: "Marketing", allocated: "" },
    { categoryName: "Operations", allocated: "" },
    { categoryName: "Salaries", allocated: "" },
  ],
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const fetchBudgets = async () => {
    try {
      const response = await fetch("/api/budgets");
      const data = await response.json();
      setBudgets(data.budgets || []);
    } catch (error) {
      toast.error("Failed to fetch budgets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingBudget ? `/api/budgets/${editingBudget.id}` : "/api/budgets";
      const method = editingBudget ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalAmount: parseFloat(formData.totalAmount),
          categories: formData.categories.map((cat) => ({
            ...cat,
            allocated: parseFloat(cat.allocated || "0"),
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save budget");
      }

      toast.success(
        editingBudget ? "Budget updated successfully" : "Budget created successfully"
      );
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      setEditingBudget(null);
      fetchBudgets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      description: budget.description || "",
      period: budget.period,
      startDate: budget.startDate.split("T")[0],
      endDate: budget.endDate.split("T")[0],
      totalAmount: budget.totalAmount.toString(),
      categories: budget.categories.map((cat) => ({
        categoryName: cat.categoryName,
        allocated: cat.allocated.toString(),
      })),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    try {
      const response = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete budget");
      toast.success("Budget deleted successfully");
      fetchBudgets();
    } catch (error) {
      toast.error("Failed to delete budget");
    }
  };

  const addCategory = () => {
    setFormData({
      ...formData,
      categories: [...formData.categories, { categoryName: "", allocated: "" }],
    });
  };

  const removeCategory = (index: number) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((_, i) => i !== index),
    });
  };

  const updateCategory = (index: number, field: string, value: string) => {
    const updated = [...formData.categories];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, categories: updated });
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground mt-1">Plan and track your budgets</p>
        </div>
        <Button
          onClick={() => {
            setEditingBudget(null);
            setFormData(defaultFormData);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Budget</div>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Spent</div>
            <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Remaining</div>
            <div className="text-2xl font-bold">
              ${(totalBudget - totalSpent).toLocaleString()}
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
          ) : budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No budgets yet</h3>
              <p className="text-muted-foreground mb-4">Create your first budget</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Budget
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {budgets.map((budget) => {
                const percentUsed = (budget.spent / budget.totalAmount) * 100;
                return (
                  <div key={budget.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{budget.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(budget.startDate), "MMM d, yyyy")} -{" "}
                          {format(new Date(budget.endDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={budget.isActive ? "default" : "secondary"}>
                          {budget.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(budget)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(budget.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span className="font-medium">
                          ${budget.spent.toLocaleString()} / $
                          {budget.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={percentUsed} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {percentUsed.toFixed(1)}% used
                      </p>
                    </div>

                    {budget.categories.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Allocated</TableHead>
                            <TableHead>Spent</TableHead>
                            <TableHead>Remaining</TableHead>
                            <TableHead>Progress</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {budget.categories.map((cat) => {
                            const catPercent = (cat.spent / cat.allocated) * 100;
                            return (
                              <TableRow key={cat.id}>
                                <TableCell className="font-medium">
                                  {cat.categoryName}
                                </TableCell>
                                <TableCell>${cat.allocated.toLocaleString()}</TableCell>
                                <TableCell>${cat.spent.toLocaleString()}</TableCell>
                                <TableCell>
                                  ${(cat.allocated - cat.spent).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress value={catPercent} className="h-1 w-20" />
                                    <span className="text-xs">{catPercent.toFixed(0)}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit Budget" : "Create Budget"}</DialogTitle>
            <DialogDescription>
              {editingBudget ? "Update budget details" : "Create a new budget plan"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Budget Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Period *</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value) => setFormData({ ...formData, period: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
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
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Budget Categories</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Category
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.categories.map((cat, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <Input
                          placeholder="Category name"
                          value={cat.categoryName}
                          onChange={(e) =>
                            updateCategory(index, "categoryName", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Allocated amount"
                          value={cat.allocated}
                          onChange={(e) => updateCategory(index, "allocated", e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCategory(index)}
                          disabled={formData.categories.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBudget ? "Update" : "Create"} Budget
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
