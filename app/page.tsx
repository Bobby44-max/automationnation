import { Navbar } from "@/components/landing/Navbar";
import { SplineHero } from "@/components/landing/SplineHero";
import { LeadCaptureForm } from "@/components/landing/LeadCaptureForm";
import { Footer } from "@/components/landing/Footer";
import Link from "next/link";

const SPLINE_SCENE_URL =
  "https://prod.spline.design/asJplmvhsg0TvCTn/scene.splinecode";

const stats = [
  { value: "50+", label: "Automations Built" },
  { value: "5,000+", label: "Users Served" },
  { value: "$2M+", label: "Revenue Protected" },
  { value: "24/7", label: "AI Systems Running" },
];

const services = [
  {
    icon: "\u26A1",
    title: "AI Workflow Automation",
    description:
      "End-to-end automation pipelines that eliminate manual tasks. From data ingestion to decision-making, we build systems that run themselves.",
  },
  {
    icon: "\uD83D\uDD27",
    title: "Custom SaaS Development",
    description:
      "Full-stack SaaS products built on the Elite Stack \u2014 Next.js, Convex, Clerk, Stripe. Production-ready in weeks, not months.",
  },
  {
    icon: "\uD83E\uDDE0",
    title: "AI Consulting & Strategy",
    description:
      "Strategic guidance on where AI fits your business. We identify the highest-ROI automation opportunities and build the roadmap.",
  },
  {
    icon: "\uD83D\uDD17",
    title: "Integration Engineering",
    description:
      "Connect your tools into a unified system. Stripe, Twilio, n8n, Supabase \u2014 we wire it all together with bulletproof reliability.",
  },
];

const steps = [
  {
    number: "01",
    title: "Discovery",
    description:
      "We audit your workflows, identify automation opportunities, and map the highest-impact areas where AI can transform your operations.",
  },
  {
    number: "02",
    title: "Build",
    description:
      "Our team architects and builds your AI systems using battle-tested patterns. Incremental delivery means you see progress weekly.",
  },
  {
    number: "03",
    title: "Launch & Scale",
    description:
      "We deploy to production, monitor performance, and continuously optimize. Your AI systems get smarter and more efficient over time.",
  },
];

const testimonials = [
  {
    quote:
      "AutomationNation built us an AI scheduling system that cut our manual coordination by 80%. Our team now focuses on what actually matters.",
    author: "Operations Director",
    company: "Regional Service Company",
  },
  {
    quote:
      "The Elite Stack they recommended is genuinely next-level. Real-time data, instant auth, seamless payments \u2014 all working together flawlessly.",
    author: "CTO",
    company: "Growing SaaS Startup",
  },
  {
    quote:
      "We went from idea to production SaaS in 6 weeks. Their process is dialed \u2014 discovery, build, launch. No wasted time.",
    author: "Founder",
    company: "AI-First Agency",
  },
];

export default function AutomationNationLanding() {
  return (
    <div className="min-h-screen bg-[#0A0D10] text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#19AFFF]/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <div className="relative z-10">
              <p className="text-sm font-semibold tracking-widest uppercase text-[#19AFFF] mb-4">
                AI Automation Consulting
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                We Build AI Systems{" "}
                <span className="gradient-text">That Run Your Business</span>
              </h1>
              <p className="text-lg text-gray-400 mb-8 max-w-lg">
                From custom SaaS products to intelligent workflow automation, we
                architect AI systems that eliminate manual work and scale your
                operations — built on the Elite Stack.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#contact"
                  className="gradient-btn px-8 py-4 rounded-xl text-center font-semibold text-lg"
                >
                  Book a Free Consultation
                </a>
                <a
                  href="#services"
                  className="px-8 py-4 rounded-xl text-center font-semibold text-lg border border-white/10 hover:border-white/25 transition-colors"
                >
                  See Our Services
                </a>
              </div>
            </div>

            {/* Right — Spline 3D */}
            <div className="relative z-10">
              <SplineHero sceneUrl={SPLINE_SCENE_URL} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold gradient-text mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services — Bento Grid */}
      <section id="services" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#19AFFF] mb-3">
              What We Do
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              AI-Powered Services for{" "}
              <span className="gradient-text">Modern Businesses</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We don&apos;t just consult — we build. Every engagement produces
              working AI systems deployed to production.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="glass-card p-8 rounded-2xl group hover:border-[#19AFFF]/20 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-[#19AFFF] transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Showcase — Rain Check */}
      <section id="products" className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7C3AED]/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#7C3AED] mb-3">
              Our Products
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              See Our Work{" "}
              <span className="gradient-text">In Production</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We don&apos;t just talk about AI — we ship it. Here&apos;s what
              we&apos;ve built.
            </p>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Product Info */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#19AFFF]/10 text-[#19AFFF] text-sm font-medium mb-6 w-fit">
                  <span className="w-2 h-2 rounded-full bg-[#19AFFF] animate-pulse" />
                  Live Product
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  Rain Check
                </h3>
                <p className="text-gray-400 mb-4 leading-relaxed">
                  AI-powered weather scheduling for outdoor service contractors.
                  Deterministic rule engine + AI voice assistant that
                  automatically reschedules jobs when weather threatens —
                  protecting revenue and keeping crews productive.
                </p>
                <ul className="space-y-2 mb-8 text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="text-[#19AFFF]">&#10003;</span>
                    Deterministic weather rule engine
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#19AFFF]">&#10003;</span>
                    AI voice rescheduling via Twilio + Ollama
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#19AFFF]">&#10003;</span>
                    Real-time crew & client notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#19AFFF]">&#10003;</span>
                    Built on the Elite Stack
                  </li>
                </ul>
                <Link
                  href="/products/rain-check"
                  className="gradient-btn px-6 py-3 rounded-xl text-center font-semibold w-fit"
                >
                  Learn More About Rain Check
                </Link>
              </div>

              {/* Product Visual */}
              <div className="relative bg-gradient-to-br from-[#19AFFF]/10 to-[#7C3AED]/10 p-8 lg:p-12 flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <div className="text-6xl mb-4">{"\uD83C\uDF26\uFE0F"}</div>
                  <p className="text-2xl font-bold mb-2">Rain Check</p>
                  <p className="text-gray-400">Weather-Smart Scheduling</p>
                  <div className="mt-6 flex justify-center gap-4">
                    <div className="glass-card px-4 py-2 rounded-lg text-sm">
                      <span className="text-[#19AFFF] font-bold">$59</span>
                      <span className="text-gray-500">/mo</span>
                    </div>
                    <div className="glass-card px-4 py-2 rounded-lg text-sm border-[#19AFFF]/30">
                      <span className="text-[#19AFFF] font-bold">$149</span>
                      <span className="text-gray-500">/mo</span>
                    </div>
                    <div className="glass-card px-4 py-2 rounded-lg text-sm">
                      <span className="text-[#19AFFF] font-bold">$299</span>
                      <span className="text-gray-500">/mo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section id="process" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#19AFFF] mb-3">
              Our Process
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How We <span className="gradient-text">Get It Done</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              A proven three-phase process that takes you from idea to
              production AI systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="glass-card p-8 rounded-2xl h-full">
                  <p className="text-5xl font-bold gradient-text opacity-50 mb-4">
                    {step.number}
                  </p>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#19AFFF]/3 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest uppercase text-[#19AFFF] mb-3">
              Results
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What Our <span className="gradient-text">Clients Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author}
                className="glass-card p-8 rounded-2xl"
              >
                <p className="text-gray-300 mb-6 leading-relaxed italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-white">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-gray-500">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Capture CTA */}
      <section id="contact" className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7C3AED]/5 to-[#19AFFF]/5 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to{" "}
              <span className="gradient-text">Automate Your Business?</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Book a free consultation. We&apos;ll audit your workflows,
              identify the biggest automation opportunities, and show you
              what&apos;s possible with AI.
            </p>
          </div>

          <LeadCaptureForm source="website" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
