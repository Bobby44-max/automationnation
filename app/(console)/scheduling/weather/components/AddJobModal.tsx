"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TRADES = [
  { value: "roofing", label: "Roofing" },
  { value: "exterior_painting", label: "Exterior Painting" },
  { value: "landscaping", label: "Landscaping" },
  { value: "concrete", label: "Concrete" },
  { value: "pressure_washing", label: "Pressure Washing" },
];

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  businessId: Id<"businesses">;
}

export function AddJobModal({ open, onClose, businessId }: AddJobModalProps) {
  const clients = useQuery(
    api.weatherScheduling.getClients,
    businessId ? { businessId } : "skip"
  );
  const crew = useQuery(
    api.weatherScheduling.getCrewMembers,
    businessId ? { businessId } : "skip"
  );
  const createJob = useMutation(api.weatherScheduling.createJob);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientId: "" as string,
    trade: "roofing",
    title: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "17:00",
    address: "",
    zipCode: "",
    crewLeadId: "" as string,
    estimatedRevenue: "",
    notes: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Auto-fill address/zip from selected client
    if (field === "clientId" && clients) {
      const client = clients.find((c) => c._id === value);
      if (client) {
        setForm((prev) => ({
          ...prev,
          clientId: value,
          address: client.address || prev.address,
          zipCode: client.zipCode || prev.zipCode,
        }));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.title || !form.address || !form.zipCode) return;

    setSaving(true);
    try {
      await createJob({
        businessId,
        clientId: form.clientId as Id<"clients">,
        crewLeadId: form.crewLeadId
          ? (form.crewLeadId as Id<"crewMembers">)
          : undefined,
        trade: form.trade,
        jobType: "exterior",
        title: form.title,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        address: form.address,
        zipCode: form.zipCode,
        estimatedRevenue: form.estimatedRevenue
          ? parseFloat(form.estimatedRevenue)
          : undefined,
        notes: form.notes || undefined,
      });
      // Reset and close
      setForm({
        clientId: "",
        trade: "roofing",
        title: "",
        date: new Date().toISOString().split("T")[0],
        startTime: "08:00",
        endTime: "17:00",
        address: "",
        zipCode: "",
        crewLeadId: "",
        estimatedRevenue: "",
        notes: "",
      });
      onClose();
    } catch (err) {
      console.error("Failed to create job:", err);
    } finally {
      setSaving(false);
    }
  }

  const crewLeads = crew?.filter((c) => c.role === "crew_lead") ?? [];

  const selectClass =
    "w-full rounded border border-white/[0.06] bg-surface-secondary px-3 py-2 text-sm text-white min-h-[40px] focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-body font-bold text-white tracking-tight mb-5">Add Job</h2>

      {(!clients || clients.length === 0) && (
        <div className="rounded bg-amber-400/[0.06] border border-amber-400/10 p-3.5 mb-5">
          <p className="text-[12px] text-amber-400">
            No clients yet. Add clients in{" "}
            <a href="/settings" className="underline font-medium">
              Settings
            </a>{" "}
            first.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client */}
        <div>
          <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">Client *</label>
          <select
            value={form.clientId}
            onChange={(e) => update("clientId", e.target.value)}
            className={selectClass}
            required
          >
            <option value="">Select client...</option>
            {clients?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} â€” {c.zipCode}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">Job Title *</label>
          <Input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Full roof replacement"
            required
          />
        </div>

        {/* Trade + Crew Lead */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">Trade *</label>
            <select
              value={form.trade}
              onChange={(e) => update("trade", e.target.value)}
              className={selectClass}
            >
              {TRADES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">Crew Lead</label>
            <select
              value={form.crewLeadId}
              onChange={(e) => update("crewLeadId", e.target.value)}
              className={selectClass}
            >
              <option value="">None</option>
              {crewLeads.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Times */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">Date *</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">Start</label>
            <Input
              type="time"
              value={form.startTime}
              onChange={(e) => update("startTime", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">End</label>
            <Input
              type="time"
              value={form.endTime}
              onChange={(e) => update("endTime", e.target.value)}
            />
          </div>
        </div>

        {/* Address + Zip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">Job Address *</label>
            <Input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="1420 S Michigan Ave"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">Zip Code *</label>
            <Input
              value={form.zipCode}
              onChange={(e) => update("zipCode", e.target.value)}
              placeholder="60601"
              required
            />
          </div>
        </div>

        {/* Revenue + Notes */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">Est. Revenue ($)</label>
            <Input
              type="number"
              value={form.estimatedRevenue}
              onChange={(e) => update("estimatedRevenue", e.target.value)}
              placeholder="14500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted uppercase tracking-widest mb-1">Notes</label>
            <Input
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={saving || !form.clientId || !form.title || !form.zipCode}
          >
            {saving ? "Creating..." : "Create Job"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}





