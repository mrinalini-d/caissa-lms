import { Fraunces, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-fraunces", display: "swap" });
const publicSans = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-public-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-plex-mono", display: "swap" });

export const metadata = {
  title: "Caissa LMS — Coach Training Portal",
  description: "Train and certify as a Caissa chess coach",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${publicSans.variable} ${plexMono.variable}`}>
      <body style={{ margin: 0, padding: 0, background: '#F7F5F0', fontFamily: 'var(--font-public-sans), sans-serif' }}>{children}</body>
    </html>
  );
}
