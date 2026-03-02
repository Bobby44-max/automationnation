'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

interface LeadCaptureFormProps {
  source?: string;
}

export function LeadCaptureForm({ source = 'website' }: LeadCaptureFormProps) {
  const submitLead = useMutation(api.leads.submitLead);
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    setState('loading');
    try {
      await submitLead({
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim() || undefined,
        message: form.message.trim() || undefined,
        source,
      });
      setState('success');
      setForm({ name: '', email: '', company: '', message: '' });
    } catch {
      setState('error');
    }
  };

  if (state === 'success') {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto mb-4">
          <Check className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">We&apos;ll be in touch</h3>
        <p className="text-[#8B939E] text-sm">
          Thanks for reaching out. We typically respond within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 sm:p-8 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="lead-name" className="block text-[12px] text-[#5A6370] mb-1.5 font-medium">
            Name *
          </label>
          <input
            id="lead-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-[#0A0D10] border border-white/[0.06] rounded px-3.5 py-2.5 text-sm text-white placeholder:text-[#3A424D] focus:border-[#19AFFF] focus:outline-none transition-colors"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="lead-email" className="block text-[12px] text-[#5A6370] mb-1.5 font-medium">
            Email *
          </label>
          <input
            id="lead-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full bg-[#0A0D10] border border-white/[0.06] rounded px-3.5 py-2.5 text-sm text-white placeholder:text-[#3A424D] focus:border-[#19AFFF] focus:outline-none transition-colors"
            placeholder="you@company.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="lead-company" className="block text-[12px] text-[#5A6370] mb-1.5 font-medium">
          Company
        </label>
        <input
          id="lead-company"
          type="text"
          value={form.company}
          onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          className="w-full bg-[#0A0D10] border border-white/[0.06] rounded px-3.5 py-2.5 text-sm text-white placeholder:text-[#3A424D] focus:border-[#19AFFF] focus:outline-none transition-colors"
          placeholder="Your company"
        />
      </div>

      <div>
        <label htmlFor="lead-message" className="block text-[12px] text-[#5A6370] mb-1.5 font-medium">
          How can we help?
        </label>
        <textarea
          id="lead-message"
          rows={3}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="w-full bg-[#0A0D10] border border-white/[0.06] rounded px-3.5 py-2.5 text-sm text-white placeholder:text-[#3A424D] focus:border-[#19AFFF] focus:outline-none transition-colors resize-none"
          placeholder="Tell us about your automation needs..."
        />
      </div>

      {state === 'error' && (
        <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={state === 'loading'}
        className="w-full gradient-btn text-white font-semibold py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {state === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Book a Free Consultation
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
