'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, MessageCircle, Mail, Send } from 'lucide-react';

const CRM_ENQUIRY_ENDPOINT = 'https://linearis.vercel.app/api/enquiries';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', message: '' });
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setNote('Please add your name and work email.');
      return;
    }
    setLoading(true);
    setNote('Sending your request...');
    try {
      const response = await fetch(CRM_ENQUIRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectKey: 'builddreams-crm',
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          whatsappConsent: whatsappConsent ? 'yes' : 'no',
          product: 'BuildDreams Website',
          page: 'Contact Page',
          sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      });
      if (!response.ok) throw new Error('Request failed');
      setForm({ name: '', email: '', company: '', phone: '', message: '' });
      setWhatsappConsent(false);
      setNote('Request received. It has been added to BuildDreams CRM.');
    } catch {
      setNote('Submission failed. Please try WhatsApp or email directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline bg-surface-card/90">
        <div className="mx-auto flex max-w-content items-center justify-between px-lg py-md lg:px-xl">
          <Link href="/" className="flex items-center">
            <Image src="/images/builddreams.png" alt="BuildDreams logo" width={40} height={40} className="h-10 w-auto" />
          </Link>
          <Link href="/products/" className="bg-transparent border border-hairline-strong text-ink font-body text-button h-10 px-md rounded-pill inline-flex items-center justify-center hover:bg-hairline-soft transition">Products</Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-content gap-xl px-lg py-section lg:grid-cols-12 lg:px-xl">
        <section className="lg:col-span-6">
          <p className="font-body text-caption-uppercase text-gradient-mint">CONTACT</p>
          <h1 className="font-display text-display-lg text-ink mt-md leading-[1.05]">
            Talk to <span className="font-display italic text-gradient-mint">BuildDreams</span>
          </h1>
          <p className="font-body text-body-md text-body mt-md max-w-xl leading-[1.8]">
            Reach us for SaaS product demos, custom workflow tools, WhatsApp communication management software, or enterprise software projects.
          </p>

          <div className="mt-lg grid gap-md">
            <a href="https://wa.me/919356873562?text=BuildDreams%20contact%20request" className="bg-surface-card border border-hairline rounded-xl p-md hover:shadow-soft transition" target="_blank" rel="noopener noreferrer">
              <div className="flex items-center gap-sm">
                <MessageCircle className="h-5 w-5 text-gradient-mint" />
                <div>
                  <div className="font-body text-title-sm text-ink">WhatsApp</div>
                  <div className="mt-xs font-body text-body-sm text-muted">+91 93568 73562</div>
                </div>
              </div>
            </a>
            <a href="mailto:suhomatech@gmail.com" className="bg-surface-card border border-hairline rounded-xl p-md hover:shadow-soft transition">
              <div className="flex items-center gap-sm">
                <Mail className="h-5 w-5 text-gradient-mint" />
                <div>
                  <div className="font-body text-title-sm text-ink">Email</div>
                  <div className="mt-xs font-body text-body-sm text-muted">suhomatech@gmail.com</div>
                </div>
              </div>
            </a>
          </div>

          <div className="mt-lg bg-canvas-soft border border-hairline rounded-xl p-md">
            <h2 className="font-body text-title-sm text-ink">WhatsApp communication policy</h2>
            <ul className="mt-sm space-y-xs font-body text-body-sm text-body leading-[1.7]">
              <li>We provide SaaS tools to help businesses manage their own WhatsApp communication.</li>
              <li>We do not send messages on behalf of users or provide bulk messaging services.</li>
              <li>All messaging requires user consent (opt-in).</li>
              <li>Our tools must not be used for spam, prohibited commerce, sensitive identifiers, or regulated data unless permitted by law and WhatsApp policy.</li>
              <li>Cloud API integrations require the customer&apos;s own approved WhatsApp Business account and approved templates where required.</li>
            </ul>
          </div>
        </section>

        <section className="lg:col-span-6">
          <form onSubmit={handleSubmit} className="bg-surface-card border border-hairline rounded-xl p-lg shadow-soft">
            <div className="grid gap-md md:grid-cols-2">
              <input required name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                className="bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition" />
              <input required name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Work email"
                className="bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition" />
              <input name="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Company" className="md:col-span-2 bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition" />
              <input name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone / WhatsApp number" className="md:col-span-2 bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-11 focus:outline-none focus:border-2 focus:border-primary transition" />
              <textarea name="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us what you want to build or evaluate"
                className="md:col-span-2 bg-surface-card border border-hairline-strong rounded-md font-body text-body-md text-ink px-md py-sm h-32 focus:outline-none focus:border-2 focus:border-primary transition resize-y" />
              <label className="md:col-span-2 flex gap-sm rounded-xl border border-hairline bg-canvas-soft p-md font-body text-body-sm text-body leading-[1.6] cursor-pointer">
                <input name="whatsappConsent" type="checkbox" checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-hairline-strong text-primary focus:border-primary" />
                <span>I consent to BuildDreams contacting me on WhatsApp about this enquiry. I understand I can opt out at any time.</span>
              </label>
            </div>
            <button className="bg-primary text-on-primary font-body text-button h-12 px-xl rounded-pill w-full inline-flex items-center justify-center gap-xs mt-md hover:bg-primary-active transition" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Request intro'} <Send className="h-4 w-4" />
            </button>
            {note && <p className="mt-sm font-body text-body-sm text-gradient-mint">{note}</p>}
          </form>
        </section>
      </main>

      <footer className="border-t border-hairline bg-surface-card py-section">
        <div className="mx-auto max-w-content px-lg lg:px-xl">
          <Link href="/" className="font-body text-body-sm text-muted hover:text-ink">&larr; Back to home</Link>
        </div>
      </footer>
    </div>
  );
}