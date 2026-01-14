"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, FileText, Image, Key, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CMSOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Management System</h1>
        <p className="text-muted-foreground mt-1">
          Manage your content, media, and API integrations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/cms/content-types">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Content Types
                </div>
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Define and manage your content structures and schemas
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/cms/contents">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content
                </div>
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create, edit, and publish your content with versioning
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/cms/media">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Media Library
                </div>
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload and organize images, videos, and documents
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/cms/api-tokens">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Tokens
                </div>
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage API access tokens for headless CMS integration
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started with CMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">1. Create Content Types</h3>
            <p className="text-sm text-muted-foreground">
              Define the structure of your content (e.g., Blog Posts, Products, Landing Pages)
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">2. Add Content</h3>
            <p className="text-sm text-muted-foreground">
              Create and manage your content entries with drafts and versioning
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">3. Upload Media</h3>
            <p className="text-sm text-muted-foreground">
              Add images, videos, and files to your media library
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">4. Generate API Tokens</h3>
            <p className="text-sm text-muted-foreground">
              Create tokens to access your content via API for headless integration
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
