import './globals.css';
import { Inter, Sora } from 'next/font/google';
import SessionProvider from '@/components/session-provider';
import Header from '@/components/header';
import FooterShell from '@/components/footer-shell';

const inter = Inter({ subsets: ['latin'] });
const sora = Sora({ subsets: ['latin'], variable: '--font-brand', weight: ['600', '700'] });

export const metadata = {
  title: 'SuriReviews - Review Platform',
  description: 'A Trustpilot-style review platform for businesses',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${sora.variable}`}>
        <SessionProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <main>{children}</main>
            <FooterShell />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
