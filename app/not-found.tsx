import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-surface-elevated mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Page not found</h1>
        <p className="text-body-sm text-secondary mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded bg-accent px-8 py-3.5 text-body-sm font-bold text-white hover:bg-accent-hover transition-colors uppercase tracking-widest"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}





