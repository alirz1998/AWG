import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWG Onboarding",
  description: "Kunden-Onboarding-Plattform für AWG",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
