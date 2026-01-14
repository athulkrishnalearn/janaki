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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Layers, Loader2, Plus, Edit, Trash2, Database } from "lucide-react";
import { toast } from "sonner";

interface Field {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  helpText?: string;
}

interface ContentType {
  id: string;
  name: string;
  apiId: string;
  description: string | null;
  icon: string | null;
  isSystem: boolean;
  enableDrafts: boolean;
  enableVersioning: boolean;
  fields: string;
  createdAt: string;
  _count?: {
    contents: number;
  };
}

const defaultFormData = {
  name: "",
  apiId: "",
  description: "",
  icon: "file-text",
  enableDrafts: true,
  enableVersioning: true,
  fields: [] as Field[],
};

export default function ContentTypesPage() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingType, setEditingType] = useState<ContentType | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [currentField, setCurrentField] = useState<Field | null>(null);
  const [fieldFormData, setFieldFormData] = useState({
    name: "",
    label: "",
    type: "text",
    required: false,
    helpText: "",
  });

  const fetchContentTypes = async () => {
    try {
      const response = await fetch("/api/cms/content-types");
      const data = await response.json();
      setContentTypes(data.contentTypes || []);
    } catch (error) {
      toast.error("Failed to fetch content types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContentTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingType
        ? `/api/cms/content-types/${editingType.id}`
        : "/api/cms/content-types";
      const method = editingType ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          apiId: formData.apiId || formData.name.toLowerCase().replace(/\s+/g, "-"),
          description: formData.description,
          icon: formData.icon,
          enableDrafts: formData.enableDrafts,
          enableVersioning: formData.enableVersioning,
          fields: JSON.stringify(formData.fields),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save content type");
      }

      toast.success(
        editingType
          ? "Content type updated successfully"
          : "Content type created successfully"
      );
      setIsDialogOpen(false);
      setFormData(defaultFormData);
      setEditingType(null);
      fetchContentTypes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save content type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (type: ContentType) => {
    setEditingType(type);
    const fields = type.fields ? JSON.parse(type.fields) : [];
    setFormData({
      name: type.name,
      apiId: type.apiId,
      description: type.description || "",
      icon: type.icon || "file-text",
      enableDrafts: type.enableDrafts,
      enableVersioning: type.enableVersioning,
      fields: fields,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content type? All associated content will be deleted.")) return;

    try {
      const response = await fetch(`/api/cms/content-types/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete content type");
      toast.success("Content type deleted successfully");
      fetchContentTypes();
    } catch (error) {
      toast.error("Failed to delete content type");
    }
  };

  const handleAddField = () => {
    setCurrentField(null);
    setFieldFormData({
      name: "",
      label: "",
      type: "text",
      required: false,
      helpText: "",
    });
    setIsFieldDialogOpen(true);
  };

  const handleEditField = (field: Field) => {
    setCurrentField(field);
    setFieldFormData({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      helpText: field.helpText || "",
    });
    setIsFieldDialogOpen(true);
  };

  const handleSaveField = () => {
    if (!fieldFormData.name || !fieldFormData.label) {
      toast.error("Name and Label are required");
      return;
    }

    const newField: Field = {
      id: currentField?.id || Math.random().toString(36).substr(2, 9),
      name: fieldFormData.name,
      label: fieldFormData.label,
      type: fieldFormData.type,
      required: fieldFormData.required,
      helpText: fieldFormData.helpText,
    };

    if (currentField) {
      setFormData({
        ...formData,
        fields: formData.fields.map((f) => (f.id === currentField.id ? newField : f)),
      });
      toast.success("Field updated successfully");
    } else {
      setFormData({
        ...formData,
        fields: [...formData.fields, newField],
      });
      toast.success("Field added successfully");
    }

    setIsFieldDialogOpen(false);
  };

  const handleDeleteField = (fieldId: string) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((f) => f.id !== fieldId),
    });
    toast.success("Field removed successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content Types</h1>
          <p className="text-muted-foreground mt-1">
            Define and manage your content structures
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingType(null);
            setFormData(defaultFormData);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Content Type
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Content Types</div>
            <div className="text-2xl font-bold">{contentTypes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Custom Types</div>
            <div className="text-2xl font-bold">
              {contentTypes.filter((t) => !t.isSystem).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">System Types</div>
            <div className="text-2xl font-bold">
              {contentTypes.filter((t) => t.isSystem).length}
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
          ) : contentTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No content types yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first content type to start building your content
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Content Type
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>API ID</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Content Count</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentTypes.map((type) => {
                  const fields = type.fields ? JSON.parse(type.fields) : [];
                  return (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          {type.name}
                        </div>
                        {type.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {type.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-muted rounded text-sm">
                          {type.apiId}
                        </code>
                      </TableCell>
                      <TableCell>{fields.length} fields</TableCell>
                      <TableCell>{type._count?.contents || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {type.enableDrafts && (
                            <Badge variant="outline" className="text-xs">
                              Drafts
                            </Badge>
                          )}
                          {type.enableVersioning && (
                            <Badge variant="outline" className="text-xs">
                              Versions
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {type.isSystem ? (
                          <Badge variant="secondary">System</Badge>
                        ) : (
                          <Badge>Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(type)}
                            disabled={type.isSystem}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(type.id)}
                            disabled={type.isSystem}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Content Type Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Edit Content Type" : "Create Content Type"}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? "Update content type details and fields"
                : "Define a new content structure for your CMS"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Blog Post"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiId">API ID *</Label>
                  <Input
                    id="apiId"
                    value={formData.apiId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apiId: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      })
                    }
                    placeholder="e.g., blog-post"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in API URLs (e.g., /api/content/blog-post)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Describe what this content type is for"
                />
              </div>

              <div className="space-y-3">
                <Label>Features</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableDrafts"
                    checked={formData.enableDrafts}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enableDrafts: checked })
                    }
                  />
                  <Label htmlFor="enableDrafts" className="font-normal">
                    Enable drafts
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableVersioning"
                    checked={formData.enableVersioning}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enableVersioning: checked })
                    }
                  />
                  <Label htmlFor="enableVersioning" className="font-normal">
                    Enable versioning
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Fields</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddField}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Field
                  </Button>
                </div>
                {formData.fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 border rounded-lg text-center">
                    No fields added yet. Click &quot;Add Field&quot; to create your content structure.
                  </p>
                ) : (
                  <div className="border rounded-lg divide-y">
                    {formData.fields.map((field) => (
                      <div key={field.id} className="p-3 flex items-center justify-between hover:bg-accent">
                        <div className="flex-1">
                          <div className="font-medium">{field.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {field.name} ({field.type})
                            {field.required && <Badge variant="outline" className="ml-2">Required</Badge>}
                          </div>
                          {field.helpText && (
                            <div className="text-xs text-muted-foreground mt-1">{field.helpText}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleEditField(field)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteField(field.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setFormData(defaultFormData);
                  setEditingType(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingType ? "Update" : "Create"} Content Type
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Field Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentField ? "Edit Field" : "Add Field"}</DialogTitle>
            <DialogDescription>
              {currentField ? "Update field details" : "Define a new field for this content type"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fieldLabel">Field Label *</Label>
              <Input
                id="fieldLabel"
                value={fieldFormData.label}
                onChange={(e) => setFieldFormData({ ...fieldFormData, label: e.target.value })}
                placeholder="e.g., Title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldName">Field Name *</Label>
              <Input
                id="fieldName"
                value={fieldFormData.name}
                onChange={(e) =>
                  setFieldFormData({
                    ...fieldFormData,
                    name: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  })
                }
                placeholder="e.g., title"
              />
              <p className="text-xs text-muted-foreground">
                Used as the field key in the database
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fieldType">Field Type</Label>
              <Select
                value={fieldFormData.type}
                onValueChange={(value) => setFieldFormData({ ...fieldFormData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text (Short)</SelectItem>
                  <SelectItem value="textarea">Textarea (Long)</SelectItem>
                  <SelectItem value="richtext">Rich Text Editor</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="datetime">Date & Time</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="select">Select Dropdown</SelectItem>
                  <SelectItem value="media">Media (Image/File)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="helpText">Help Text</Label>
              <Input
                id="helpText"
                value={fieldFormData.helpText}
                onChange={(e) => setFieldFormData({ ...fieldFormData, helpText: e.target.value })}
                placeholder="Optional help text for content editors"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="fieldRequired"
                checked={fieldFormData.required}
                onCheckedChange={(checked) =>
                  setFieldFormData({ ...fieldFormData, required: checked })
                }
              />
              <Label htmlFor="fieldRequired" className="font-normal">
                Required field
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveField}>
              {currentField ? "Update" : "Add"} Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
