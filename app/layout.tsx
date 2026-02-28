import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Roam - Personal Finance for Digital Nomads",
  description: "Track spending across currencies, monitor FX fees, and manage invoices — built for UK freelancers and digital nomads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
