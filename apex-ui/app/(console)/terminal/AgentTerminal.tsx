"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Terminal,
  Play,
  Square,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

type LineType =
  | "session_start"
  | "output"
  | "stderr"
  | "phase_change"
  | "session_end"
  | "session_cancelled"
  | "approval_needed"
  | "stream_end"
  | "error"
  | "user_input"
  | "raw";

interface TerminalLine {
  type: LineType;
  content?: string;
  phase?: string;
  status?: string;
  timestamp?: string;
  sessionId?: string;
  from?: string;
  to?: string;
  exitCode?: number;
  message?: string;
}

type SessionStatus = "idle" | "running" | "awaiting_approval" | "completed" | "failed" | "cancelled";

export default function AgentTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [phase, setPhase] = useState<"investigate" | "execute">("investigate");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when idle
  useEffect(() => {
    if (sessionStatus === "idle" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sessionStatus]);

  const addLine = useCallback((line: TerminalLine) => {
    setLines((prev) => [...prev, line]);
  }, []);

  const startSession = useCallback(
    async (prompt: string) => {
      setSessionStatus("running");
      setPhase("investigate");
      addLine({ type: "user_input", content: prompt, timestamp: new Date().toISOString() });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, action: "start" }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          addLine({ type: "error", message: err.error || "Failed to start session" });
          setSessionStatus("failed");
          return;
        }

        // Read SSE stream
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          addLine({ type: "error", message: "No response stream" });
          setSessionStatus("failed");
          return;
        }

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const event of events) {
            if (!event.startsWith("data: ")) continue;
            const jsonStr = event.slice(6);

            try {
              const data: TerminalLine = JSON.parse(jsonStr);

              // Handle special event types
              if (data.type === "session_start" && data.sessionId) {
                setSessionId(data.sessionId);
              } else if (data.type === "approval_needed") {
                setSessionStatus("awaiting_approval");
              } else if (data.type === "phase_change") {
                setPhase("execute");
              } else if (data.type === "stream_end") {
                setSessionStatus(
                  data.status === "completed" ? "completed" : data.status === "cancelled" ? "cancelled" : "failed"
                );
              }

              addLine(data);
            } catch {
              // Skip malformed JSON
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setSessionStatus("cancelled");
        } else {
          addLine({
            type: "error",
            message: err instanceof Error ? err.message : "Connection failed",
          });
          setSessionStatus("failed");
        }
      }
    },
    [addLine]
  );

  const approveChanges = useCallback(async () => {
    if (!sessionId) return;

    setSessionStatus("running");
    setPhase("execute");
    addLine({
      type: "user_input",
      content: "yes — approved changes",
      timestamp: new Date().toISOString(),
    });

    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", sessionId }),
      });

      if (!res.ok) {
        const err = await res.json();
        addLine({ type: "error", message: err.error || "Approval failed" });
        setSessionStatus("failed");
      }
    } catch (err) {
      addLine({
        type: "error",
        message: err instanceof Error ? err.message : "Approval request failed",
      });
      setSessionStatus("failed");
    }
  }, [sessionId, addLine]);

  const cancelSession = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    if (sessionId) {
      try {
        await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel", sessionId }),
        });
      } catch {
        // Best effort
      }
    }

    setSessionStatus("cancelled");
    addLine({
      type: "session_cancelled",
      timestamp: new Date().toISOString(),
    });
  }, [sessionId, addLine]);

  const resetTerminal = useCallback(() => {
    setLines([]);
    setSessionId(null);
    setSessionStatus("idle");
    setPhase("investigate");
    setInput("");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    if (sessionStatus === "idle" || sessionStatus === "completed" || sessionStatus === "failed" || sessionStatus === "cancelled") {
      setLines([]);
      setInput("");
      startSession(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "c" && e.ctrlKey && sessionStatus === "running") {
      e.preventDefault();
      cancelSession();
    }
  };

  // Parse Claude output for display
  function formatOutputContent(content: string): string {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === "assistant" && parsed.message) {
        // Extract text content from Claude's response
        if (Array.isArray(parsed.message.content)) {
          return parsed.message.content
            .filter((c: { type: string }) => c.type === "text")
            .map((c: { text: string }) => c.text)
            .join("\n");
        }
        return typeof parsed.message.content === "string"
          ? parsed.message.content
          : JSON.stringify(parsed.message, null, 2);
      }
      if (parsed.type === "tool_use") {
        return `[Tool: ${parsed.name}] ${JSON.stringify(parsed.input).substring(0, 200)}...`;
      }
      if (parsed.type === "tool_result") {
        const text = typeof parsed.content === "string"
          ? parsed.content.substring(0, 300)
          : JSON.stringify(parsed.content).substring(0, 300);
        return `[Result] ${text}`;
      }
      return content;
    } catch {
      return content;
    }
  }

  return (
    <div className="flex h-full flex-col bg-gray-950">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-semibold text-white">Agent Terminal</span>

          {/* Phase badge */}
          {sessionStatus !== "idle" && (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                phase === "investigate"
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-green-500/10 text-green-400"
              )}
            >
              {phase === "investigate" ? (
                <ShieldAlert className="h-3 w-3" />
              ) : (
                <ShieldCheck className="h-3 w-3" />
              )}
              {phase === "investigate" ? "Read-Only" : "Write Access"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status indicator */}
          {sessionStatus === "running" && (
            <span className="flex items-center gap-1 text-xs text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running
            </span>
          )}
          {sessionStatus === "completed" && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              Done
            </span>
          )}
          {sessionStatus === "failed" && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <XCircle className="h-3 w-3" />
              Failed
            </span>
          )}

          {/* Action buttons */}
          {sessionStatus === "running" && (
            <button
              onClick={cancelSession}
              className="rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30"
              title="Cancel (Ctrl+C)"
            >
              <Square className="h-3 w-3" />
            </button>
          )}
          {(sessionStatus === "completed" || sessionStatus === "failed" || sessionStatus === "cancelled") && (
            <button
              onClick={resetTerminal}
              className="rounded border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:bg-gray-800"
            >
              New Session
            </button>
          )}
        </div>
      </div>

      {/* Terminal output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto px-4 py-3 font-mono text-sm"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.length === 0 && (
          <div className="text-gray-600">
            <p>Apex Weather Agent Terminal</p>
            <p className="mt-1 text-gray-700">
              Type a command to start a Claude Code session.
            </p>
            <p className="text-gray-700">
              Phase 1: Read-only analysis. Phase 2: Approve to write.
            </p>
            <p className="mt-2 text-gray-700">
              Examples:
            </p>
            <p className="text-gray-600">
              {" "}agent check homepage for broken links
            </p>
            <p className="text-gray-600">
              {" "}evaluate weather rules for roofing trade
            </p>
            <p className="text-gray-600">
              {" "}audit convex schema for missing indexes
            </p>
          </div>
        )}

        {lines.map((line, i) => (
          <div key={i} className="py-0.5">
            {line.type === "user_input" && (
              <div className="flex items-center gap-2 text-green-400">
                <ChevronRight className="h-3 w-3" />
                <span>{line.content}</span>
              </div>
            )}

            {line.type === "output" && (
              <div className="whitespace-pre-wrap text-gray-300">
                {formatOutputContent(line.content || "")}
              </div>
            )}

            {line.type === "stderr" && (
              <div className="text-yellow-500/70">
                {line.content}
              </div>
            )}

            {line.type === "error" && (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-3 w-3 flex-shrink-0" />
                <span>{line.message}</span>
              </div>
            )}

            {line.type === "session_start" && (
              <div className="text-gray-600">
                Session {line.sessionId?.slice(0, 8)}... started
                <span className="ml-2 text-amber-400">[Read-Only Mode]</span>
              </div>
            )}

            {line.type === "phase_change" && (
              <div className="flex items-center gap-2 border-t border-green-900/30 pt-1 text-green-400">
                <ShieldCheck className="h-3 w-3" />
                <span>Write access granted — executing changes</span>
              </div>
            )}

            {line.type === "session_end" && (
              <div
                className={cn(
                  "mt-1 border-t border-gray-800 pt-1",
                  line.status === "completed" ? "text-green-400" : "text-red-400"
                )}
              >
                Session {line.status} (exit code: {line.exitCode})
              </div>
            )}

            {line.type === "session_cancelled" && (
              <div className="mt-1 border-t border-gray-800 pt-1 text-yellow-400">
                Session cancelled by user
              </div>
            )}

            {line.type === "stream_end" && (
              <div className="mt-1 text-gray-600">
                Stream closed — {line.status}
              </div>
            )}
          </div>
        ))}

        {/* Approval prompt */}
        {sessionStatus === "awaiting_approval" && (
          <div className="mt-3 rounded-lg border border-amber-800/50 bg-amber-900/10 p-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Changes proposed — approve to execute?</span>
            </div>
            <p className="mt-1 text-sm text-amber-400/70">
              Claude analyzed your codebase in read-only mode and wants to make
              changes. Review the output above, then approve or reject.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={approveChanges}
                className="flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Approve Changes
              </button>
              <button
                onClick={cancelSession}
                className="flex items-center gap-1 rounded border border-gray-700 px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-green-500" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              sessionStatus === "running"
                ? "Running... (Ctrl+C to cancel)"
                : "Enter a prompt for Claude Code..."
            }
            disabled={sessionStatus === "running" || sessionStatus === "awaiting_approval"}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none disabled:opacity-50"
            autoFocus
          />
          {sessionStatus !== "running" &&
            sessionStatus !== "awaiting_approval" && (
              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500 disabled:opacity-30"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            )}
        </div>
      </form>
    </div>
  );
}
