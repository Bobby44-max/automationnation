import { Sidebar } from "@/components/console/sidebar";
import { Topbar } from "@/components/console/topbar";

export const dynamic = "force-dynamic";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
