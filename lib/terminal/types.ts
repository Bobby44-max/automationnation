/** Types for the Claude Code Agent Terminal system */

export type SessionPhase = "investigate" | "approve";
export type SessionStatus = "running" | "awaiting_approval" | "completed" | "error" | "terminated";

export interface AgentSession {
  id: string;
  status: SessionStatus;
  phase: SessionPhase;
  command: string;
  createdAt: number;
  lastUpdate: number;
}

export interface LogEntry {
  timestamp: number;
  output: string;
  type: "stdout" | "stderr" | "system" | "approval_request";
}

export interface StartRequest {
  command: string;
}

export interface StartResponse {
  id: string;
  status: SessionStatus;
}

export interface PollResponse {
  line: string | null;
  status: SessionStatus;
  phase: SessionPhase;
}

export interface ApproveResponse {
  status: string;
}

export interface CancelResponse {
  status: string;
}
