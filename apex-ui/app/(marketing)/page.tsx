import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <h1 className="text-5xl font-bold tracking-tight">
        Weather-Smart Scheduling
      </h1>
      <p className="mt-4 max-w-lg text-center text-lg text-gray-400">
        Automatically reschedule outdoor jobs when weather threatens. Protect
        revenue, keep crews safe, and keep clients informed.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/sign-up"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500 transition-colors"
        >
          Get Started Free
        </Link>
        <Link
          href="/pricing"
          className="rounded-lg border border-gray-700 px-6 py-3 font-medium text-gray-300 hover:border-gray-500 transition-colors"
        >
          See Pricing
        </Link>
      </div>
    </div>
  );
}
