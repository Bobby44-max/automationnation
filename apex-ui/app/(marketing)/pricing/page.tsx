import Link from "next/link";

const tiers = [
  {
    name: "Storm Watch",
    price: "Free",
    description: "Get started with basic weather alerts",
    features: ["1 trade preset", "5 jobs/week", "Email notifications"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Clear Day",
    price: "$29/mo",
    description: "For solo operators who need reliability",
    features: [
      "1 trade preset",
      "Unlimited weather checks",
      "SMS + email notifications",
      "AI-generated messages",
    ],
    cta: "Start Trial",
    highlight: false,
  },
  {
    name: "All Clear",
    price: "$79/mo",
    description: "For growing crews with multiple trades",
    features: [
      "Unlimited trade presets",
      "Bulk reschedule actions",
      "Weather radar overlay",
      "Priority support",
    ],
    cta: "Start Trial",
    highlight: true,
  },
  {
    name: "Storm Command",
    price: "$149/mo",
    description: "For multi-crew operations",
    features: [
      "Weather windows optimizer",
      "Revenue scoring",
      "API access",
      "Custom integrations",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-20">
      <div className="mx-auto max-w-6xl text-center">
        <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
        <p className="mt-4 text-lg text-gray-400">
          Start free. Upgrade when your business grows.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-6 text-left ${
                tier.highlight
                  ? "border-blue-500 bg-blue-950/20"
                  : "border-gray-800 bg-gray-900"
              }`}
            >
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="mt-1 text-sm text-gray-400">{tier.description}</p>
              <p className="mt-4 text-3xl font-bold">{tier.price}</p>
              <ul className="mt-6 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="text-sm text-gray-300">
                    &bull; {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={`mt-6 block rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors ${
                  tier.highlight
                    ? "bg-blue-600 hover:bg-blue-500"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
