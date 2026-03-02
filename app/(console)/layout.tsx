import { ConsoleShell } from "@/components/console/console-shell";

export const dynamic = "force-dynamic";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsoleShell>{children}</ConsoleShell>;
}



