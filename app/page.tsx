import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Weather-Proof
          <br />
          <span className="text-blue-500">Your Business</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10">
          Automatically reschedule jobs when weather threatens your work.
          Protect revenue. Keep clients happy. Never lose a day to bad
          forecasts again.
        </p>
        <div className="flex gap-4">
          <Link
            href="/sign-up"
            className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold hover:bg-blue-500 transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="/sign-in"
            className="rounded-xl border border-gray-700 px-8 py-4 text-lg font-semibold text-gray-300 hover:bg-gray-900 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>
    </main>
  );
}
