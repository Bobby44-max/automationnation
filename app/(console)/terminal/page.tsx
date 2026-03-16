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
  ChevronDown,
  ChevronRight,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

// --- Types ---

type SessionState =
  | "idle"
  | "starting"
  | "running"
  | "waiting_approval"
  | "completed"
  | "error"
  | "cancelled";

interface ToolCard {
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
  requiresApproval: boolean;
  status: "pending" | "success" | "error" | "denied";
  result?: unknown;
  expanded: boolean;
}

interface OutputEntry {
  id: string;
  type: "text" | "tool" | "system" | "approval" | "error";
  // For text entries
  text?: string;
  // For tool entries
  toolCard?: ToolCard;
  timestamp: number;
}

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

let entryCounter = 0;
function nextId() {
  return `entry-${++entryCounter}`;
}

export default function AgentTerminalPage() {
  const { businessId, businessName, planTier, isLoading } = useDemoBusiness();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [entries, setEntries] = useState<OutputEntry[]>([]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const isProOrBusiness = planTier === "pro" || planTier === "business";
  const isActive =
    sessionState === "running" ||
    sessionState === "waiting_approval" ||
    sessionState === "starting";

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [entries]);

  // Focus input on mount
  useEffect(() => {
    if (isProOrBusiness && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isProOrBusiness]);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  // --- Helpers ---

  function addEntry(entry: Omit<OutputEntry, "id" | "timestamp">) {
    setEntries((prev) => [
      ...prev,
      { ...entry, id: nextId(), timestamp: Date.now() },
    ]);
  }

  function updateToolCard(
    toolUseId: string,
    updater: (card: ToolCard) => ToolCard
  ) {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.type === "tool" && e.toolCard?.toolUseId === toolUseId) {
          return { ...e, toolCard: updater(e.toolCard!) };
        }
        return e;
      })
    );
  }

  // --- SSE Connection ---

  const connectSSE = useCallback(
    (sid: string) => {
      // Close any existing connection
      eventSourceRef.current?.close();

      const es = new EventSource(`/api/agent?sessionId=${encodeURIComponent(sid)}`);
      eventSourceRef.current = es;

      // Accumulate text chunks into the last text entry for streaming feel
      let lastTextEntryId: string | null = null;

      es.addEventListener("text", (e) => {
        const data = JSON.parse(e.data);
        const chunk = data.text || "";

        // If the last entry was a text entry, append to it for streaming feel
        if (lastTextEntryId) {
          setEntries((prev) =>
            prev.map((entry) =>
              entry.id === lastTextEntryId
                ? { ...entry, text: (entry.text || "") + chunk }
                : entry
            )
          );
        } else {
          const id = nextId();
          lastTextEntryId = id;
          setEntries((prev) => [
            ...prev,
            { id, type: "text", text: chunk, timestamp: Date.now() },
          ]);
        }
      });

      es.addEventListener("tool_use", (e) => {
        // New tool call — reset text accumulation
        lastTextEntryId = null;

        const data = JSON.parse(e.data);
        const card: ToolCard = {
          toolUseId: data.toolUseId,
          toolName: data.toolName,
          input: data.input || {},
          requiresApproval: data.requiresApproval || false,
          status: "pending",
          expanded: false,
        };
        addEntry({ type: "tool", toolCard: card });
      });

      es.addEventListener("tool_result", (e) => {
        const data = JSON.parse(e.data);
        updateToolCard(data.toolUseId, (card) => ({
          ...card,
          result: data.result,
          status: data.isError
            ? "error"
            : data.result?.denied
              ? "denied"
              : "success",
        }));
      });

      es.addEventListener("approval_required", (e) => {
        lastTextEntryId = null;
        const data = JSON.parse(e.data);
        setSessionState("waiting_approval");
        addEntry({
          type: "approval",
          text: data.message || `Approve "${data.toolName}"?`,
        });
      });

      es.addEventListener("approval_resolved", (e) => {
        const data = JSON.parse(e.data);
        setSessionState("running");
        addEntry({
          type: "system",
          text: data.approved ? "Approved by user." : "Denied by user.",
        });
      });

      es.addEventListener("error", (e) => {
        lastTextEntryId = null;
        try {
          const me = e as MessageEvent;
          if (me.data) {
            const data = JSON.parse(me.data);
            addEntry({
              type: "error",
              text: data.message || "An error occurred",
            });
          } else {
            addEntry({ type: "error", text: "Connection error" });
          }
        } catch {
          addEntry({ type: "error", text: "Connection error" });
        }
        setSessionState("error");
      });

      es.addEventListener("done", (e) => {
        lastTextEntryId = null;
        let state = "completed";
        try {
          const data = JSON.parse(e.data);
          state = data.state || "completed";
        } catch {
          // ignore
        }
        setSessionState(state === "error" ? "error" : "completed");
        if (state !== "error") {
          addEntry({ type: "system", text: "Session completed." });
        }
        es.close();
        eventSourceRef.current = null;
      });

      // EventSource's native error event (connection lost)
      es.onerror = () => {
        // EventSource auto-reconnects, but if the server closed,
        // readyState will be CLOSED (2)
        if (es.readyState === EventSource.CLOSED) {
          lastTextEntryId = null;
          // Only show error if we didn't already get a "done" event
          setSessionState((prev) => {
            if (prev === "running" || prev === "starting") {
              addEntry({
                type: "error",
                text: "Lost connection to agent server.",
              });
              return "error";
            }
            return prev;
          });
          eventSourceRef.current = null;
        }
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // --- Actions ---

  async function startSession(command: string) {
    if (!businessId || !command.trim()) return;

    // Reset
    setEntries([]);
    setSessionState("starting");
    addEntry({ type: "system", text: `$ ${command}` });

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.trim(), businessId }),
      });

      const data = await res.json();

      if (!res.ok) {
        addEntry({
          type: "error",
          text: data.error || "Failed to start session",
        });
        setSessionState("error");
        return;
      }

      const sid = data.sessionId;
      setSessionId(sid);
      setSessionState("running");
      addEntry({
        type: "system",
        text: `Session started (${sid.slice(0, 8)}...)`,
      });

      // Connect to SSE stream
      connectSSE(sid);
    } catch {
      addEntry({
        type: "error",
        text: "Failed to connect to agent server",
      });
      setSessionState("error");
    }
  }

  async function handleApprove() {
    if (!sessionId) return;
    setSessionState("running");

    try {
      await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, approved: true }),
      });
    } catch {
      addEntry({ type: "error", text: "Failed to send approval" });
    }
  }

  async function handleDeny() {
    if (!sessionId) return;
    setSessionState("running");

    try {
      await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, approved: false }),
      });
    } catch {
      addEntry({ type: "error", text: "Failed to send denial" });
    }
  }

  function handleCancel() {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;

    if (sessionId) {
      // Best-effort cancel on the server (no cancel endpoint on God Server yet)
      fetch("/api/agent/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId }),
      }).catch(() => {});
    }

    setSessionState("cancelled");
    addEntry({ type: "system", text: "Session cancelled." });
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
        const newIndex = Math.min(
          historyIndex + 1,
          commandHistory.length - 1
        );
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
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setSessionId(null);
    setSessionState("idle");
    setEntries([]);
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
        {entries.length === 0 && sessionState === "idle" ? (
          // Suggested commands
          <div className="space-y-6">
            <div>
              <p className="text-muted text-xs uppercase tracking-widest font-bold mb-1">
                {businessName}
              </p>
              <p className="text-secondary text-sm">
                Type a command or pick a suggestion below. The agent can read
                your weather data, reschedule jobs, and send notifications.
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
          <div className="space-y-2">
            {entries.map((entry) => (
              <OutputEntryView
                key={entry.id}
                entry={entry}
                onToggleTool={(toolUseId) => {
                  setEntries((prev) =>
                    prev.map((e) =>
                      e.type === "tool" &&
                      e.toolCard?.toolUseId === toolUseId
                        ? {
                            ...e,
                            toolCard: {
                              ...e.toolCard!,
                              expanded: !e.toolCard!.expanded,
                            },
                          }
                        : e
                    )
                  );
                }}
              />
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
              isActive ? "Session in progress..." : "Type a command..."
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

function OutputEntryView({
  entry,
  onToggleTool,
}: {
  entry: OutputEntry;
  onToggleTool: (toolUseId: string) => void;
}) {
  if (entry.type === "text") {
    return (
      <div className="text-gray-100 whitespace-pre-wrap break-words">
        {entry.text}
      </div>
    );
  }

  if (entry.type === "system") {
    return (
      <div className="text-accent/60 italic whitespace-pre-wrap break-words">
        {entry.text}
      </div>
    );
  }

  if (entry.type === "error") {
    return (
      <div className="text-red-400 whitespace-pre-wrap break-words">
        {entry.text}
      </div>
    );
  }

  if (entry.type === "approval") {
    return (
      <div className="flex items-center gap-2 text-amber-400 font-bold">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="whitespace-pre-wrap break-words">{entry.text}</span>
      </div>
    );
  }

  if (entry.type === "tool" && entry.toolCard) {
    return (
      <ToolCardView card={entry.toolCard} onToggle={onToggleTool} />
    );
  }

  return null;
}

function ToolCardView({
  card,
  onToggle,
}: {
  card: ToolCard;
  onToggle: (toolUseId: string) => void;
}) {
  const borderColor = {
    pending: "border-amber-500/30",
    success: "border-emerald-500/30",
    error: "border-red-500/30",
    denied: "border-red-500/30",
  }[card.status];

  const statusIcon = {
    pending: (
      <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
    ),
    success: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
    error: <XCircle className="h-3.5 w-3.5 text-red-400" />,
    denied: <XCircle className="h-3.5 w-3.5 text-red-400" />,
  }[card.status];

  const statusLabel = {
    pending: "Running...",
    success: "Completed",
    error: "Error",
    denied: "Denied",
  }[card.status];

  return (
    <div
      className={`rounded border ${borderColor} bg-white/[0.02] overflow-hidden my-1`}
    >
      {/* Tool header — clickable to expand/collapse */}
      <button
        onClick={() => onToggle(card.toolUseId)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.02] transition-colors text-left"
      >
        {card.expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-white/40 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-white/40 shrink-0" />
        )}
        <Wrench className="h-3.5 w-3.5 text-accent shrink-0" />
        <span className="text-xs font-bold text-accent uppercase tracking-wider">
          {formatToolName(card.toolName)}
        </span>
        {card.requiresApproval && (
          <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded uppercase">
            Requires Approval
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-white/40">
          {statusIcon}
          <span>{statusLabel}</span>
        </span>
      </button>

      {/* Expanded details */}
      {card.expanded && (
        <div className="border-t border-white/[0.04] px-3 py-2 space-y-2">
          {/* Input params */}
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
              Input
            </p>
            <pre className="text-xs text-white/60 bg-black/30 rounded p-2 overflow-x-auto max-h-40">
              {JSON.stringify(card.input, null, 2)}
            </pre>
          </div>

          {/* Result */}
          {card.result !== undefined && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
                Result
              </p>
              <pre
                className={`text-xs rounded p-2 overflow-x-auto max-h-40 ${
                  card.status === "error" || card.status === "denied"
                    ? "text-red-300 bg-red-500/5"
                    : "text-emerald-300 bg-emerald-500/5"
                }`}
              >
                {typeof card.result === "string"
                  ? card.result
                  : JSON.stringify(card.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatToolName(name: string): string {
  return name.replace(/_/g, " ");
}
