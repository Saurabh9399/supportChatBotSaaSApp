import Link from "next/link";
import { ChatWidget } from "@/modules/chat";
import { APP_CONFIG } from "@/config";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

const DEMO_TENANT_ID = "demo-tenant-001";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex flex-col">

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-white font-semibold text-base sm:text-lg">{APP_CONFIG.name}</span>
            <Badge variant="info" className="hidden sm:inline-flex">Beta</Badge>
          </div>

          <nav className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10 text-xs sm:text-sm"
              >
                Dashboard
              </Button>
            </Link>
            <Button size="sm" className="shadow-lg text-xs sm:text-sm">
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 text-center">
        <Badge variant="info" className="mb-5 sm:mb-6 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5">
          AI-Powered Customer Support
        </Badge>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6 max-w-3xl">
          Support that{" "}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            scales
          </span>{" "}
          with your business
        </h1>

        <p className="text-blue-100 text-base sm:text-lg max-w-xs sm:max-w-xl mb-8 sm:mb-10 leading-relaxed">
          Deploy intelligent AI chatbots for every customer. Multi-tenant, fully isolated,
          powered by your knowledge base.
        </p>

        <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-20 w-full max-w-xs xs:max-w-none">
          <Button size="lg" className="shadow-xl w-full xs:w-auto">
            Start free trial
          </Button>
          <Button variant="secondary" size="lg" className="w-full xs:w-auto">
            View documentation
          </Button>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl w-full">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="bg-white/5 border-white/10 text-left backdrop-blur-sm">
              <CardBody className="p-4 sm:p-5">
                <div className="text-xl sm:text-2xl mb-2">{feature.icon}</div>
                <p className="text-white font-semibold text-sm mb-1">{feature.title}</p>
                <p className="text-blue-200 text-xs leading-relaxed">{feature.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-5 sm:py-6 text-center px-4">
        <p className="text-blue-300 text-xs">
          {APP_CONFIG.name} · v{APP_CONFIG.version} · Built with Next.js 14 + AI
        </p>
      </footer>

      {/* Live chatbot demo */}
      <ChatWidget tenantId={DEMO_TENANT_ID} chatbotName="SupportAI Demo" />
    </div>
  );
}

const FEATURES = [
  {
    icon: "🏢",
    title: "Multi-tenant",
    description: "Each business gets a fully isolated workspace with its own data and chatbot.",
  },
  {
    icon: "🧠",
    title: "AI-powered",
    description: "Switch between Groq and OpenAI. Plugs into your existing knowledge base.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description: "Track conversations, resolution rates, and customer satisfaction at a glance.",
  },
];
