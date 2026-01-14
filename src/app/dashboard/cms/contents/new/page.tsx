"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Save } from "lucide-react";
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
  fields: string;
  enableDrafts: boolean;
}

export default function NewContentPage() {
  const router = useRouter();
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    title: "",
    slug: "",
    status: "draft",
  });
  const [fieldData, setFieldData] = useState<Record<string, any>>({});

  useEffect(() => {
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

    fetchContentTypes();
  }, []);

  useEffect(() => {
    if (selectedTypeId) {
      const type = contentTypes.find((t) => t.id === selectedTypeId);
      setSelectedType(type || null);
      setFieldData({});
    }
  }, [selectedTypeId, contentTypes]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) {
      toast.error("Please select a content type");
      return;
    }

    setIsSubmitting(true);

    try {
      const fields = selectedType.fields ? JSON.parse(selectedType.fields) : [];
      
      // Validate required fields
      for (const field of fields) {
        if (field.required && !fieldData[field.name]) {
          toast.error(`${field.label} is required`);
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch("/api/cms/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug || generateSlug(formData.title),
          status: formData.status,
          contentTypeId: selectedType.id,
          data: JSON.stringify(fieldData),
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          metaKeywords: formData.metaKeywords,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create content");
      }

      toast.success("Content created successfully");
      router.push("/dashboard/cms/contents");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create content");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: Field) => {
    const value = fieldData[field.name] || "";

    switch (field.type) {
      case "text":
      case "email":
      case "url":
        return (
          <Input
            value={value}
            onChange={(e) => setFieldData({ ...fieldData, [field.name]: e.target.value })}
            placeholder={field.helpText || `Enter ${field.label.toLowerCase()}`}
            type={field.type}
            required={field.required}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => setFieldData({ ...fieldData, [field.name]: e.target.value })}
            placeholder={field.helpText || `Enter ${field.label.toLowerCase()}`}
            rows={4}
            required={field.required}
          />
        );

      case "richtext":
        return (
          <Textarea
            value={value}
            onChange={(e) => setFieldData({ ...fieldData, [field.name]: e.target.value })}
            placeholder={field.helpText || `Enter ${field.label.toLowerCase()}`}
            rows={8}
            required={field.required}
            className="font-mono"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setFieldData({ ...fieldData, [field.name]: e.target.value })}
            placeholder={field.helpText || `Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => setFieldData({ ...fieldData, [field.name]: e.target.value })}
            required={field.required}
          />
        );

      case "datetime":
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => setFieldData({ ...fieldData, [field.name]: e.target.value })}
            required={field.required}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value === true || value === "true"}
              onCheckedChange={(checked) =>
                setFieldData({ ...fieldData, [field.name]: checked })
              }
            />
            <Label className="font-normal">{field.helpText || "Toggle on/off"}</Label>
          </div>
        );

      case "json":
        return (
          <Textarea
            value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => setFieldData({ ...fieldData, [field.name]: e.target.value })}
            placeholder='{"key": "value"}'
            rows={6}
            className="font-mono"
            required={field.required}
          />
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => setFieldData({ ...fieldData, [field.name]: e.target.value })}
            placeholder={field.helpText || `Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Content</h1>
            <p className="text-muted-foreground mt-1">Add new content to your CMS</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="contentType">Select Content Type *</Label>
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a content type" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {contentTypes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No content types available. Create one first.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedType && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData({
                        ...formData,
                        title,
                        slug: formData.slug || generateSlug(title),
                      });
                    }}
                    placeholder="Enter content title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: generateSlug(e.target.value) })
                    }
                    placeholder="content-url-slug"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in the content URL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedType.enableDrafts && (
                        <SelectItem value="draft">Draft</SelectItem>
                      )}
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const fields: Field[] = selectedType.fields
                    ? JSON.parse(selectedType.fields)
                    : [];

                  if (fields.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground py-4">
                        No fields defined for this content type.
                      </p>
                    );
                  }

                  return fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {renderField(field)}
                      {field.helpText && (
                        <p className="text-xs text-muted-foreground">{field.helpText}</p>
                      )}
                    </div>
                  ));
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, metaTitle: e.target.value })
                    }
                    placeholder="SEO title for search engines"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, metaDescription: e.target.value })
                    }
                    rows={3}
                    placeholder="SEO description for search engines"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaKeywords">Meta Keywords</Label>
                  <Input
                    id="metaKeywords"
                    value={formData.metaKeywords || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, metaKeywords: e.target.value })
                    }
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Create Content
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
