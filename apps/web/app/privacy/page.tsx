import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

export default function PrivacyPage() {
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
          Privacy <span className="font-display italic text-gradient-mint">Policy</span>
        </h1>
        <p className="font-body text-body-sm text-muted mt-md">Last updated: 2 May 2026</p>

        <section className="mt-xl bg-surface-card border border-hairline rounded-xl p-lg md:p-xl shadow-soft leading-[1.8]">
          <p className="font-body text-body-md text-body">BuildDreams Technologies (&quot;BuildDreams&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) builds SaaS tools, product prototypes, and workflow systems. This Privacy Policy explains how we collect, use, and protect information when you visit our website, submit a form, or communicate with us.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">Information We Collect</h2>
          <p className="font-body text-body-md text-body mt-sm">We may collect your name, work email, company name, phone number, project requirements, and any message you submit through our website forms or WhatsApp links.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">How We Use Information</h2>
          <ul className="font-body text-body-md text-body mt-sm space-y-xs">
            <li>To respond to enquiries and demo requests.</li>
            <li>To understand your business requirements and prepare relevant proposals.</li>
            <li>To operate and improve our website, products, and customer communication workflows.</li>
            <li>To maintain security, prevent misuse, and comply with applicable law.</li>
          </ul>

          <h2 className="font-body text-title-md text-ink mt-xl">WhatsApp Communication</h2>
          <p className="font-body text-body-md text-body mt-sm">We provide SaaS tools to help businesses manage their own WhatsApp communication. We do not send messages on behalf of users or provide bulk messaging services. All messaging requires user consent (opt-in).</p>
          <p className="font-body text-body-md text-body mt-sm">Customers using WhatsApp features are responsible for maintaining opt-in records, honoring opt-out or stop requests, labelling marketing messages where required, and complying with WhatsApp Business Terms, WhatsApp Business Messaging Policy, and applicable law. BuildDreams is not affiliated with WhatsApp or Meta.</p>
          <p className="font-body text-body-md text-body mt-sm">Our tools must not be used to sell prohibited goods or services, send spam, collect sensitive identifiers, forward customer chats to other customers, or share regulated health, financial, legal, or other sensitive data over WhatsApp unless the customer has confirmed that the use case is permitted by applicable law and WhatsApp policy.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">WhatsApp Cloud API</h2>
          <p className="font-body text-body-md text-body mt-sm">If a customer uses a WhatsApp Cloud API integration, the customer must use its own approved WhatsApp Business account, comply with Meta and WhatsApp platform terms, use approved message templates where required, and follow Meta&apos;s 24-hour customer service window rules. BuildDreams does not sell or resell WhatsApp Business Services and does not charge for WhatsApp messaging access itself; any Meta or WhatsApp fees remain the customer&apos;s responsibility.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">No Emergency Use</h2>
          <p className="font-body text-body-md text-body mt-sm">Our website and SaaS tools are not emergency communication services and should not be used to contact police, fire, hospitals, or other emergency service providers.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">Sharing of Information</h2>
          <p className="font-body text-body-md text-body mt-sm">We do not sell personal information. We may share information only with service providers that help us operate our website, CRM, hosting, analytics, or communication tools, or where required by law.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">Data Security</h2>
          <p className="font-body text-body-md text-body mt-sm">We use reasonable technical and organizational safeguards to protect information. No internet-based service is completely secure, but we work to reduce risk and limit access to business information.</p>

          <h2 className="font-body text-title-md text-ink mt-xl">Your Choices</h2>
          <p className="font-body text-body-md text-body mt-sm">You can ask us to update, correct, or delete your contact information by contacting us through the details below.</p>

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