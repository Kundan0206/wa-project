import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://wa.builddreams.co.in'),
  title: 'Wirely - Connect once. Reach everywhere.',
  description: 'A compliant SaaS platform for businesses to manage their own WhatsApp communication, workflows, notifications, and support using their own approved WhatsApp Business account.',
  openGraph: {
    title: 'Wirely - Connect once. Reach everywhere.',
    description: 'Compliant SaaS platform for WhatsApp automation using official APIs',
    url: 'https://wa.builddreams.co.in',
    type: 'website'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}