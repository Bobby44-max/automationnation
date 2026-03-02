import type { Metadata } from "next";
import { TerminalClient } from "./TerminalClient";

export const metadata: Metadata = {
  title: "Agent Terminal | Rain Check",
  description: "Claude Code Agent Terminal — Secure code analysis and modification",
};

export default function TerminalPage() {
  return <TerminalClient />;
}
