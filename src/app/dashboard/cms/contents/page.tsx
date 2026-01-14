"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { FileText, Loader2, Plus, Edit, Eye, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Content {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  contentType: {
    id: string;
    name: string;
    apiId: string;
  };
}

interface ContentType {
  id: string;
  name: string;
  apiId: string;
}

export default function ContentsPage() {
  const router = useRouter();
  const [contents, setContents] = useState<Content[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = async () => {
    try {
      const [contentsRes, typesRes] = await Promise.all([
        fetch("/api/cms/contents"),
        fetch("/api/cms/content-types"),
      ]);
      const contentsData = await contentsRes.json();
      const typesData = await typesRes.json();
      setContents(contentsData.contents || []);
      setContentTypes(typesData.contentTypes || []);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;

    try {
      const response = await fetch(`/api/cms/contents/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete content");
      toast.success("Content deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete content");
    }
  };

  const filteredContents = contents.filter((content) => {
    if (selectedType !== "all" && content.contentType.id !== selectedType) return false;
    if (statusFilter !== "all" && content.status !== statusFilter) return false;
    if (searchQuery && !content.title.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    return true;
  });

  const stats = {
    total: contents.length,
    published: contents.filter((c) => c.status === "published").length,
    draft: contents.filter((c) => c.status === "draft").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content</h1>
          <p className="text-muted-foreground mt-1">Manage all your content in one place</p>
        </div>
        <Button onClick={() => router.push("/dashboard/cms/contents/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Content
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Content</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Published</div>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Drafts</div>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Content Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content Types</SelectItem>
                {contentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No content found</h3>
              <p className="text-muted-foreground mb-4">
                {contents.length === 0
                  ? "Create your first content to get started"
                  : "Try adjusting your filters"}
              </p>
              {contents.length === 0 && (
                <Button onClick={() => router.push("/dashboard/cms/contents/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Content
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Content Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContents.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{content.title}</div>
                        <div className="text-xs text-muted-foreground">{content.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{content.contentType.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          content.status === "published"
                            ? "default"
                            : content.status === "draft"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {content.status}
                      </Badge>
                    </TableCell>
                    <TableCell>v{content.version}</TableCell>
                    <TableCell>{format(new Date(content.updatedAt), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/cms/contents/${content.id}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(content.id)}
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
    </div>
  );
}
