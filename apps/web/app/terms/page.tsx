import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline bg-surface-card/90">
        <div className="mx-auto flex max-w-content items-center justify-between px-lg py-md lg:px-xl">
          <Link href="/" className="flex items-center">
            <Image src="/images/builddreams.png" alt="BuildDreams logo" width={40} height={40} className="h-10 w-auto" />
          </Link>
          <Link href="/contact" className="bg-primary text-on-primary font-body text-button h-10 px-xl rounded-pill inline-flex items-center gap-xs hover:bg-primary-active transition">
            Contact <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-lg py-section">
        <p className="font-body text-caption-uppercase text-gradient-mint">LEGAL</p>
        <h1 className="font-display text-display-lg text-ink mt-md leading-[1.05]">
          Terms & <span className="font-display italic text-gradient-mint">Conditions</span>
        </h1>
        <p className="font-body text-body-sm text-muted mt-md">Last updated: 2 May 2026</p>

        <section className="mt-xl bg-surface-card border border-hairline rounded-xl p-lg md:p-xl shadow-soft leading-[1.8]">
          <p className="font-body text-body-md text-body">These Terms & Conditions govern your access to the BuildDreams website and any enquiry, demo, or business communication initiated through it.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">Use of Our Website</h2>
          <p className="font-body text-body-md text-body mt-sm">You agree to use this website only for lawful business purposes and not to interfere with its security, availability, or operation.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">Products and Services</h2>
          <p className="font-body text-body-md text-body mt-sm">BuildDreams provides SaaS tools, custom software development, product prototypes, workflow systems, and related consulting services. Any paid engagement is governed by the commercial proposal, order form, statement of work, or agreement accepted by both parties.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">WhatsApp Communication Tools</h2>
          <p className="font-body text-body-md text-body mt-sm">We provide SaaS tools to help businesses manage their own WhatsApp communication. We do not send messages on behalf of users or provide bulk messaging services. All messaging requires user consent (opt-in). Customers are responsible for using WhatsApp, Meta, and any communication APIs in accordance with applicable platform policies and law.</p>
          <p className="font-body text-body-md text-body mt-sm">Customers must maintain accurate business account information, protect account credentials, use only authorized users, keep opt-in records, and honor all stop, unsubscribe, block, or opt-out requests from WhatsApp users.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">WhatsApp Cloud API</h2>
          <p className="font-body text-body-md text-body mt-sm">If you use a WhatsApp Cloud API integration with BuildDreams software, you must use your own approved WhatsApp Business account, accept and comply with all applicable Meta and WhatsApp terms, use approved message templates where required, follow Meta&apos;s 24-hour customer service window rules, maintain accurate customer support contact information, and keep your account credentials secure.</p>
          <p className="font-body text-body-md text-body mt-sm">BuildDreams does not sell or resell WhatsApp Business Services, does not create WhatsApp business accounts for third parties as a WhatsApp provider, and does not charge for WhatsApp messaging access itself. Any Meta, WhatsApp, carrier, internet, or conversation fees remain your responsibility.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">No Spam or Unauthorised Messaging</h2>
          <p className="font-body text-body-md text-body mt-sm">You must not use BuildDreams products or workflows for spam, unsolicited bulk communication, deceptive messages, or communication without valid user consent.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">Prohibited and Sensitive Use Cases</h2>
          <p className="font-body text-body-md text-body mt-sm">You must not use BuildDreams products or workflows to sell prohibited goods or services, facilitate illegal activity, collect sensitive identifiers, forward customer chats to other customers, or share regulated health, financial, legal, or other sensitive data over WhatsApp unless you have confirmed that the use case is permitted by applicable law and WhatsApp policy.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">No Emergency Use</h2>
          <p className="font-body text-body-md text-body mt-sm">BuildDreams websites, SaaS tools, and WhatsApp communication workflows are not emergency communication services and must not be relied on for police, fire, hospital, or public safety communication.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">Intellectual Property</h2>
          <p className="font-body text-body-md text-body mt-sm">Website content, designs, logos, product names, and code samples are owned by BuildDreams or its licensors unless otherwise stated. You may not copy or reuse them without permission.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">Limitation of Liability</h2>
          <p className="font-body text-body-md text-body mt-sm">The website is provided for informational purposes. To the maximum extent permitted by law, BuildDreams is not liable for indirect, incidental, or consequential losses arising from website use.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">Contact</h2>
          <p className="font-body text-body-md text-body mt-sm">
            Email: <a className="text-gradient-mint hover:text-ink" href="mailto:suhomatech@gmail.com">suhomatech@gmail.com</a><br />
            WhatsApp: <a className="text-gradient-mint hover:text-ink" href="https://wa.me/919356873562">+91 93568 73562</a>
          </p>
          <p className="font-body text-body-md text-body mt-sm">
            Official WhatsApp references:{' '}
            <a className="text-gradient-mint hover:text-ink" href="https://www.whatsapp.com/legal/business-terms/" target="_blank" rel="noopener noreferrer">Business Terms</a> and{' '}
            <a className="text-gradient-mint hover:text-ink" href="https://www.whatsapp.com/legal/business-policy/" target="_blank" rel="noopener noreferrer">Business Policy</a>.
          </p>
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