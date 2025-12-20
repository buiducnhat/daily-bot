import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageSquare,
  Shield,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <span>Daily Bot</span>
          </div>
          <nav className="hidden items-center gap-6 font-medium text-sm md:flex">
            <a
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="#features"
            >
              Features
            </a>
            <a
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="#testimonials"
            >
              Testimonials
            </a>
            <a
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="#pricing"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/auth/sign-in">
              <Button size="sm" variant="ghost">
                Log in
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
          <div className="container relative z-10 mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <Badge
                className="mb-6 rounded-full px-4 py-1"
                variant="secondary"
              >
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary" />
                v2.0 is now live
              </Badge>
              <h1 className="mb-6 bg-linear-to-r from-foreground to-muted-foreground bg-clip-text pb-2 font-extrabold text-4xl text-transparent tracking-tight sm:text-6xl">
                Streamline Your Team's <br className="hidden sm:inline" />
                Daily Rituals Across All Platforms
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
                Automate standups, weekly check-ins, and pulse surveys directly
                where your team collaborates—Discord, Slack, Google Chat, or
                Telegram.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/dashboard">
                  <Button className="h-12 px-8 text-base" size="lg">
                    Add to Your Platform{" "}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  className="h-12 px-8 text-base"
                  size="lg"
                  variant="outline"
                >
                  View Demo
                </Button>
              </div>
              <div className="mt-12 flex items-center justify-center gap-8 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Free for small teams</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Setup in 2 minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Abstract Background Element */}
          <div className="-translate-x-1/2 -z-10 pointer-events-none absolute top-0 left-1/2 h-full w-full max-w-7xl overflow-hidden opacity-30">
            <div className="absolute top-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]" />
            <div className="absolute top-[20%] right-[20%] h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-[100px]" />
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-muted/30 py-24" id="features">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="mb-4 font-bold text-3xl tracking-tight">
                Everything you need to run agile teams
              </h2>
              <p className="text-lg text-muted-foreground">
                Built for modern teams on Discord, Slack, Telegram, and Google
                Chat.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                description="Run daily standups asynchronously without interrupting your team's flow zone. Timezone friendly."
                icon={<Clock className="h-6 w-6 text-primary" />}
                title="Async Standups"
              />
              <FeatureCard
                description="Automated end-of-week summaries and planning prompts to keep everyone aligned on goals."
                icon={<Calendar className="h-6 w-6 text-primary" />}
                title="Weekly Check-ins"
              />
              <FeatureCard
                description="Visualize participation rates, mood trends, and blockers over time with beautiful dashboards."
                icon={<BarChart className="h-6 w-6 text-primary" />}
                title="Team Analytics"
              />
              <FeatureCard
                description="Get summarized reports delivered to specific channels or DM'd to stakeholders instantly."
                icon={<Zap className="h-6 w-6 text-primary" />}
                title="Instant Reports"
              />
              <FeatureCard
                description="SOC2 compliant data handling with role-based permissions and audit logs for peace of mind."
                icon={<Shield className="h-6 w-6 text-primary" />}
                title="Enterprise Security"
              />
              <FeatureCard
                description="Tailor the questions to your team's needs. Supports text, mood ratings, and multiple choice."
                icon={<MessageSquare className="h-6 w-6 text-primary" />}
                title="Custom Questions"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-center text-primary-foreground md:p-16">
              <div className="relative z-10 mx-auto max-w-2xl">
                <h2 className="mb-6 font-bold text-3xl md:text-4xl">
                  Ready to optimize your workflow?
                </h2>
                <p className="mb-8 text-lg text-primary-foreground/80">
                  Join 10,000+ teams using Daily Bot to save time and improve
                  communication.
                </p>
                <Link to="/dashboard">
                  <Button
                    className="h-12 px-8 font-semibold text-foreground"
                    size="lg"
                    variant="secondary"
                  >
                    Start for Free
                  </Button>
                </Link>
                <div className="mt-6 text-sm opacity-70">
                  No credit card required · Cancel anytime
                </div>
              </div>

              {/* Decorative circles */}
              <div className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute right-0 bottom-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4 flex items-center gap-2 font-bold text-xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </div>
                <span>Daily Bot</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Making remote work work for teams everywhere.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Product</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <a className="hover:text-foreground" href="/">
                    Features
                  </a>
                </li>
                <li>
                  <a className="hover:text-foreground" href="/">
                    Pricing
                  </a>
                </li>
                <li>
                  <a className="hover:text-foreground" href="/">
                    Changelog
                  </a>
                </li>
                <li>
                  <a className="hover:text-foreground" href="/">
                    Docs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <a className="hover:text-foreground" href="/">
                    About
                  </a>
                </li>
                <li>
                  <a className="hover:text-foreground" href="/">
                    Blog
                  </a>
                </li>
                <li>
                  <a className="hover:text-foreground" href="/">
                    Careers
                  </a>
                </li>
                <li>
                  <a className="hover:text-foreground" href="/">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Legal</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <a className="hover:text-foreground" href="/">
                    Privacy
                  </a>
                </li>
                <li>
                  <a className="hover:text-foreground" href="/">
                    Terms
                  </a>
                </li>
                <li>
                  <a className="hover:text-foreground" href="/">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <Separator />
          <div className="flex flex-col items-center justify-between gap-4 pt-8 text-muted-foreground text-sm md:flex-row">
            <p>© 2024 Daily Bot. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a className="hover:text-foreground" href="/">
                Twitter
              </a>
              <a className="hover:text-foreground" href="/">
                GitHub
              </a>
              <a className="hover:text-foreground" href="/">
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-0 bg-background/50 shadow-sm backdrop-blur-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md">
      <CardHeader>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
