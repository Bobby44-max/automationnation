'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-slate-50">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-900/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-teal-400 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">Rain Check</span>
            </div>
            <div className="hidden md:flex gap-8 text-sm text-white/90">
              <a href="#features" className="hover:text-sky-400 transition">Features</a>
              <a href="#pricing" className="hover:text-sky-400 transition">Pricing</a>
              <a href="#how-it-works" className="hover:text-sky-400 transition">How It Works</a>
            </div>
            <Link
              href="/sign-up"
              className="bg-sky-500 hover:bg-sky-600 px-6 py-2 rounded-lg font-semibold text-white transition transform hover:scale-105"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-24">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="container mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-sky-500/20 border border-sky-500/30 text-sky-300 px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-fade-in">
              ⚡ Trusted by 5,000+ contractors
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-slide-up">
              Stop losing money to
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-400 to-cyan-400 animate-gradient">
                weather delays
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Automated weather monitoring, instant rescheduling, and smart notifications for roofing, painting, landscaping, and concrete contractors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Link
                href="/sign-up"
                className="group bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 px-8 py-4 rounded-lg font-bold text-lg transition shadow-xl shadow-sky-500/30 transform hover:scale-105"
              >
                Get Started Free
                <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <button className="border-2 border-slate-600 hover:border-slate-500 hover:bg-slate-800 px-8 py-4 rounded-lg font-bold text-lg transition transform hover:scale-105">
                Watch Demo
              </button>
            </div>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-400 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free 30-day trial
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="container mx-auto px-6 pb-20 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700 p-4 transform hover:scale-[1.02] transition-transform duration-300">
              <div className="bg-slate-900 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-4">
                    <div className="text-green-400 text-sm font-semibold mb-1">GREEN</div>
                    <div className="text-2xl font-bold text-white">12</div>
                    <div className="text-xs text-slate-400">Safe to proceed</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-lg p-4">
                    <div className="text-yellow-400 text-sm font-semibold mb-1">YELLOW</div>
                    <div className="text-2xl font-bold text-white">3</div>
                    <div className="text-xs text-slate-400">Proceed with caution</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg p-4">
                    <div className="text-red-400 text-sm font-semibold mb-1">RED</div>
                    <div className="text-2xl font-bold text-white">2</div>
                    <div className="text-xs text-slate-400">Auto-reschedule</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-slate-800 rounded-lg p-3 flex items-center justify-between border-l-4 border-red-500">
                    <div>
                      <div className="text-white font-semibold">Roofing - 123 Main St</div>
                      <div className="text-sm text-slate-400">Tomorrow 8:00 AM • 35mph winds expected</div>
                    </div>
                    <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-semibold">
                      RESCHEDULE
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-6 -mt-16 relative z-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { value: '$47K', label: 'Average revenue protected per contractor annually', color: 'sky' },
            { value: '8 sec', label: 'Average response time to weather changes', color: 'teal' },
            { value: '94%', label: 'Reduction in weather-related client complaints', color: 'amber' }
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 transform hover:scale-105 hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`text-4xl font-bold text-${stat.color}-600 mb-2`}>{stat.value}</div>
              <div className="text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Add animations */}
      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out both;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out both;
        }
      `}</style>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Weather Intelligence Built for Contractors
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Stop guessing. Start protecting your revenue with automated weather monitoring and smart rescheduling.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              ),
              title: 'Trade-Specific Rules',
              description: 'Industry-researched thresholds for roofing (NRCA), painting, landscaping, and concrete. Each trade gets custom weather criteria.',
              color: 'sky'
            },
            {
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Auto-Reschedule',
              description: 'Red flag jobs automatically rescheduled to the next optimal weather window. Clients and crew notified instantly via SMS/email.',
              color: 'teal'
            },
            {
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              title: 'Revenue Protection Tracking',
              description: 'See exactly how much revenue Rain Check saved you. Full audit log of every weather-triggered action and rescheduled job.',
              color: 'purple'
            },
            {
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              ),
              title: 'Smart Notifications',
              description: 'AI-generated messages sent to clients and crew. Customizable notification chains with perfect timing to reduce no-shows.',
              color: 'amber'
            },
            {
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              ),
              title: 'Hourly Precision',
              description: 'Check conditions every 3 hours (or custom intervals). Get alerted to weather changes before your crew even loads the truck.',
              color: 'rose'
            },
            {
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: 'Multi-Tenant Security',
              description: 'Built on Clerk + Convex for enterprise-grade data isolation. Your data, your rules. SOC 2 compliance ready.',
              color: 'green'
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 hover:shadow-xl hover:border-sky-200 transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className={`w-16 h-16 bg-gradient-to-br from-${feature.color}-400 to-${feature.color}-600 rounded-xl flex items-center justify-center text-white mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How Rain Check Works</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Set it once, protect your revenue forever. 4 simple steps to weather-proof your business.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: '01',
                title: 'Set Your Rules',
                description: 'Choose your trade (roofing, painting, etc.) and we load industry-standard weather thresholds. Customize if needed.',
                icon: '⚙️'
              },
              {
                step: '02',
                title: 'Schedule Jobs',
                description: 'Add jobs with client info, crew assignments, and estimated revenue. Rain Check monitors weather 24/7.',
                icon: '📅'
              },
              {
                step: '03',
                title: 'Auto-Protect',
                description: 'When bad weather hits, jobs auto-reschedule to optimal windows. Clients and crew get instant SMS/email updates.',
                icon: '🛡️'
              },
              {
                step: '04',
                title: 'Track Savings',
                description: 'See exactly how much revenue you protected. Full audit log shows every weather action and rescheduled job.',
                icon: '📊'
              }
            ].map((step, i) => (
              <div key={i} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-sky-500 to-transparent"></div>
                )}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700 hover:border-sky-500 transition-all duration-300 h-full">
                  <div className="text-6xl mb-4">{step.icon}</div>
                  <div className="text-sky-400 font-bold text-sm mb-2">STEP {step.step}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-slate-300">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Start free, upgrade as you grow. No hidden fees, no long-term contracts.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {[
            {
              name: 'Free',
              price: '$0',
              description: 'Perfect for testing',
              features: [
                'Up to 10 jobs/month',
                'Basic weather rules',
                'Email notifications',
                '7-day weather forecast',
                'Community support'
              ],
              cta: 'Start Free',
              popular: false
            },
            {
              name: 'Starter',
              price: '$29',
              description: 'For small crews',
              features: [
                'Up to 50 jobs/month',
                'All trade presets',
                'SMS + Email notifications',
                '14-day weather forecast',
                'Priority email support',
                'Revenue tracking'
              ],
              cta: 'Start Trial',
              popular: false
            },
            {
              name: 'Pro',
              price: '$79',
              description: 'For growing businesses',
              features: [
                'Up to 200 jobs/month',
                'Custom weather rules',
                'Auto-reschedule engine',
                'AI chat advisor',
                'Phone + Email support',
                'Advanced analytics',
                'API access'
              ],
              cta: 'Start Trial',
              popular: true
            },
            {
              name: 'Business',
              price: '$149',
              description: 'For large operations',
              features: [
                'Unlimited jobs',
                'Multi-location support',
                'Dedicated success manager',
                'Custom integrations',
                'White-label options',
                'SLA guarantee',
                'Priority support 24/7'
              ],
              cta: 'Contact Sales',
              popular: false
            }
          ].map((tier, i) => (
            <div
              key={i}
              className={`relative bg-white rounded-xl shadow-lg p-8 border-2 transition-all duration-300 transform hover:scale-105 ${
                tier.popular
                  ? 'border-sky-500 shadow-sky-200'
                  : 'border-slate-200 hover:border-sky-300'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-500 to-teal-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  MOST POPULAR
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl font-bold text-slate-900">{tier.price}</span>
                  <span className="text-slate-600">/month</span>
                </div>
                <p className="text-slate-600">{tier.description}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-lg font-semibold transition ${
                tier.popular
                  ? 'bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white shadow-lg shadow-sky-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}>
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-slate-50 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Contractors Love Rain Check
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Join 5,000+ contractors protecting their revenue with automated weather intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "Rain Check saved us $68K in our first year. No more angry calls from clients about showing up in the rain. Game changer.",
                author: "Mike Rodriguez",
                role: "Owner, Rodriguez Roofing",
                location: "Phoenix, AZ"
              },
              {
                quote: "We used to lose 2-3 jobs a week to weather. Now Rain Check auto-reschedules and our clients love the proactive communication.",
                author: "Sarah Chen",
                role: "Operations Manager, Elite Paint Co",
                location: "Seattle, WA"
              },
              {
                quote: "The revenue tracking alone is worth 10x the price. I can finally show my CFO exactly how much weather delays were costing us.",
                author: "David Thompson",
                role: "VP Operations, Thompson Landscaping",
                location: "Atlanta, GA"
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-700 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                    <div className="text-sm text-slate-500">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Stop Losing Money to Weather?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join 5,000+ contractors protecting their revenue with Rain Check. Start your free 30-day trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="group bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 px-8 py-4 rounded-lg font-bold text-lg transition shadow-xl shadow-sky-500/30 transform hover:scale-105 inline-block"
            >
              Start Free Trial
              <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <button className="border-2 border-slate-600 hover:border-slate-500 hover:bg-slate-800 px-8 py-4 rounded-lg font-bold text-lg transition transform hover:scale-105">
              Schedule Demo
            </button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free 30-day trial
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-teal-400 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">Rain Check</span>
              </div>
              <p className="text-slate-400 text-sm">
                Weather intelligence for contractors. Protect your revenue, automate rescheduling, keep clients happy.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-sky-400 transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-sky-400 transition">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-sky-400 transition">How It Works</a></li>
                <li><a href="/integrations" className="hover:text-sky-400 transition">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="/about" className="hover:text-sky-400 transition">About</a></li>
                <li><a href="/blog" className="hover:text-sky-400 transition">Blog</a></li>
                <li><a href="/careers" className="hover:text-sky-400 transition">Careers</a></li>
                <li><a href="/contact" className="hover:text-sky-400 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="/privacy" className="hover:text-sky-400 transition">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-sky-400 transition">Terms of Service</a></li>
                <li><a href="/security" className="hover:text-sky-400 transition">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-400">
              © 2026 Rain Check. All rights reserved.
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-sky-400 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-sky-400 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-sky-400 transition">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
