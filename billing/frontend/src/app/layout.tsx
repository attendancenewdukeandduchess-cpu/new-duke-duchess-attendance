import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Duke & Duchess | Zoho-Style Billing Management System',
  description: 'Enterprise Billing, POS, Invoicing & Financial Operations for New Duke & Duchess Salon',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
