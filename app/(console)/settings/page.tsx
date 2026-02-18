"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDemoBusiness } from "@/lib/demo-context";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Users, HardHat, Trash2, Plus } from "lucide-react";

export default function SettingsPage() {
  const { businessId, businessName, isLoading } = useDemoBusiness();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400">
          Manage your business profile, clients, and crew
        </p>
      </div>

      {/* Business Profile */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Business Profile</h2>
        </div>
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Business Name</span>
                <p className="text-white font-medium">{businessName}</p>
              </div>
              <div>
                <span className="text-gray-500">Plan</span>
                <p className="text-emerald-400 font-medium capitalize">Pro — All Clear</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Clients */}
      {businessId && <ClientsSection businessId={businessId} />}

      {/* Crew Members */}
      {businessId && <CrewSection businessId={businessId} />}
    </div>
  );
}

// ─── Clients Section ─────────────────────────────────────────

function ClientsSection({ businessId }: { businessId: any }) {
  const clients = useQuery(api.weatherScheduling.getClients, { businessId });
  const createClient = useMutation(api.weatherScheduling.createClient);
  const deleteClient = useMutation(api.weatherScheduling.deleteClient);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
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
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-400" />
          <h2 className="text-lg font-semibold text-white">
            Clients{clients ? ` (${clients.length})` : ""}
          </h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" />
          Add Client
        </Button>
      </div>

      {/* Add Client Form */}
      {showForm && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Name *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Margaret Chen"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Phone</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+13125550101"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Zip Code *</label>
                  <Input
                    value={form.zipCode}
                    onChange={(e) => update("zipCode", e.target.value)}
                    placeholder="60601"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs text-gray-400 mb-1">Address</label>
                  <Input
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="1420 S Michigan Ave"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">City</label>
                  <Input
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="Chicago"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">State</label>
                  <Input
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                    placeholder="IL"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving || !form.name || !form.zipCode}>
                  {saving ? "Saving..." : "Save Client"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Client List */}
      {clients && clients.length > 0 ? (
        <div className="space-y-2">
          {clients.map((c) => (
            <Card key={c._id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{c.name}</span>
                    <span className="text-xs text-gray-500 font-mono">{c.zipCode}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {[c.address, c.city, c.state].filter(Boolean).join(", ")}
                    {c.phone && ` · ${c.phone}`}
                    {c.email && ` · ${c.email}`}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c._id)}
                  className="p-2 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                  title="Remove client"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 text-sm">No clients yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Add clients to start scheduling weather-monitored jobs.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

// ─── Crew Section ────────────────────────────────────────────

function CrewSection({ businessId }: { businessId: any }) {
  const crew = useQuery(api.weatherScheduling.getCrewMembers, { businessId });
  const createCrewMember = useMutation(api.weatherScheduling.createCrewMember);
  const deleteCrewMember = useMutation(api.weatherScheduling.deleteCrewMember);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "crew_lead",
  });

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
        <div className="flex items-center gap-2">
          <HardHat className="h-5 w-5 text-yellow-400" />
          <h2 className="text-lg font-semibold text-white">
            Crew Members{crew ? ` (${crew.length})` : ""}
          </h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" />
          Add Crew
        </Button>
      </div>

      {/* Add Crew Form */}
      {showForm && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Name *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Mike Torres"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Phone *</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+13125550110"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="mike@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => update("role", e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="crew_lead">Crew Lead</option>
                    <option value="member">Member</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving || !form.name || !form.phone}>
                  {saving ? "Saving..." : "Save Crew Member"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Crew List */}
      {crew && crew.length > 0 ? (
        <div className="space-y-2">
          {crew.map((m) => (
            <Card key={m._id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{m.name}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.role === "crew_lead"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-gray-500/10 text-gray-400"
                      }`}
                    >
                      {m.role === "crew_lead" ? "Lead" : "Member"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {m.phone}
                    {m.email && ` · ${m.email}`}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(m._id)}
                  className="p-2 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                  title="Remove crew member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 text-sm">No crew members yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Add crew leads and members to assign them to jobs.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
