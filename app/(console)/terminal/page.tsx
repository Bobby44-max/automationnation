"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDemoBusiness } from "@/lib/demo-context";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUp,
  Lock,
  Zap,
} from "lucide-react";
import Link from "next/link";

// --- Types ---

type LineType = "stdout" | "stderr" | "system" | "approval_required" | "exit";

interface OutputLine {
  type: LineType;
  text: string;
  timestamp: number;
}

type SessionState =
  | "idle"
  | "starting"
  | "running"
  | "waiting_approval"
  | "completed"
  | "error"
  | "cancelled";

// --- Suggested Commands ---

const SUGGESTED_COMMANDS = [
  {
    label: "Check red jobs",
    command: "What are my red jobs today and should I reschedule them?",
  },
  {
    label: "Weather impact",
    command: "What's the weather impact on my schedule this week?",
  },
  {
    label: "Reschedule all red",
    command: "Reschedule all red jobs to the next available clear day",
  },
  {
    label: "Revenue at risk",
    command: "How much revenue is at risk from weather today?",
  },
  {
    label: "SMS notifications",
    command: "Send weather alerts to all affected customers",
  },
  {
    label: "Weekly forecast",
    command: "Give me a work-window forecast for the next 5 days",
  },
];

// --- Component ---

export default function AgentTerminalPage() {
  const { businessId, businessName, planTier, isLoading } = useDemoBusiness();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [pollOffset, setPollOffset] = useState(0);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const isProOrBusiness = planTier === "pro" || planTier === "business";
  const isActive =
    sessionState === "running" || sessionState === "waiting_approval" || sessionState === "starting";

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input on mount
  useEffect(() => {
    if (isProOrBusiness && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isProOrBusiness]);

  // --- Polling ---

  const pollSession = useCallback(
    async (id: string, offset: number) => {
      if (pollingRef.current) return;
      pollingRef.current = true;

      let currentOffset = offset;

      while (pollingRef.current) {
        try {
          const controller = new AbortController();
          abortRef.current = controller;

          const res = await fetch(
            `/api/agent?id=${encodeURIComponent(id)}&since=${currentOffset}`,
            { signal: controller.signal }
          );

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Unknown error" }));
            addLine("system", `Error: ${err.error || res.statusText}`);
            setSessionState("error");
            break;
          }

          const data = await res.json();

          // Append new lines
          if (data.lines && data.lines.length > 0) {
            const newLines: OutputLine[] = data.lines.map(
              (l: { type?: string; text?: string }) => ({
                type: (l.type || "stdout") as LineType,
                text: l.text || "",
                timestamp: Date.now(),
              })
            );
            setOutput((prev) => [...prev, ...newLines]);
            currentOffset = data.offset ?? currentOffset + data.lines.length;
            setPollOffset(currentOffset);
          }

          // Update state
          if (data.state) {
            const mappedState = mapVpsState(data.state);
            setSessionState(mappedState);

            if (
              mappedState === "completed" ||
              mappedState === "error" ||
              mappedState === "cancelled"
            ) {
              // Add exit line
              if (mappedState === "completed") {
                addLine("exit", "Session completed successfully.");
              } else if (mappedState === "cancelled") {
                addLine("system", "Session cancelled.");
              }
              break;
            }
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            break;
          }
          // Network error — wait and retry
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      pollingRef.current = false;
      abortRef.current = null;
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pollingRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // --- Actions ---

  function addLine(type: LineType, text: string) {
    setOutput((prev) => [...prev, { type, text, timestamp: Date.now() }]);
  }

  function mapVpsState(state: string): SessionState {
    switch (state) {
      case "running":
        return "running";
      case "waiting_approval":
        return "waiting_approval";
      case "completed":
      case "done":
        return "completed";
      case "error":
      case "failed":
        return "error";
      case "cancelled":
      case "killed":
        return "cancelled";
      default:
        return "running";
    }
  }

  async function startSession(command: string) {
    if (!businessId || !command.trim()) return;

    // Reset
    setOutput([]);
    setPollOffset(0);
    setSessionState("starting");
    addLine("system", `$ ${command}`);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.trim(), businessId }),
      });

      const data = await res.json();

      if (!res.ok) {
        addLine("system", `Error: ${data.error || "Failed to start session"}`);
        setSessionState("error");
        return;
      }

      const id = data.id;
      setSessionId(id);
      setSessionState("running");
      addLine("system", `Session started (${id.slice(0, 8)}...)`);

      // Start polling
      pollSession(id, 0);
    } catch {
      addLine("system", "Error: Failed to connect to agent server");
      setSessionState("error");
    }
  }

  async function handleApprove() {
    if (!sessionId) return;
    addLine("system", "Approved.");
    setSessionState("running");

    try {
      await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId }),
      });
    } catch {
      addLine("system", "Error: Failed to send approval");
    }
  }

  async function handleDeny() {
    if (!sessionId) return;
    await handleCancel();
  }

  async function handleCancel() {
    if (!sessionId) return;

    pollingRef.current = false;
    abortRef.current?.abort();

    try {
      await fetch("/api/agent/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId }),
      });
    } catch {
      // Best effort
    }

    setSessionState("cancelled");
    addLine("system", "Session cancelled.");
  }

  function handleSubmit() {
    const cmd = input.trim();
    if (!cmd || isActive) return;

    setCommandHistory((prev) => {
      const updated = [cmd, ...prev.filter((c) => c !== cmd)].slice(0, 50);
      return updated;
    });
    setHistoryIndex(-1);
    setInput("");
    startSession(cmd);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  }

  function handleNewSession() {
    setSessionId(null);
    setSessionState("idle");
    setOutput([]);
    setPollOffset(0);
    inputRef.current?.focus();
  }

  // --- Render ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Upgrade gate for starter tier
  if (!isProOrBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="max-w-md text-center space-y-6">
          <div className="h-16 w-16 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-muted" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Agent Terminal
            </h1>
            <p className="text-body-sm text-muted">
              Natural language commands for your weather scheduling. Reschedule
              jobs, check forecasts, send alerts — all with plain English.
            </p>
          </div>
          <div className="rounded bg-surface-secondary border border-white/[0.08] p-5 space-y-3">
            <p className="text-caption font-bold text-white uppercase tracking-widest">
              Available on
            </p>
            <div className="flex items-center justify-center gap-3">
              <Badge variant="green">All Clear — $129/mo</Badge>
              <Badge variant="yellow">Storm Command — $199/mo</Badge>
            </div>
          </div>
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 text-sm font-bold uppercase tracking-wider rounded transition-all min-h-[44px]"
          >
            <Zap className="h-4 w-4" />
            Upgrade Plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-white/[0.04] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-accent" />
          <h1 className="font-heading text-2xl font-black text-white uppercase italic tracking-tighter">
            Agent Terminal
          </h1>
          <SessionBadge state={sessionState} />
        </div>
        <div className="flex items-center gap-3">
          {isActive && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] rounded transition-all min-h-[44px]"
            >
              <Square className="h-3 w-3" />
              Cancel
            </button>
          )}
          {(sessionState === "completed" ||
            sessionState === "error" ||
            sessionState === "cancelled") && (
            <button
              onClick={handleNewSession}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] rounded transition-all min-h-[44px]"
            >
              New Session
            </button>
          )}
        </div>
      </div>

      {/* Output Area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed bg-[#010B14]"
        onClick={() => inputRef.current?.focus()}
      >
        {output.length === 0 && sessionState === "idle" ? (
          // Suggested commands
          <div className="space-y-6">
            <div>
              <p className="text-muted text-xs uppercase tracking-widest font-bold mb-1">
                {businessName}
              </p>
              <p className="text-secondary text-sm">
                Type a command or pick a suggestion below. The agent can
                read your weather data, reschedule jobs, and send
                notifications.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_COMMANDS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setInput(s.command);
                    inputRef.current?.focus();
                  }}
                  className="text-left rounded bg-white/[0.03] border border-white/[0.06] hover:border-accent/30 hover:bg-white/[0.05] px-4 py-3 transition-all group"
                >
                  <p className="text-xs font-bold text-accent group-hover:text-accent-hover uppercase tracking-wider mb-1">
                    {s.label}
                  </p>
                  <p className="text-caption text-muted line-clamp-1">
                    {s.command}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Session output
          <div className="space-y-0.5">
            {output.map((line, i) => (
              <TerminalLine key={i} line={line} />
            ))}

            {/* Approval buttons */}
            {sessionState === "waiting_approval" && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-amber-500/20">
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                  Approval Required
                </span>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all min-h-[44px]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  onClick={handleDeny}
                  className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all min-h-[44px]"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Deny
                </button>
              </div>
            )}

            {/* Running indicator */}
            {sessionState === "running" && (
              <div className="flex items-center gap-2 mt-1 text-accent/60">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs">Processing...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Command Input */}
      <div className="border-t border-white/[0.04] bg-[#010B14] px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-accent font-mono font-bold text-sm select-none">
            $
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isActive
                ? "Session in progress..."
                : "Type a command..."
            }
            disabled={isActive}
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSubmit}
            disabled={isActive || !input.trim()}
            className="flex items-center justify-center h-9 w-9 rounded bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function SessionBadge({ state }: { state: SessionState }) {
  switch (state) {
    case "idle":
      return null;
    case "starting":
      return (
        <Badge variant="blue">
          <Clock className="h-3 w-3 mr-1" />
          Starting
        </Badge>
      );
    case "running":
      return (
        <Badge variant="blue">
          <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse mr-1.5" />
          Running
        </Badge>
      );
    case "waiting_approval":
      return (
        <Badge variant="yellow">
          <Clock className="h-3 w-3 mr-1" />
          Awaiting Approval
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="green">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "error":
      return (
        <Badge variant="red">
          <XCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="gray">
          <Square className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return null;
  }
}

function TerminalLine({ line }: { line: OutputLine }) {
  const colorClass = {
    stdout: "text-gray-100",
    stderr: "text-amber-400",
    system: "text-accent/60 italic",
    approval_required: "text-amber-400 font-bold",
    exit: line.text.toLowerCase().includes("error")
      ? "text-red-400"
      : "text-emerald-400",
  }[line.type];

  return (
    <div className={`${colorClass} whitespace-pre-wrap break-words`}>
      {line.text}
    </div>
  );
}
