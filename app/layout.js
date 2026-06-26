import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Caissa LMS — Coach Training Portal",
  description: "Train and certify as a Caissa chess coach",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body style={{ margin: 0, padding: 0, background: '#f4f5f7' }}>{children}</body>
    </html>
  );
}
