import Link from "next/link";

const tiers = [
  {
    name: "Solo",
    price: "$59/mo",
    description: "For solo operators who can't afford weather surprises",
    features: [
      "1 trade preset",
      "15 jobs/day weather checks",
      "500 SMS + unlimited email",
      "AI-generated messages",
      "Auto-reschedule",
    ],
    cta: "Start 14-Day Free Trial",
    highlight: false,
  },
  {
    name: "Team",
    price: "$149/mo",
    description: "For growing crews running multiple trades",
    features: [
      "3 trade presets",
      "Unlimited jobs",
      "2,000 SMS/mo included",
      "Bulk reschedule actions",
      "Weather radar overlay",
      "Priority support",
    ],
    cta: "Start 14-Day Free Trial",
    highlight: true,
  },
  {
    name: "Business",
    price: "$299/mo",
    description: "For multi-crew operations at scale",
    features: [
      "Unlimited trades + jobs",
      "Unlimited SMS",
      "Weather windows optimizer",
      "Revenue scoring",
      "API access",
      "Custom integrations",
      "Dedicated support",
    ],
    cta: "Start 14-Day Free Trial",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-20">
      <div className="mx-auto max-w-6xl text-center">
        <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
        <p className="mt-4 text-lg text-gray-400">
          One cancelled job costs more than a year of Rain Check.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          14-day free trial on every plan. No credit card required.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
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
