"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDemoBusiness } from "@/lib/demo-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Users, HardHat, Trash2, Plus } from "lucide-react";

export default function SettingsPage() {
  const { businessId, businessName, isLoading } = useDemoBusiness();

  if (isLoading) {
    return (
      <div className="px-8 py-8">
        <div className="h-6 w-40 bg-[#151A1F] rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[#0E1216] rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="px-8 py-6 border-b border-white/[0.04]">
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-[12px] text-[#5A6370] mt-1">
          Manage your business profile, clients, and crew
        </p>
      </div>

      <div className="px-8 py-6 max-w-4xl space-y-10">
        {/* Business Profile */}
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <Building2 className="h-4 w-4 text-[#19AFFF]" />
            <h2 className="text-[15px] font-semibold tracking-tight">Business Profile</h2>
          </div>
          <div className="rounded bg-[#0E1216] border border-white/[0.04] p-5">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-[10px] text-[#5A6370] uppercase tracking-widest">Business Name</span>
                <p className="text-[15px] text-white font-medium mt-1">{businessName}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#5A6370] uppercase tracking-widest">Plan</span>
                <p className="text-[15px] text-[#19AFFF] font-medium mt-1">Pro — All Clear</p>
              </div>
            </div>
          </div>
        </section>

        {/* Clients */}
        {businessId && <ClientsSection businessId={businessId} />}

        {/* Crew Members */}
        {businessId && <CrewSection businessId={businessId} />}
      </div>
    </div>
  );
}

function ClientsSection({ businessId }: { businessId: any }) {
  const clients = useQuery(api.weatherScheduling.getClients, { businessId });
  const createClient = useMutation(api.weatherScheduling.createClient);
  const deleteClient = useMutation(api.weatherScheduling.deleteClient);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", zipCode: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.zipCode) return;
    setSaving(true);
    try {
      await createClient({
        businessId,
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        zipCode: form.zipCode,
      });
      setForm({ name: "", email: "", phone: "", address: "", city: "", state: "", zipCode: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create client:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(clientId: any) {
    if (!confirm("Remove this client?")) return;
    await deleteClient({ clientId, businessId });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Users className="h-4 w-4 text-emerald-400" />
          <h2 className="text-[15px] font-semibold tracking-tight">
            Clients{clients ? ` (${clients.length})` : ""}
          </h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3 w-3" />
          Add Client
        </Button>
      </div>

      {showForm && (
        <div className="rounded bg-[#0E1216] border border-white/[0.04] p-5 mb-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#5A6370] uppercase tracking-widest mb-1">Name *</label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Margaret Chen" required />
              </div>
              <div>
                <label className="block text-[10px] text-[#5A6370] uppercase tracking-widest mb-1">Phone</label>
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+13125550101" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#5A6370] uppercase tracking-widest mb-1">Email</label>
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="client@example.com" />
              </div>
              <div>
                <label className="block text-[10px] text-[#5A6370] uppercase tracking-widest mb-1">Zip Code *</label>
                <Input value={form.zipCode} onChange={(e) => update("zipCode", e.target.value)} placeholder="60601" required />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-[#5A6370] uppercase tracking-widest mb-1">Address</label>
                <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="1420 S Michigan Ave" />
              </div>
              <div>
                <label className="block text-[10px] text-[#5A6370] uppercase tracking-widest mb-1">City</label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Chicago" />
              </div>
              <div>
                <label className="block text-[10px] text-[#5A6370] uppercase tracking-widest mb-1">State</label>
                <Input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="IL" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving || !form.name || !form.zipCode}>
                {saving ? "Saving..." : "Save Client"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {clients && clients.length > 0 ? (
        <div className="space-y-1">
          {clients.map((c) => (
            <div
              key={c._id}
              className="rounded bg-[#0E1216] border border-white/[0.04] px-5 py-3.5 flex items-center justify-between hover:border-white/[0.08] transition-all duration-150"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] font-medium text-white">{c.name}</span>
                  <span className="text-[10px] text-[#5A6370] font-mono">{c.zipCode}</span>
                </div>
                <div className="text-[11px] text-[#3A424D] truncate mt-0.5">
                  {[c.address, c.city, c.state].filter(Boolean).join(", ")}
                  {c.phone && ` / ${c.phone}`}
                </div>
              </div>
              <button
                onClick={() => handleDelete(c._id)}
                className="p-2 text-[#3A424D] hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded bg-[#0E1216] border border-white/[0.04] py-10 text-center">
          <p className="text-[13px] text-[#5A6370]">No clients yet</p>
          <p className="text-[11px] text-[#3A424D] mt-1">Add clients to start scheduling jobs.</p>
        </div>
      )}
    </section>
  );
}

function CrewSection({ businessId }: { businessId: any }) {
  const crew = useQuery(api.weatherScheduling.getCrewMembers, { businessId });
  const createCrewMember = useMutation(api.weatherScheduling.createCrewMember);
  const deleteCrewMember = useMutation(api.weatherScheduling.deleteCrewMember);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "crew_lead" });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      await createCrewMember({
        businessId,
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        role: form.role,
      });
      setForm({ name: "", phone: "", email: "", role: "crew_lead" });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create crew member:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(crewMemberId: any) {
    if (!confirm("Remove this crew member?")) return;
    await deleteCrewMember({ crewMemberId, businessId });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <HardHat className="h-4 w-4 text-amber-400" />
          <h2 className="text-[15px] font-semibold tracking-tight">
            Crew Members{crew ? ` (${crew.length})` : ""}
          </h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3 w-3" />
          Add Crew
        </Button>
      </div>

      {showForm && (
        <div className="rounded bg-[#0E1216] border border-white/[0.04] p-5 mb-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#5A6370] uppercase tracking-widest mb-1">Name *</label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Mike Torres" required />
              </div>
              <div>
                <label className="block text-[10px] text-[#5A6370] uppercase tracking-widest mb-1">Phone *</label>
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+13125550110" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#5A6370] uppercase tracking-widest mb-1">Email</label>
                <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="mike@company.com" />
              </div>
              <div>
                <label className="block text-[10px] text-[#5A6370] uppercase tracking-widest mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                  className="w-full rounded border border-white/[0.06] bg-[#0E1216] px-3 py-2 text-sm text-white min-h-[40px] focus:outline-none focus:ring-1 focus:ring-[#19AFFF]"
                >
                  <option value="crew_lead">Crew Lead</option>
                  <option value="member">Member</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving || !form.name || !form.phone}>
                {saving ? "Saving..." : "Save Crew Member"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {crew && crew.length > 0 ? (
        <div className="space-y-1">
          {crew.map((m) => (
            <div
              key={m._id}
              className="rounded bg-[#0E1216] border border-white/[0.04] px-5 py-3.5 flex items-center justify-between hover:border-white/[0.08] transition-all duration-150"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] font-medium text-white">{m.name}</span>
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      m.role === "crew_lead"
                        ? "bg-amber-400/10 text-amber-400"
                        : "bg-white/[0.04] text-[#5A6370]"
                    }`}
                  >
                    {m.role === "crew_lead" ? "Lead" : "Member"}
                  </span>
                </div>
                <div className="text-[11px] text-[#3A424D] mt-0.5">
                  {m.phone}
                  {m.email && ` / ${m.email}`}
                </div>
              </div>
              <button
                onClick={() => handleDelete(m._id)}
                className="p-2 text-[#3A424D] hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded bg-[#0E1216] border border-white/[0.04] py-10 text-center">
          <p className="text-[13px] text-[#5A6370]">No crew members yet</p>
          <p className="text-[11px] text-[#3A424D] mt-1">Add crew to assign them to jobs.</p>
        </div>
      )}
    </section>
  );
}
