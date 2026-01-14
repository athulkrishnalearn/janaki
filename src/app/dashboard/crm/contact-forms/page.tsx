"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Copy, Eye, EyeOff, Trash2, ExternalLink, Link2, BarChart, GripVertical, X, Upload, Image as ImageIcon, Megaphone } from "lucide-react";
import { toast } from "sonner";

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

const defaultFields: FormField[] = [
  { id: "1", name: "name", label: "Full Name", type: "text", required: true, placeholder: "Enter your full name" },
  { id: "2", name: "email", label: "Email", type: "email", required: true, placeholder: "your@email.com" },
  { id: "3", name: "phone", label: "Phone", type: "tel", required: false, placeholder: "+1 (555) 000-0000" },
  { id: "4", name: "company", label: "Company", type: "text", required: false, placeholder: "Your company name" },
  { id: "5", name: "message", label: "Message", type: "textarea", required: true, placeholder: "Tell us about your needs..." },
];

export default function ContactFormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    title: "Contact Us",
    description: "Fill out this form and we'll get back to you soon!",
    logoUrl: "",
    campaignName: "",
    campaignDetails: "",
  });
  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const res = await fetch("/api/forms");
      const data = await res.json();
      setForms(data.forms || []);
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Clean fields (remove id for submission)
      const cleanFields = fields.map(({ id, ...field }) => field);

      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          fields: JSON.stringify(cleanFields),
        }),
      });

      if (!res.ok) throw new Error("Failed to create form");

      toast.success("Form created successfully!");
      setIsDialogOpen(false);
      fetchForms();
      setFormData({
        name: "",
        title: "Contact Us",
        description: "Fill out this form and we'll get back to you soon!",
        logoUrl: "",
        campaignName: "",
        campaignDetails: "",
      });
      setFields(defaultFields);
    } catch (error: any) {
      toast.error(error.message || "Failed to create form");
    }
  };

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(link);
    toast.success("Form link copied to clipboard!");
  };

  const toggleFormStatus = async (formId: string, isActive: boolean) => {
    try {
      await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchForms();
      toast.success(`Form ${!isActive ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.error("Failed to update form");
    }
  };

  const deleteForm = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;

    try {
      await fetch(`/api/forms/${formId}`, { method: "DELETE" });
      fetchForms();
      toast.success("Form deleted");
    } catch (error) {
      toast.error("Failed to delete form");
    }
  };

  // Field management functions
  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      name: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false,
      placeholder: "",
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const openFieldEditor = (field: FormField) => {
    setEditingField({ ...field });
    setShowFieldEditor(true);
  };

  const saveFieldEdit = () => {
    if (editingField) {
      updateField(editingField.id, editingField);
      setShowFieldEditor(false);
      setEditingField(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contact Forms</h1>
          <p className="text-muted-foreground mt-1">
            Create shareable forms to capture leads from anywhere
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Contact Form</DialogTitle>
              <DialogDescription>
                Create a public form that anyone can fill out. Submissions will be added as new contacts.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Branding Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Branding & Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Company Logo URL</Label>
                    <Input
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the URL of your company logo (will be displayed on the form)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    Campaign Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Campaign Name</Label>
                    <Input
                      value={formData.campaignName}
                      onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                      placeholder="e.g., Summer 2024 Recruitment Campaign"
                    />
                  </div>
                  <div>
                    <Label>Campaign Details</Label>
                    <Textarea
                      value={formData.campaignDetails}
                      onChange={(e) => setFormData({ ...formData, campaignDetails: e.target.value })}
                      placeholder="Brief description of this campaign..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Basic Form Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Form Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Form Name (Internal)</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Career Inquiry Form"
                      required
                    />
                  </div>

                  <div>
                    <Label>Form Title (Public)</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Form Fields Builder */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Form Fields</CardTitle>
                    <Button type="button" onClick={addField} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Field
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No fields yet. Click "Add Field" to get started.
                    </p>
                  ) : (
                    fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        
                        <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium">{field.label}</span>
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </div>
                          <div className="text-muted-foreground">
                            Type: <span className="font-medium">{field.type}</span>
                          </div>
                          <div className="text-muted-foreground">
                            Name: <span className="font-mono text-xs">{field.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openFieldEditor(field)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveField(index, "up")}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveField(index, "down")}
                            disabled={index === fields.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(field.id)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Form</Button>
              </DialogFooter>
            </form>
          </DialogContent>

          {/* Field Editor Dialog */}
          <Dialog open={showFieldEditor} onOpenChange={setShowFieldEditor}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Field</DialogTitle>
              </DialogHeader>
              {editingField && (
                <div className="space-y-4">
                  <div>
                    <Label>Field Label</Label>
                    <Input
                      value={editingField.label}
                      onChange={(e) =>
                        setEditingField({ ...editingField, label: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Field Name (for data)</Label>
                    <Input
                      value={editingField.name}
                      onChange={(e) =>
                        setEditingField({ ...editingField, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Field Type</Label>
                    <Select
                      value={editingField.type}
                      onValueChange={(value) =>
                        setEditingField({ ...editingField, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="tel">Phone</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="textarea">Textarea</SelectItem>
                        <SelectItem value="select">Dropdown</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Placeholder</Label>
                    <Input
                      value={editingField.placeholder || ""}
                      onChange={(e) =>
                        setEditingField({ ...editingField, placeholder: e.target.value })
                      }
                    />
                  </div>

                  {editingField.type === "select" && (
                    <div>
                      <Label>Options (comma-separated)</Label>
                      <Input
                        value={editingField.options?.join(", ") || ""}
                        onChange={(e) =>
                          setEditingField({
                            ...editingField,
                            options: e.target.value.split(",").map((s) => s.trim()),
                          })
                        }
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingField.required}
                      onCheckedChange={(checked) =>
                        setEditingField({ ...editingField, required: checked })
                      }
                    />
                    <Label>Required field</Label>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowFieldEditor(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={saveFieldEdit}>
                      Save Field
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </Dialog>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No forms yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first contact form to start capturing leads
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{form.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">{form.title}</CardDescription>
                  </div>
                  <Badge variant={form.isActive ? "default" : "secondary"}>
                    {form.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Submissions</span>
                  <div className="flex items-center gap-1">
                    <BarChart className="h-4 w-4" />
                    <span className="font-medium">{form.submitCount}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => copyFormLink(form.id)}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/forms/${form.id}`, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => toggleFormStatus(form.id, form.isActive)}
                  >
                    {form.isActive ? (
                      <>
                        <EyeOff className="mr-1 h-3 w-3" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1 h-3 w-3" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteForm(form.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
