// ============================================================
// APEX WEATHER SCHEDULING — TYPE DEFINITIONS
// ============================================================
// Mirrors the Convex schema. Used across frontend components.
// ============================================================

import type { Id } from "../convex/_generated/dataModel";

// --- Status & Enums ---

export type WeatherStatusColor = "green" | "yellow" | "red";
export type WeatherRecommendation = "proceed" | "proceed_with_caution" | "reschedule";
export type WeatherActionType = "rescheduled" | "notified" | "overridden" | "warning_sent";
export type RuleOperator = ">=" | "<=" | ">" | "<";
export type RuleAction = "cancel" | "warn" | "reschedule_route" | "cancel_chemical";
export type RiskTolerance = "conservative" | "moderate" | "aggressive";

export type PlanTier = "trial" | "solo" | "team" | "business";
export type UserRole = "owner" | "admin" | "dispatcher" | "crew_lead";
export type CrewRole = "crew_lead" | "member";
export type JobStatus = "scheduled" | "rescheduled" | "completed" | "cancelled";
export type NotificationChannel = "sms" | "email";
export type NotificationStatus = "sent" | "delivered" | "failed" | "pending";
export type RecipientType = "client" | "crew_lead" | "office";

export type TradeName =
  | "roofing"
  | "exterior_painting"
  | "landscaping"
  | "concrete"
  | "pressure_washing";

export type WeatherVariable =
  | "temperature_f"
  | "humidity_pct"
  | "wind_speed_mph"
  | "rain_probability_pct"
  | "dew_point_spread_f"
  | "soil_temperature_f";

// --- Weather Rule Types ---

export interface WeatherRuleCondition {
  variable: WeatherVariable;
  operator: RuleOperator;
  value: number;
}

export interface WeatherRule {
  variable: string;
  operator: string;
  value: number;
  action: string;
  reason: string;
  type?: "simple" | "compound";
  conditions?: WeatherRuleCondition[];
  logic?: "AND" | "OR";
}

export interface WeatherRulePreset {
  _id: Id<"weatherRules">;
  businessId?: Id<"businesses">;
  trade: string;
  rules: WeatherRule[];
  checkTimes: string[];
  notificationChain: string[];
  bulkActions?: boolean;
  riskTolerance?: RiskTolerance;
  isDefault: boolean;
}

// --- Weather Status Types ---

export interface TriggeredRule {
  variable: string;
  actual: number;
  threshold: number;
  action: string;
  reason: string;
  hour?: string;
}

export interface JobWeatherStatus {
  _id: Id<"jobWeatherStatus">;
  jobId: Id<"jobs">;
  businessId: Id<"businesses">;
  date: string;
  status: WeatherStatusColor;
  triggeredRules: TriggeredRule[];
  worstHour?: string;
  worstVariable?: string;
  recommendation: WeatherRecommendation;
  confidence: number;
  summary?: string;
  lastChecked: number;
  autoRescheduled: boolean;
  newDate?: string;
  overriddenBy?: string;
}

// --- Weather Action Types ---

export interface WeatherActionRule {
  variable: string;
  actual: number;
  threshold: number;
  reason: string;
}

export interface WeatherAction {
  _id: Id<"weatherActions">;
  jobId: Id<"jobs">;
  businessId: Id<"businesses">;
  actionType: WeatherActionType;
  fromDate: string;
  toDate?: string;
  reason: string;
  triggeredRules?: WeatherActionRule[];
  notificationsSent: number;
  revenueProtected?: number;
  wasAutomatic: boolean;
  timestamp: number;
}

// --- Weather Window Types ---

export interface WeatherConditions {
  avgTemp: number;
  avgHumidity: number;
  maxWind: number;
  rainProb: number;
}

export interface WeatherWindowSlot {
  date: string;
  startHour: number;
  endHour: number;
  confidence: number;
  conditions: WeatherConditions;
}

export interface WeatherWindow {
  _id: Id<"weatherWindows">;
  businessId: Id<"businesses">;
  location: string;
  trade: string;
  windows: WeatherWindowSlot[];
  generatedAt: number;
}

// --- Business & User Types ---

export interface Business {
  _id: Id<"businesses">;
  name: string;
  ownerId: string;
  timezone: string;
  primaryTrade: string;
  planTier: PlanTier;
  ownerEmail: string;
  ownerPhone?: string;
  isActive: boolean;
}

export interface User {
  _id: Id<"users">;
  clerkId: string;
  businessId: Id<"businesses">;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
}

// --- Client & Crew Types ---

export interface Client {
  _id: Id<"clients">;
  businessId: Id<"businesses">;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode: string;
}

export interface CrewMember {
  _id: Id<"crewMembers">;
  businessId: Id<"businesses">;
  name: string;
  phone: string;
  email?: string;
  role: CrewRole;
  isActive: boolean;
}

// --- Job Types ---

export interface Job {
  _id: Id<"jobs">;
  businessId: Id<"businesses">;
  clientId: Id<"clients">;
  crewLeadId?: Id<"crewMembers">;
  trade: string;
  jobType: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  address: string;
  zipCode: string;
  status: JobStatus;
  estimatedRevenue?: number;
  notes?: string;
  originalDate?: string;
}

export interface EnrichedJob extends Job {
  client: Client | null;
  crewLead: CrewMember | null;
  weatherStatus: JobWeatherStatus | null;
}

// --- Notification Types ---

export interface Notification {
  _id: Id<"notifications">;
  jobId?: Id<"jobs">;
  businessId: Id<"businesses">;
  recipientType: RecipientType;
  recipientName?: string;
  channel: NotificationChannel;
  to: string;
  message: string;
  status: NotificationStatus;
  externalId?: string;
  wasAiGenerated: boolean;
  timestamp: number;
}

// --- Dashboard Stats ---

export interface DashboardStats {
  rescheduled: number;
  proceeding: number;
  warnings: number;
  revenueProtected: number;
  totalJobs: number;
  lastChecked: number | null;
}
