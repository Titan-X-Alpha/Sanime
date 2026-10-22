import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SANIME — Your Anime. Your World.',
  description: 'Private, ad-free personal anime streaming platform. Stream your anime library, track watch progress, and manage cloud storage.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-text-primary min-h-screen selection:bg-accent selection:text-white">
        {children}
      </body>
    </html>
  );
}
