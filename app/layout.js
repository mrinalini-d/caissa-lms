import { Fraunces, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-fraunces", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-plex-mono", display: "swap" });

export const metadata = {
  title: "Caissa LMS — Coach Training Portal",
  description: "Train and certify as a Caissa chess coach",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable} ${plexMono.variable}`}>
      <body style={{ margin: 0, padding: 0, background: '#FAF4E7', fontFamily: 'var(--font-jakarta), sans-serif' }}>{children}</body>
    </html>
  );
}
