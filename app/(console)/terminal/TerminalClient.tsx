"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldCheck,
  Square,
  Send,
  Trash2,
  ChevronRight,
  Terminal,
  Loader2,
} from "lucide-react";
import type { LogEntry, SessionStatus, SessionPhase } from "@/lib/terminal/types";

interface TerminalLine {
  id: number;
  text: string;
  type: LogEntry["type"] | "input" | "error";
  timestamp: number;
}

export function TerminalClient() {
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus | "idle">("idle");
  const [phase, setPhase] = useState<SessionPhase>("investigate");
  const [lineCounter, setLineCounter] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLine = useCallback(
    (text: string, type: TerminalLine["type"] = "stdout") => {
      setLineCounter((prev) => {
        const newId = prev + 1;
        setLines((lines) => [
          ...lines,
          { id: newId, text, type, timestamp: Date.now() },
        ]);
        return newId;
      });
    },
    []
  );

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // SSE connection for streaming output
  useEffect(() => {
    if (!sessionId) return;

    const eventSource = new EventSource(
      `/api/agent/run?id=${encodeURIComponent(sessionId)}`
    );

    eventSource.onmessage = (e) => {
      try {
        const entry: LogEntry = JSON.parse(e.data);

        if (entry.type === "approval_request") {
          setStatus("awaiting_approval");
          setPhase("approve");
        }

        if (entry.type === "system" && entry.output.includes("Session completed")) {
          setStatus("completed");
        } else if (entry.type === "system" && entry.output.includes("Session error")) {
          setStatus("error");
        } else if (entry.type === "system" && entry.output.includes("Session terminated")) {
          setStatus("terminated");
        }

        addLine(entry.output, entry.type);
      } catch {
        addLine(e.data, "stdout");
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      if (status === "running") {
        addLine("[connection lost]", "system");
        setStatus("error");
      }
    };

    return () => {
      eventSource.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const startSession = async () => {
    const command = input.trim();
    if (!command) return;

    addLine(`> ${command}`, "input");
    setInput("");
    setStatus("running");
    setPhase("investigate");

    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });

      const data = await res.json();

      if (!res.ok) {
        addLine(`[error] ${data.error || "Failed to start session"}`, "error");
        setStatus("error");
        return;
      }

      setSessionId(data.id);
      addLine(`[session ${data.id.slice(0, 8)}] Agent started`, "system");
    } catch {
      addLine("[error] Could not reach agent server", "error");
      setStatus("error");
    }
  };

  const approveAction = async () => {
    if (!sessionId) return;

    try {
      const res = await fetch("/api/agent/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId }),
      });

      if (res.ok) {
        addLine("[approved] Write access granted", "system");
        setStatus("running");
      } else {
        addLine("[error] Approval failed", "error");
      }
    } catch {
      addLine("[error] Could not send approval", "error");
    }
  };

  const cancelSession = async () => {
    if (!sessionId) return;

    try {
      await fetch("/api/agent/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId }),
      });

      addLine("[terminated] Session cancelled", "system");
      setStatus("terminated");
      setSessionId(null);
    } catch {
      addLine("[error] Could not cancel session", "error");
    }
  };

  const clearTerminal = () => {
    setLines([]);
    setSessionId(null);
    setStatus("idle");
    setPhase("investigate");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (status === "idle" || status === "completed" || status === "error" || status === "terminated") {
        startSession();
      }
    }
  };

  const isSessionActive = status === "running" || status === "awaiting_approval";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-[#19AFFF]" />
          <h1 className="text-[15px] font-semibold text-white tracking-tight">
            Agent Terminal
          </h1>
          <StatusBadge status={status} />
        </div>

        <div className="flex items-center gap-2">
          <PhaseBadge phase={phase} status={status} />
          {isSessionActive && (
            <Button
              variant="danger"
              size="sm"
              onClick={cancelSession}
              className="gap-1.5"
            >
              <Square className="h-3 w-3" />
              Stop
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTerminal}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Terminal output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto px-6 py-4 font-mono text-sm leading-relaxed bg-[#0A0D10]"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.length === 0 && (
          <div className="text-[#3A424D] select-none">
            <p className="mb-2">Claude Code Agent Terminal v1.0</p>
            <p className="mb-1 text-[#5A6370]">
              Two-phase security model: Investigate (read-only) → Approve (write access)
            </p>
            <p className="text-[#3A424D]">
              Type a natural language command and press Enter to begin.
            </p>
          </div>
        )}

        {lines.map((line) => (
          <div
            key={line.id}
            className={cn(
              "whitespace-pre-wrap break-words py-0.5",
              line.type === "input" && "text-[#19AFFF]",
              line.type === "stdout" && "text-[#F0F2F4]",
              line.type === "stderr" && "text-amber-400",
              line.type === "system" && "text-[#5A6370] italic",
              line.type === "approval_request" &&
                "text-amber-400 font-semibold bg-amber-400/[0.05] px-2 py-1 rounded border border-amber-400/20",
              line.type === "error" && "text-red-400"
            )}
          >
            {line.text}
          </div>
        ))}

        {status === "running" && (
          <div className="flex items-center gap-2 text-[#5A6370] py-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">Agent processing...</span>
          </div>
        )}
      </div>

      {/* Approval bar */}
      {status === "awaiting_approval" && (
        <div className="flex items-center gap-3 px-6 py-3 bg-amber-400/[0.05] border-t border-amber-400/20">
          <ShieldCheck className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="flex-1 text-sm text-amber-400">
            Agent requests write access. Review the proposed changes above.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={approveAction}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button variant="danger" size="sm" onClick={cancelSession}>
            Deny
          </Button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-t border-white/[0.06] bg-[#0E1216]">
        <ChevronRight className="h-4 w-4 text-[#19AFFF] shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSessionActive}
          className={cn(
            "flex-1 bg-transparent text-[#F0F2F4] font-mono text-sm outline-none",
            "placeholder:text-[#3A424D] disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          placeholder={
            isSessionActive
              ? "Agent is running..."
              : "Enter a command for the agent..."
          }
          autoFocus
        />
        <Button
          variant="primary"
          size="sm"
          onClick={startSession}
          disabled={isSessionActive || !input.trim()}
          className="gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          Run
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SessionStatus | "idle" }) {
  const config: Record<
    string,
    { variant: "green" | "yellow" | "red" | "blue" | "gray"; label: string }
  > = {
    idle: { variant: "gray", label: "Ready" },
    running: { variant: "blue", label: "Running" },
    awaiting_approval: { variant: "yellow", label: "Awaiting Approval" },
    completed: { variant: "green", label: "Completed" },
    error: { variant: "red", label: "Error" },
    terminated: { variant: "gray", label: "Terminated" },
  };

  const { variant, label } = config[status] || config.idle;
  return <Badge variant={variant}>{label}</Badge>;
}

function PhaseBadge({
  phase,
  status,
}: {
  phase: SessionPhase;
  status: SessionStatus | "idle";
}) {
  if (status === "idle" || status === "completed" || status === "terminated") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium tracking-wide uppercase",
        phase === "investigate"
          ? "bg-[#19AFFF]/10 text-[#19AFFF]"
          : "bg-amber-400/10 text-amber-400"
      )}
    >
      {phase === "investigate" ? (
        <Shield className="h-3 w-3" />
      ) : (
        <ShieldCheck className="h-3 w-3" />
      )}
      {phase === "investigate" ? "Read-Only" : "Write Access"}
    </div>
  );
}
