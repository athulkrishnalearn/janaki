"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

interface Content {
  id: string;
  title: string;
  slug: string;
  status: string;
  data: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  contentType: ContentType;
}

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;
  
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    title: "",
    slug: "",
    status: "draft",
  });
  const [fieldData, setFieldData] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/cms/contents/${contentId}`);
        if (!response.ok) throw new Error("Failed to fetch content");
        
        const data = await response.json();
        setContent(data.content);
        
        const contentData = JSON.parse(data.content.data || "{}");
        setFormData({
          title: data.content.title,
          slug: data.content.slug,
          status: data.content.status,
          metaTitle: data.content.metaTitle || "",
          metaDescription: data.content.metaDescription || "",
          metaKeywords: data.content.metaKeywords || "",
        });
        setFieldData(contentData);
      } catch (error) {
        toast.error("Failed to fetch content");
        router.push("/dashboard/cms/contents");
      } finally {
        setLoading(false);
      }
    };

    if (contentId) {
      fetchContent();
    }
  }, [contentId, router]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    setIsSubmitting(true);

    try {
      const fields: Field[] = content.contentType.fields
        ? JSON.parse(content.contentType.fields)
        : [];
      
      // Validate required fields
      for (const field of fields) {
        if (field.required && !fieldData[field.name]) {
          toast.error(`${field.label} is required`);
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch(`/api/cms/contents/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          status: formData.status,
          data: JSON.stringify(fieldData),
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          metaKeywords: formData.metaKeywords,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update content");
      }

      toast.success("Content updated successfully");
      router.push("/dashboard/cms/contents");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update content");
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

  if (!content) {
    return null;
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
            <h1 className="text-3xl font-bold">Edit Content</h1>
            <p className="text-muted-foreground mt-1">{content.contentType.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  {content.contentType.enableDrafts && (
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
              const fields: Field[] = content.contentType.fields
                ? JSON.parse(content.contentType.fields)
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
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
