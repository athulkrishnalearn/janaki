import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Users,
  ClipboardList,
  DollarSign,
  Zap,
  Bot,
  CheckCircle2,
  ArrowRight,
  Clock,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "CRM & Contacts",
    description: "Manage leads, contacts, and deals with customizable pipelines. Track every interaction.",
  },
  {
    icon: ClipboardList,
    title: "Task Management",
    description: "Create, assign, and track tasks with Kanban boards. Auto-assign urgent tasks to available team members.",
  },
  {
    icon: Clock,
    title: "HR & Time Tracking",
    description: "Manage employees, track work hours, set targets, and monitor productivity in real-time.",
  },
  {
    icon: DollarSign,
    title: "Finance & Invoicing",
    description: "Create professional invoices, track expenses, and get real-time financial insights.",
  },
  {
    icon: Zap,
    title: "Automations",
    description: "Build custom workflows without code. Automate repetitive tasks and notifications.",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    description: "Chat with AI to create tasks, get summaries, and manage your work using natural language.",
  },
];

const benefits = [
  "All-in-one platform for your business",
  "No code customization for every team",
  "Multi-tenant SaaS ready",
  "Real-time collaboration",
  "Beautiful, modern interface",
  "Secure and scalable",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">JANAKI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Complete Business Management Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Everything your business needs,{" "}
            <span className="text-primary">in one place</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            CRM, HR, Tasks, Finance, Automations, and AI - all integrated into one powerful,
            customizable platform. Perfect for growing businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A complete ecosystem to manage every aspect of your business
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose JANAKI?</h2>
              <p className="text-muted-foreground">
                Built for modern businesses that want to scale efficiently
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 bg-white p-4 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid gap-8 md:grid-cols-4 text-center">
          <div>
            <BarChart3 className="h-8 w-8 mx-auto mb-3 text-primary" />
            <div className="text-3xl font-bold">6</div>
            <div className="text-muted-foreground">Modules</div>
          </div>
          <div>
            <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
            <div className="text-3xl font-bold">Unlimited</div>
            <div className="text-muted-foreground">Team Members</div>
          </div>
          <div>
            <Zap className="h-8 w-8 mx-auto mb-3 text-primary" />
            <div className="text-3xl font-bold">No-Code</div>
            <div className="text-muted-foreground">Customization</div>
          </div>
          <div>
            <Building2 className="h-8 w-8 mx-auto mb-3 text-primary" />
            <div className="text-3xl font-bold">Multi-Tenant</div>
            <div className="text-muted-foreground">Architecture</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your business?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join thousands of businesses already using JANAKI to streamline their operations.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} JANAKI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}