import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Send, LayoutDashboard, CheckCircle2, MessageCircleWarning, GitBranchPlus, BellRing, Inbox, Workflow, PlugZap, Bot, PackageCheck, Headphones, CalendarClock, Megaphone, MessagesSquare, Route, BarChart3, MessageCircle, Cloud, Blocks, Network, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-hairline bg-surface-card/92 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-content items-center justify-between gap-5 px-lg lg:px-xl">
          <Link href="/" className="flex items-center gap-sm" aria-label="Wirely home">
            <Image src="/images/builddreams.png" alt="BuildDreams logo" width={40} height={40} className="h-10 w-auto" />
            <span className="font-body text-caption-uppercase text-muted-soft hidden sm:inline">/ WIRELY</span>
          </Link>
          <nav className="hidden items-center gap-7 font-body text-body-sm text-body lg:flex">
            <Link href="#features" className="hover:text-ink">Features</Link>
            <Link href="#how-it-works" className="hover:text-ink">How it works</Link>
            <Link href="#compliance" className="hover:text-ink">Compliance</Link>
            <Link href="#integrations" className="hover:text-ink">Integrations</Link>
          </nav>
          <Link href="/auth/login" className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill inline-flex items-center gap-xs hover:bg-primary-active transition">
            Start WhatsApp Setup <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-canvas-deep text-on-dark">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)', backgroundSize: '72px 72px', opacity: 0.35 }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] pointer-events-none">
            <div className="gradient-orb gradient-orb-mint w-[500px] h-[500px] top-20 right-20 opacity-30" />
            <div className="gradient-orb gradient-orb-lavender w-[400px] h-[400px] -top-10 left-20 opacity-25" />
          </div>
          <div className="relative mx-auto grid max-w-content gap-xl px-lg py-section lg:grid-cols-12 lg:px-xl lg:py-section">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-xs border border-on-dark/15 bg-white/8 text-on-dark-soft rounded-pill px-sm py-xxs">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-mint" />
                <span className="font-body text-caption-uppercase">SAAS FOR OWNED WHATSAPP WORKFLOWS</span>
              </div>
              <h1 className="font-display text-display-mega text-on-dark mt-6 max-w-4xl leading-[1.02]">
                Wirely
              </h1>
              <p className="font-display text-display-sm text-gradient-mint mt-xs max-w-2xl">
                Connect once. Reach everywhere.
              </p>
              <p className="font-body text-body-md text-on-dark-soft mt-lg max-w-2xl leading-[1.75]">
                Automate customer communication, notifications, and support workflows using your own WhatsApp Business account.
              </p>
              <div className="mt-xl flex flex-col gap-sm sm:flex-row">
                <Link href="/contact" className="bg-gradient-mint text-canvas-deep font-body text-button h-12 px-xl rounded-pill inline-flex items-center gap-xs hover:opacity-90 transition">
                  Get WhatsApp API Access <Send className="h-4 w-4" />
                </Link>
                <Link href="#platform" className="border border-on-dark/15 bg-white/8 text-on-dark font-body text-button h-12 px-xl rounded-pill inline-flex items-center gap-xs hover:bg-white/12 transition">
                  View Platform <LayoutDashboard className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-lg grid max-w-2xl gap-sm font-body text-caption text-on-dark-soft sm:grid-cols-3">
                <div className="flex items-center gap-xs"><CheckCircle2 className="h-4 w-4 text-gradient-mint" /> Consent-first</div>
                <div className="flex items-center gap-xs"><CheckCircle2 className="h-4 w-4 text-gradient-mint" /> Own WABA</div>
                <div className="flex items-center gap-xs"><CheckCircle2 className="h-4 w-4 text-gradient-mint" /> Policy-aware</div>
              </div>
              <div className="mt-md flex flex-wrap gap-sm font-body text-caption text-on-dark-soft">
                <span className="rounded-pill border border-on-dark/15 bg-white/8 px-sm py-xs">Built for Indian businesses</span>
                <span className="rounded-pill border border-on-dark/15 bg-white/8 px-sm py-xs">Meta-compliant workflows</span>
                <span className="rounded-pill border border-on-dark/15 bg-white/8 px-sm py-xs">Secure API-based architecture</span>
              </div>
            </div>

            <div className="lg:col-span-5" id="platform">
              <div className="border border-white/12 bg-white/6 rounded-xxl p-md" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08)' }}>
                <div className="rounded-xl bg-canvas-deep p-md">
                  <div className="flex items-center justify-between border-b border-white/10 pb-md">
                    <div>
                      <div className="font-body text-caption-uppercase text-on-dark-soft">LIVE WORKSPACE</div>
                      <div className="mt-xs font-body text-title-md text-on-dark">Customer Support Inbox</div>
                    </div>
                    <span className="rounded-pill bg-gradient-mint/20 px-sm py-xs font-body text-caption-uppercase text-gradient-mint">Opt-in only</span>
                  </div>
                  <div className="mt-md grid gap-sm">
                    <div className="rounded-lg border border-white/10 bg-white/8 p-md">
                      <div className="flex items-center justify-between">
                        <span className="font-body text-title-sm text-on-dark">Order update workflow</span>
                        <Workflow className="h-4 w-4 text-gradient-mint" />
                      </div>
                      <div className="mt-md grid grid-cols-3 gap-xs text-center font-body text-caption text-on-dark-soft">
                        <span className="rounded-xl bg-white/8 p-sm">CRM event</span>
                        <span className="rounded-xl bg-white/8 p-sm">Template</span>
                        <span className="rounded-xl bg-white/8 p-sm">Own account</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/8 p-md">
                      <div className="font-body text-caption text-on-dark-soft">Recent opted-in conversation</div>
                      <div className="mt-sm space-y-xs font-body text-body-sm">
                        <div className="w-fit rounded-2xl bg-white/10 px-sm py-xs">Your appointment is confirmed for 4 PM.</div>
                        <div className="ml-auto w-fit rounded-2xl bg-gradient-mint px-sm py-xs text-canvas-deep">Thanks, see you then.</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-sm">
                      <div className="rounded-2xl bg-white/8 p-sm">
                        <div className="font-body text-display-sm text-on-dark">98%</div>
                        <div className="font-body text-caption text-on-dark-soft">Delivered</div>
                      </div>
                      <div className="rounded-2xl bg-white/8 p-sm">
                        <div className="font-body text-display-sm text-on-dark">24h</div>
                        <div className="font-body text-caption text-on-dark-soft">Service window</div>
                      </div>
                      <div className="rounded-2xl bg-white/8 p-sm">
                        <div className="font-body text-display-sm text-on-dark">0</div>
                        <div className="font-body text-caption text-on-dark-soft">Bulk tools</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BSP Disclaimer */}
        <section className="border-b border-hairline bg-surface-card py-lg">
          <div className="mx-auto max-w-content px-lg lg:px-xl">
            <div className="mb-lg rounded-xxl border border-gradient-mint/25 bg-[#f3f8f8] p-lg">
              <div className="flex flex-col gap-md md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-body text-caption-uppercase text-gradient-mint">NOT A BSP</div>
                  <p className="mt-sm font-body text-body-strong text-ink leading-[1.6]">
                    BuildDreams is not a WhatsApp Business Solution Provider (BSP). We provide software
                    tools that integrate with official WhatsApp APIs such as Meta Cloud API and approved providers.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-xs font-body text-caption text-body">
                  <span className="rounded-pill bg-surface-card px-sm py-xs">Built for Indian businesses</span>
                  <span className="rounded-pill bg-surface-card px-sm py-xs">Meta-compliant workflows</span>
                  <span className="rounded-pill bg-surface-card px-sm py-xs">Secure API-based architecture</span>
                </div>
              </div>
            </div>
            <div className="grid gap-md lg:grid-cols-4">
              <div className="bg-surface-card border border-hairline rounded-xl p-lg">
                <div className="font-body text-caption-uppercase text-muted">LEGAL NAME</div>
                <div className="mt-sm font-display text-display-sm text-ink">Builddreams Technologies</div>
                <p className="mt-xs font-body text-body-sm text-body leading-[1.65]">Registered MSME / Udyam enterprise in India.</p>
              </div>
              <div className="bg-surface-card border border-hairline rounded-xl p-lg">
                <div className="font-body text-caption-uppercase text-muted">UDYAM REGISTRATION</div>
                <div className="mt-sm font-display text-display-sm text-ink">UDYAM-MH-20-0340233</div>
                <p className="mt-xs font-body text-body-sm text-body leading-[1.65]">Micro enterprise · Services · Registered on 01/05/2026.</p>
              </div>
              <div className="bg-surface-card border border-hairline rounded-xl p-lg">
                <div className="font-body text-caption-uppercase text-muted">REGISTERED OFFICE</div>
                <div className="mt-sm font-display text-display-sm text-ink">Nagpur, Maharashtra, India</div>
                <p className="mt-xs font-body text-body-sm text-body leading-[1.65]">Plot no. 11, Maa Padmavati Nagar, Bokde Layout, Nagpur 440034.</p>
              </div>
              <div className="bg-surface-card border border-hairline rounded-xl p-lg">
                <div className="font-body text-caption-uppercase text-muted">CONTACT</div>
                <div className="mt-sm font-display text-display-sm text-ink">+91 97658 58403</div>
                <p className="mt-xs font-body text-body-sm text-body leading-[1.65]">
                  Email: <a href="mailto:info@builddreams.co.in" className="hover:text-ink">info@builddreams.co.in</a><br />
                  Website: https://builddreams.co.in
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="bg-canvas-soft py-section">
          <div className="mx-auto max-w-content px-lg lg:px-xl">
            <div className="grid gap-xl lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-xs bg-surface-card border border-hairline rounded-pill px-sm py-xxs">
                  <span className="font-body text-caption-uppercase text-body">LIVE PRODUCT PROOF</span>
                </div>
                <h2 className="font-display text-display-lg text-ink mt-md max-w-2xl leading-[1.08]">
                  Actual dashboard experience, embedded on the page.
                </h2>
                <p className="font-body text-body-md text-body mt-md max-w-2xl leading-[1.75]">
                  This dashboard preview shows the product surface businesses use for conversations, workflow setup, opt-in checks, template review, analytics, and integrations.
                </p>
              </div>
              <div className="lg:col-span-5">
                <div className="grid gap-sm sm:grid-cols-3 lg:grid-cols-1">
                  <div className="bg-surface-card border border-hairline rounded-xl p-md">
                    <div className="font-body text-caption-uppercase text-muted">STATUS</div>
                    <div className="mt-xs font-body text-title-sm text-ink">Operational dashboard</div>
                  </div>
                  <div className="bg-surface-card border border-hairline rounded-xl p-md">
                    <div className="font-body text-caption-uppercase text-muted">WORKFLOWS</div>
                    <div className="mt-xs font-body text-title-sm text-ink">Template + opt-in controls</div>
                  </div>
                  <div className="bg-surface-card border border-hairline rounded-xl p-md">
                    <div className="font-body text-caption-uppercase text-muted">INTEGRATIONS</div>
                    <div className="mt-xs font-body text-title-sm text-ink">Meta Cloud API / Twilio / MSG91</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-xl rounded-xxl border border-hairline bg-surface-card p-sm">
              <div className="w-full rounded-xl border border-hairline bg-surface-dark overflow-hidden min-h-[400px] md:min-h-[500px]">
                <div className="p-md">
                  <div className="grid min-h-[460px] rounded-2xl border border-white/10 bg-[#06194c] lg:grid-cols-[220px_1fr]">
                    <aside className="hidden border-r border-white/10 bg-[#04143f] p-md lg:block">
                      <div className="flex items-center gap-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-mint">
                          <MessageCircle className="h-5 w-5 text-canvas-deep" />
                        </div>
                        <div>
                          <div className="font-body text-title-sm text-on-dark">Wirely</div>
                          <div className="font-body text-caption-uppercase text-on-dark-soft">OWN WABA WORKSPACE</div>
                        </div>
                      </div>
                      <nav className="mt-lg space-y-sm font-body text-body-sm text-on-dark-soft">
                        <div className="flex items-center gap-sm rounded-xl bg-white/10 px-sm py-xs text-on-dark">
                          <LayoutDashboard className="h-4 w-4 text-gradient-mint" /> Overview
                        </div>
                        <div className="flex items-center gap-sm rounded-xl px-sm py-xs"><Inbox className="h-4 w-4" /> Inbox</div>
                        <div className="flex items-center gap-sm rounded-xl px-sm py-xs"><Workflow className="h-4 w-4" /> Workflows</div>
                        <div className="flex items-center gap-sm rounded-xl px-sm py-xs"><ShieldCheck className="h-4 w-4" /> Compliance</div>
                        <div className="flex items-center gap-sm rounded-xl px-sm py-xs"><PlugZap className="h-4 w-4" /> Integrations</div>
                      </nav>
                      <div className="mt-lg border border-white/10 bg-white/6 rounded-2xl p-md" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' }}>
                        <div className="font-body text-caption-uppercase text-on-dark-soft">ACCOUNT</div>
                        <div className="mt-xs font-body text-title-sm text-on-dark">Customer-owned WABA</div>
                        <div className="mt-sm rounded-pill bg-gradient-mint/18 px-sm py-xs font-body text-caption text-gradient-mint">Connected via Meta Cloud API</div>
                      </div>
                    </aside>
                    <section className="p-md md:p-lg">
                      <div className="flex flex-col gap-md border-b border-white/10 pb-md md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-body text-caption-uppercase text-on-dark-soft">DASHBOARD PREVIEW</div>
                          <h3 className="font-body text-title-md text-on-dark">WhatsApp workflow control center</h3>
                        </div>
                        <div className="flex flex-wrap gap-xs font-body text-caption">
                          <span className="rounded-pill bg-gradient-mint/18 px-sm py-xs text-gradient-mint">Opt-in required</span>
                          <span className="rounded-pill bg-white/8 px-sm py-xs text-on-dark-soft">No bulk sender</span>
                          <span className="rounded-pill bg-white/8 px-sm py-xs text-on-dark-soft">Not BSP</span>
                        </div>
                      </div>
                      <div className="mt-lg grid gap-md md:grid-cols-4">
                        <div className="border border-white/10 bg-white/6 rounded-2xl p-md" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' }}>
                          <div className="flex items-center justify-between">
                            <span className="font-body text-caption text-on-dark-soft">Opted-in contacts</span>
                            <Send className="h-4 w-4 text-gradient-mint" />
                          </div>
                          <div className="mt-xs font-body text-display-sm text-on-dark">1,284</div>
                          <div className="mt-xs font-body text-caption text-on-dark-soft">Imported with consent records</div>
                        </div>
                        <div className="border border-white/10 bg-white/6 rounded-2xl p-md" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' }}>
                          <div className="flex items-center justify-between">
                            <span className="font-body text-caption text-on-dark-soft">Approved templates</span>
                            <ShieldCheck className="h-4 w-4 text-gradient-mint" />
                          </div>
                          <div className="mt-xs font-body text-display-sm text-on-dark">12</div>
                          <div className="mt-xs font-body text-caption text-on-dark-soft">Transactional + support use</div>
                        </div>
                        <div className="border border-white/10 bg-white/6 rounded-2xl p-md" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' }}>
                          <div className="flex items-center justify-between">
                            <span className="font-body text-caption text-on-dark-soft">Active workflows</span>
                            <Workflow className="h-4 w-4 text-gradient-mint" />
                          </div>
                          <div className="mt-xs font-body text-display-sm text-on-dark">8</div>
                          <div className="mt-xs font-body text-caption text-on-dark-soft">Trigger-based automations</div>
                        </div>
                        <div className="border border-white/10 bg-white/6 rounded-2xl p-md" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' }}>
                          <div className="flex items-center justify-between">
                            <span className="font-body text-caption text-on-dark-soft">Bulk campaigns</span>
                            <div className="h-4 w-4 flex items-center justify-center text-gradient-mint">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.5 12A4.5 4.5 0 0 0 12 7.5M16.5 12A4.5 4.5 0 0 1 12 16.5M16.5 12H21M12 7.5A4.5 4.5 0 0 0 7.5 12M12 7.5V3M7.5 12A4.5 4.5 0 0 0 12 16.5M7.5 12H3M12 16.5V21"/></svg>
                            </div>
                          </div>
                          <div className="mt-xs font-body text-display-sm text-on-dark">0</div>
                          <div className="mt-xs font-body text-caption text-on-dark-soft">Not supported</div>
                        </div>
                      </div>
                      <div className="mt-md grid gap-md lg:grid-cols-2">
                        <div className="border border-white/10 bg-white/6 rounded-2xl p-md" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' }}>
                          <h4 className="font-body text-title-sm text-on-dark">Support inbox</h4>
                          <span className="mt-xs inline-block rounded-pill bg-gradient-mint/18 px-sm py-xs font-body text-caption text-gradient-mint">24h window open</span>
                          <div className="mt-md space-y-sm">
                            {[
                              { name: 'Riya Sharma', time: '2 min ago', msg: 'Can I reschedule tomorrow\'s appointment?' },
                              { name: 'Mahesh Retail', time: '8 min ago', msg: 'Please confirm dispatch for order #BD-2841.' },
                              { name: 'Nisha Patel', time: '14 min ago', msg: 'Thanks, I received the confirmation.' },
                            ].map((c, i) => (
                              <div key={i} className="bg-white/8 rounded-2xl p-md">
                                <div className="flex justify-between gap-md">
                                  <strong className="font-body text-body-sm text-on-dark">{c.name}</strong>
                                  <span className="font-body text-caption text-on-dark-soft">{c.time}</span>
                                </div>
                                <p className="mt-xs font-body text-body-sm text-on-dark-soft">{c.msg}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-md">
                          <div className="border border-white/10 bg-white/6 rounded-2xl p-md" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' }}>
                            <h4 className="font-body text-title-sm text-on-dark">Compliance checklist</h4>
                            <div className="mt-md space-y-sm font-body text-body-sm text-on-dark-soft">
                              <div className="flex gap-xs"><CheckCircle2 className="h-4 w-4 text-gradient-mint shrink-0" /> Opt-in source stored</div>
                              <div className="flex gap-xs"><CheckCircle2 className="h-4 w-4 text-gradient-mint shrink-0" /> Opt-out keyword enabled</div>
                              <div className="flex gap-xs"><CheckCircle2 className="h-4 w-4 text-gradient-mint shrink-0" /> Approved template selected</div>
                              <div className="flex gap-xs"><CheckCircle2 className="h-4 w-4 text-gradient-mint shrink-0" /> Customer WABA connected</div>
                            </div>
                          </div>
                          <div className="border border-white/10 bg-white/6 rounded-2xl p-md" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' }}>
                            <h4 className="font-body text-title-sm text-on-dark">Template review</h4>
                            <div className="mt-md bg-white/8 rounded-2xl p-md font-body text-body-sm text-on-dark-soft leading-[1.65]">
                              Hello &#123;&#123;name&#125;&#125;, your service request &#123;&#123;ticket_id&#125;&#125; has been updated to &#123;&#123;status&#125;&#125;.
                            </div>
                            <div className="mt-sm rounded-pill bg-gradient-mint/18 px-sm py-xs font-body text-caption text-gradient-mint">Service notification</div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem/Solution */}
        <section className="py-section">
          <div className="mx-auto grid max-w-content gap-xl px-lg lg:grid-cols-12 lg:px-xl">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-xs border border-hairline rounded-pill px-sm py-xxs">
                <span className="font-body text-caption-uppercase text-body">PROBLEM TO SOLUTION</span>
              </div>
              <h2 className="font-display text-display-lg text-ink mt-md leading-[1.08]">
                Manual WhatsApp work does not scale.
              </h2>
            </div>
            <div className="grid gap-md lg:col-span-7 md:grid-cols-2">
              <div className="bg-surface-card border border-hairline rounded-xl p-lg shadow-soft">
                <MessageCircleWarning className="h-6 w-6 text-gradient-mint" />
                <h3 className="font-display text-display-sm text-ink mt-md">The problem</h3>
                <p className="font-body text-body-md text-body mt-sm leading-[1.7]">
                  Teams handle updates, reminders, and support manually. Replies get missed, customers wait, and there is no structured view of consent, templates, or outcomes.
                </p>
              </div>
              <div className="bg-surface-card border border-hairline rounded-xl p-lg shadow-soft">
                <GitBranchPlus className="h-6 w-6 text-gradient-mint" />
                <h3 className="font-display text-display-sm text-ink mt-md">The solution</h3>
                <p className="font-body text-body-md text-body mt-sm leading-[1.7]">
                  Build workflows around your own WhatsApp Business account, connect business events, route conversations, and keep every message consent-based and auditable.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-canvas-soft py-section">
          <div className="mx-auto max-w-content px-lg lg:px-xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-xs border border-hairline rounded-pill px-sm py-xxs">
                <span className="font-body text-caption-uppercase text-body">FEATURES</span>
              </div>
              <h2 className="font-display text-display-lg text-ink mt-md leading-[1.08]">
                Everything needed for compliant communication workflows.
              </h2>
            </div>
            <div className="mt-xl grid gap-md md:grid-cols-2 lg:grid-cols-5">
              {[
                { icon: BellRing, title: 'Automated Notifications', desc: 'Trigger order, appointment, and service updates from your systems.' },
                { icon: Inbox, title: 'Customer Support Inbox', desc: 'Manage opted-in conversations, notes, assignment, and follow-ups.' },
                { icon: Workflow, title: 'Workflow Automation', desc: 'Build event-based flows for reminders, routing, and status changes.' },
                { icon: PlugZap, title: 'CRM Integration', desc: 'Connect enquiries, tickets, customers, and lifecycle events.' },
                { icon: Bot, title: 'AI-powered Responses', desc: 'Optional draft assistance for support teams, with human review paths.' },
              ].map((f, i) => (
                <div key={i} className="bg-surface-card border border-hairline rounded-xl p-lg hover:shadow-soft transition">
                  <f.icon className="h-6 w-6 text-gradient-mint" />
                  <h3 className="font-body text-title-sm text-ink mt-md">{f.title}</h3>
                  <p className="font-body text-body-sm text-body mt-sm leading-[1.65]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works (dark) */}
        <section id="how-it-works" className="bg-canvas-deep py-section text-on-dark">
          <div className="mx-auto max-w-content px-lg lg:px-xl">
            <div className="grid gap-xl lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div className="inline-flex items-center gap-xs border border-on-dark/15 bg-white/8 text-on-dark-soft rounded-pill px-sm py-xxs">
                  <span className="font-body text-caption-uppercase">HOW IT WORKS</span>
                </div>
                <h2 className="font-display text-display-lg text-on-dark mt-md leading-[1.08]">
                  A simple path that keeps the business in control.
                </h2>
                <div className="mt-lg flex flex-col gap-sm sm:flex-row lg:flex-col">
                  <Link href="/contact" className="bg-gradient-mint text-canvas-deep font-body text-button h-12 px-xl rounded-pill inline-flex items-center gap-xs hover:opacity-90 transition">
                    Start onboarding <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link href="/contact" className="border border-on-dark/15 bg-white/8 text-on-dark font-body text-button h-12 px-xl rounded-pill inline-flex items-center gap-xs hover:bg-white/12 transition">
                    Connect your WhatsApp account <PlugZap className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="grid gap-md lg:col-span-8 md:grid-cols-2">
                {[
                  { num: '01', title: 'Business signs up', desc: 'The business creates its Wirely workspace and defines its communication use cases.' },
                  { num: '02', title: 'Connects their own WhatsApp Business account', desc: 'Customers use their own approved WhatsApp Business account. BuildDreams is not a WhatsApp Business Solution Provider (BSP).' },
                  { num: '03', title: 'Creates message workflows', desc: 'Teams configure templates, triggers, assignment rules, and CRM actions for approved use cases.' },
                  { num: '04', title: 'Sends messages only to opted-in users', desc: 'All communication requires user consent, opt-out handling, and customer-owned compliance controls.' },
                ].map((step, i) => (
                  <div key={i} className="border border-white/12 bg-white/6 rounded-xl p-lg" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08)' }}>
                    <span className="font-body text-caption-uppercase text-gradient-mint">{step.num}</span>
                    <h3 className="font-display text-display-sm text-on-dark mt-md">{step.title}</h3>
                    <p className="font-body text-body-md text-on-dark-soft mt-sm leading-[1.7]">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* API Onboarding */}
        <section className="py-section">
          <div className="mx-auto max-w-content px-lg lg:px-xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-xs border border-hairline rounded-pill px-sm py-xxs">
                <span className="font-body text-caption-uppercase text-body">WHATSAPP API ONBOARDING</span>
              </div>
              <h2 className="font-display text-display-lg text-ink mt-md leading-[1.08]">
                How businesses get WhatsApp API access through the platform.
              </h2>
              <p className="font-body text-body-md text-body mt-md leading-[1.75]">
                Wirely provides the software layer for onboarding, workflows, inbox, and CRM integration. WhatsApp API access remains tied to the customer&apos;s own Meta Business and approved WhatsApp Business account.
              </p>
            </div>
            <div className="mt-xl grid gap-md md:grid-cols-2 lg:grid-cols-4">
              {[
                { num: '01', title: 'Business signs up', desc: 'The business creates a Wirely workspace and shares its communication use case.' },
                { num: '02', title: 'Connects Meta Business', desc: 'The business connects its own Meta Business and WhatsApp Business account.' },
                { num: '03', title: 'Gets API access', desc: 'API access is configured through official infrastructure and approved providers where applicable.' },
                { num: '04', title: 'Starts messaging', desc: 'Messages are sent only to opted-in users using approved templates and service-window rules.' },
              ].map((step, i) => (
                <div key={i} className="bg-surface-card border border-hairline rounded-xl p-lg shadow-soft">
                  <span className="font-body text-caption-uppercase text-gradient-mint">{step.num}</span>
                  <h3 className="font-body text-title-sm text-ink mt-md">{step.title}</h3>
                  <p className="font-body text-body-sm text-body mt-sm leading-[1.65]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Preview */}
        <section className="py-section">
          <div className="mx-auto max-w-content px-lg lg:px-xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-xs border border-hairline rounded-pill px-sm py-xxs">
                <span className="font-body text-caption-uppercase text-body">PLATFORM PREVIEW</span>
              </div>
              <h2 className="font-display text-display-lg text-ink mt-md leading-[1.08]">
                Real dashboard surfaces, not hidden automation.
              </h2>
            </div>
            <div className="mt-xl grid gap-md lg:grid-cols-3">
              <div className="bg-surface-card border border-hairline rounded-xl p-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-body text-title-md text-ink">Chat dashboard</h3>
                  <MessagesSquare className="h-5 w-5 text-gradient-mint" />
                </div>
                <div className="mt-lg space-y-sm">
                  <div className="rounded-2xl bg-canvas-soft p-sm font-body text-body-sm text-body">New opted-in support conversation</div>
                  <div className="rounded-2xl bg-canvas-soft p-sm font-body text-body-sm text-body">Assigned to Priya from Support</div>
                  <div className="rounded-2xl bg-canvas-soft p-sm font-body text-body-sm text-body">Follow-up scheduled after resolution</div>
                </div>
              </div>
              <div className="bg-surface-card border border-hairline rounded-xl p-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-body text-title-md text-ink">Automation flow</h3>
                  <Route className="h-5 w-5 text-gradient-mint" />
                </div>
                <div className="mt-lg grid gap-sm font-body text-body-sm text-body">
                  <div className="rounded-2xl border border-hairline p-sm">CRM event received</div>
                  <div className="ml-lg rounded-2xl border border-hairline p-sm">Approved template selected</div>
                  <div className="ml-xl rounded-2xl border border-hairline p-sm">Customer-owned account used</div>
                </div>
              </div>
              <div className="bg-surface-card border border-hairline rounded-xl p-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-body text-title-md text-ink">Message analytics</h3>
                  <BarChart3 className="h-5 w-5 text-gradient-mint" />
                </div>
                <div className="mt-lg space-y-md">
                  <div>
                    <div className="flex justify-between font-body text-caption text-muted"><span>Delivered</span><span>98%</span></div>
                    <div className="mt-xs h-2 rounded-full bg-hairline"><div className="h-2 w-[98%] rounded-full bg-success"></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between font-body text-caption text-muted"><span>Replies</span><span>42%</span></div>
                    <div className="mt-xs h-2 rounded-full bg-hairline"><div className="h-2 w-[42%] rounded-full bg-primary"></div></div>
                  </div>
                  <div className="rounded-2xl bg-canvas-soft p-sm font-body text-caption text-muted">Interface preview based on the Wirely workflow dashboard.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section id="compliance" className="bg-canvas-soft py-section">
          <div className="mx-auto max-w-content px-lg lg:px-xl">
            <div className="grid gap-xl lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="inline-flex items-center gap-xs bg-surface-card border border-hairline rounded-pill px-sm py-xxs">
                  <span className="font-body text-caption-uppercase text-body">WHATSAPP COMPLIANCE</span>
                </div>
                <h2 className="font-display text-display-lg text-ink mt-md leading-[1.08]">
                  Clear boundaries by design.
                </h2>
              </div>
              <div className="lg:col-span-7">
                <div className="bg-surface-card border border-hairline rounded-xl p-lg shadow-soft">
                  <p className="font-body text-body-strong text-ink leading-[1.8]">
                    We provide SaaS tools to help businesses manage their own WhatsApp communication.<br />
                    We do not send messages on behalf of users or provide bulk messaging services.<br />
                    All communication requires user consent (opt-in).<br />
                    Customers must use their own approved WhatsApp Business account and comply with WhatsApp policies.
                  </p>
                  <p className="mt-md rounded-2xl bg-canvas-soft p-md font-body text-body-strong text-ink leading-[1.7]">
                    BuildDreams is not a WhatsApp Business Solution Provider (BSP). We provide software tools that integrate with official WhatsApp APIs such as Meta Cloud API and approved providers.
                  </p>
                  <div className="mt-lg grid gap-sm font-body text-body-sm text-body md:grid-cols-2">
                    <div className="flex gap-xs"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> No bulk messaging service</div>
                    <div className="flex gap-xs"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> No third-party WhatsApp account resale</div>
                    <div className="flex gap-xs"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Opt-in and opt-out controls</div>
                    <div className="flex gap-xs"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> Customer-owned compliance responsibility</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-section">
          <div className="mx-auto max-w-content px-lg lg:px-xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-xs border border-hairline rounded-pill px-sm py-xxs">
                <span className="font-body text-caption-uppercase text-body">USE CASES</span>
              </div>
              <h2 className="font-display text-display-lg text-ink mt-md leading-[1.08]">
                Practical workflows for opted-in customers.
              </h2>
            </div>
            <div className="mt-xl grid gap-md md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: PackageCheck, title: 'Order updates', desc: 'Confirmations, shipping updates, delivery notices, and service status.' },
                { icon: Headphones, title: 'Customer support', desc: 'Route support conversations to agents with context and follow-up notes.' },
                { icon: CalendarClock, title: 'Appointment reminders', desc: 'Send reminders and confirmations to users who have opted in.' },
                { icon: Megaphone, title: 'Business notifications', desc: 'Operational alerts, status changes, and relevant customer updates.' },
              ].map((u, i) => (
                <div key={i} className="bg-surface-card border border-hairline rounded-xl p-lg hover:shadow-soft transition">
                  <u.icon className="h-6 w-6 text-gradient-mint" />
                  <h3 className="font-body text-title-sm text-ink mt-md">{u.title}</h3>
                  <p className="font-body text-body-sm text-body mt-sm leading-[1.65]">{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations (dark) */}
        <section id="integrations" className="bg-canvas-deep py-section text-on-dark">
          <div className="mx-auto grid max-w-content gap-xl px-lg lg:grid-cols-12 lg:px-xl">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-xs border border-on-dark/15 bg-white/8 text-on-dark-soft rounded-pill px-sm py-xxs">
                <span className="font-body text-caption-uppercase">INTEGRATIONS</span>
              </div>
              <h2 className="font-display text-display-lg text-on-dark mt-md leading-[1.08]">
                Connect through approved infrastructure.
              </h2>
            </div>
            <div className="lg:col-span-7">
              <div className="border border-white/12 bg-white/6 rounded-xl p-lg" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08)' }}>
                <p className="font-body text-body-strong text-on-dark leading-[1.75]">
                  Integrates with official WhatsApp Business API via approved providers such as Meta Cloud API, Twilio, or MSG91.
                </p>
                <div className="mt-lg grid gap-sm md:grid-cols-3">
                  <div className="rounded-2xl bg-white/8 p-md">
                    <Cloud className="h-5 w-5 text-gradient-mint" />
                    <div className="mt-sm font-body text-title-sm text-on-dark">Meta Cloud API</div>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-md">
                    <Blocks className="h-5 w-5 text-gradient-mint" />
                    <div className="mt-sm font-body text-title-sm text-on-dark">Twilio</div>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-md">
                    <Network className="h-5 w-5 text-gradient-mint" />
                    <div className="mt-sm font-body text-title-sm text-on-dark">MSG91</div>
                  </div>
                </div>
                <p className="mt-md font-body text-body-sm text-on-dark-soft leading-[1.7]">
                  Provider availability, account approval, template approval, pricing, and policy compliance remain subject to Meta, WhatsApp, and the selected provider&apos;s terms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Legal */}
        <section className="py-section">
          <div className="mx-auto max-w-content px-lg lg:px-xl">
            <div className="bg-surface-card border border-hairline rounded-xl p-lg md:p-xl shadow-soft">
              <div className="grid gap-lg md:grid-cols-2 md:items-center">
                <div>
                  <div className="inline-flex items-center gap-xs border border-hairline rounded-pill px-sm py-xxs">
                    <span className="font-body text-caption-uppercase text-body">TRUST & LEGAL</span>
                  </div>
                  <h2 className="font-display text-display-md text-ink mt-md leading-[1.08]">
                    Public policies for clear review.
                  </h2>
                </div>
                <div className="grid gap-sm sm:grid-cols-3">
                  <Link href="/privacy" className="bg-transparent border border-hairline-strong text-ink font-body text-button h-12 px-xl rounded-pill inline-flex items-center justify-center hover:bg-hairline-soft transition">Privacy</Link>
                  <Link href="/terms" className="bg-transparent border border-hairline-strong text-ink font-body text-button h-12 px-xl rounded-pill inline-flex items-center justify-center hover:bg-hairline-soft transition">Terms</Link>
                  <Link href="/contact" className="bg-transparent border border-hairline-strong text-ink font-body text-button h-12 px-xl rounded-pill inline-flex items-center justify-center hover:bg-hairline-soft transition">Contact</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section (dark) */}
        <section className="px-lg pb-section lg:px-xl">
          <div className="mx-auto max-w-content overflow-hidden rounded-xxl bg-canvas-deep p-xl md:p-xxl text-on-dark">
            <div className="grid gap-xl md:grid-cols-2 md:items-center">
              <div>
                <h2 className="font-display text-display-lg text-on-dark leading-[1.05]">
                  Start building your WhatsApp workflows
                </h2>
                <p className="font-body text-body-md text-on-dark-soft mt-md max-w-xl leading-[1.75]">
                  See how Wirely can turn opted-in customer communication into structured support, notification, and CRM workflows.
                </p>
              </div>
              <div className="flex justify-start">
                <Link href="/contact" className="bg-gradient-mint text-canvas-deep font-body text-button h-12 px-xl rounded-pill inline-flex items-center gap-xs hover:opacity-90 transition">
                  Start WhatsApp Setup <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-surface-card py-section">
        <div className="mx-auto flex max-w-content flex-col gap-md px-lg font-body text-body-sm text-body md:flex-row md:items-center md:justify-between lg:px-xl">
          <div className="max-w-3xl leading-[1.7]">
            <strong className="text-ink">Builddreams Technologies</strong> &middot; India &middot; UDYAM-MH-20-0340233 &middot;
            Nagpur, Maharashtra, India &middot; Email: <a href="mailto:info@builddreams.co.in" className="hover:text-ink">info@builddreams.co.in</a> &middot; Website:
            https://builddreams.co.in &middot; Phone: +91 97658 58403. Not affiliated with WhatsApp or Meta.
          </div>
          <div className="flex flex-wrap gap-md">
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/contact" className="hover:text-ink">Contact</Link>
            <a href="https://builddreams.co.in" className="hover:text-ink">BuildDreams</a>
          </div>
        </div>
      </footer>
    </div>
  );
}