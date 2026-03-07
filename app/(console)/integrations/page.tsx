"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDemoBusiness } from "@/lib/demo-context";
import {
  Plug,
  Briefcase,
  Calendar,
  Receipt,
  Wrench,
  Home,
  ClipboardList,
  Check,
  X,
} from "lucide-react";

const SERVICES = [
  {
    key: "jobber",
    name: "Jobber",
    category: "CRM",
    description: "Sync clients, jobs, and invoices",
    icon: Briefcase,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    fields: [{ key: "apiKey", label: "API Key", placeholder: "jbr_live_..." }],
  },
  {
    key: "servicetitan",
    name: "ServiceTitan",
    category: "CRM",
    description: "Import service calls and customer records",
    icon: Wrench,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "st_api_..." },
      { key: "apiSecret", label: "Tenant ID", placeholder: "123456789" },
    ],
  },
  {
    key: "housecall_pro",
    name: "Housecall Pro",
    category: "CRM",
    description: "Pull in estimates, jobs, and client lists",
    icon: Home,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "hcp_key_..." },
    ],
  },
  {
    key: "google_calendar",
    name: "Google Calendar",
    category: "Productivity",
    description: "Sync crew availability and job schedules",
    icon: Calendar,
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    fields: [
      { key: "apiKey", label: "Client ID", placeholder: "xxxx.apps.googleusercontent.com" },
    ],
  },
  {
    key: "quickbooks",
    name: "QuickBooks",
    category: "Accounting",
    description: "Match rescheduled jobs to invoices",
    icon: Receipt,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "qb_prod_..." },
      { key: "apiSecret", label: "Company ID", placeholder: "9130348..." },
    ],
  },
] as const;

type ServiceKey = (typeof SERVICES)[number]["key"];

export default function IntegrationsPage() {
  const { businessId } = useDemoBusiness();
  const integrations = useQuery(
    api.weatherScheduling.getIntegrations,
    businessId ? { businessId } : "skip"
  );
  const connectMutation = useMutation(api.weatherScheduling.connectIntegration);
  const disconnectMutation = useMutation(api.weatherScheduling.disconnectIntegration);

  const [connectingService, setConnectingService] = useState<ServiceKey | null>(null);
  const [disconnectingService, setDisconnectingService] = useState<ServiceKey | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const connectedMap = new Map(
    (integrations ?? []).map((i) => [i.serviceName, i])
  );

  const activeService = SERVICES.find((s) => s.key === connectingService);

  async function handleConnect() {
    if (!businessId || !connectingService) return;
    setSaving(true);
    try {
      await connectMutation({
        businessId,
        serviceName: connectingService,
        apiKey: formValues.apiKey || "",
        apiSecret: formValues.apiSecret || undefined,
      });
      setConnectingService(null);
      setFormValues({});
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect(serviceKey: ServiceKey) {
    if (!businessId) return;
    setDisconnectingService(null);
    await disconnectMutation({ businessId, serviceName: serviceKey });
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <Plug className="h-5 w-5 text-accent" />
            {connectedMap.size > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Integrations</h1>
            <p className="text-[12px] text-muted mt-0.5">
              Connect your field service tools to automate weather-aware scheduling
            </p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="px-8 py-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            const connected = connectedMap.has(service.key);
            const integration = connectedMap.get(service.key);

            return (
              <div
                key={service.key}
                className="relative rounded-lg border border-white/[0.06] bg-surface-secondary/40 backdrop-blur-[40px] p-5 transition-all duration-200 hover:border-white/[0.10] hover:bg-surface-secondary/60"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md p-2 ${service.bgColor}`}>
                      <Icon className={`h-4.5 w-4.5 ${service.color}`} />
                    </div>
                    <div>
                      <h3 className="text-body font-semibold text-white">
                        {service.name}
                      </h3>
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider bg-white/[0.04] text-muted mt-0.5">
                        {service.category}
                      </span>
                    </div>
                  </div>

                  {connected ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                        <Check className="h-3 w-3" />
                        Connected
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setConnectingService(service.key);
                        setFormValues({});
                      }}
                      className="inline-flex items-center rounded-md px-3 py-1.5 text-[11px] font-semibold bg-accent text-white hover:bg-accent/90 transition-colors shrink-0"
                    >
                      Connect
                    </button>
                  )}
                </div>

                <p className="text-body-sm text-dim leading-relaxed">
                  {service.description}
                </p>

                {connected && integration && (
                  <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-[11px] text-muted">
                      Connected {new Date(integration.connectedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setDisconnectingService(service.key)}
                      className="text-[11px] text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-6 rounded bg-surface-secondary/30 border border-white/[0.04] px-5 py-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="h-4 w-4 text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-body-sm text-muted">
                Have a tool you want connected?{" "}
                <span className="text-accent font-medium">
                  Let us know
                </span>{" "}
                and we&apos;ll prioritize it on the roadmap.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      {connectingService && activeService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/[0.08] bg-[#1a1a1a] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`rounded-md p-2 ${activeService.bgColor}`}>
                  <activeService.icon className={`h-4.5 w-4.5 ${activeService.color}`} />
                </div>
                <h2 className="text-lg font-bold text-white">
                  Connect {activeService.name}
                </h2>
              </div>
              <button
                onClick={() => setConnectingService(null)}
                className="rounded p-1 hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4 text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              {activeService.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-[12px] font-medium text-muted mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={formValues[field.key] || ""}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-colors"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setConnectingService(null)}
                className="rounded-md px-4 py-2 text-sm text-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={saving || !formValues.apiKey}
                className="rounded-md px-4 py-2 text-sm font-semibold bg-accent text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirm */}
      {disconnectingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-white/[0.08] bg-[#1a1a1a] p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">
              Disconnect {SERVICES.find((s) => s.key === disconnectingService)?.name}?
            </h2>
            <p className="text-sm text-muted mb-5">
              This will remove the saved credentials. You can reconnect anytime.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDisconnectingService(null)}
                className="rounded-md px-4 py-2 text-sm text-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDisconnect(disconnectingService)}
                className="rounded-md px-4 py-2 text-sm font-semibold bg-red-500/80 text-white hover:bg-red-500 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
