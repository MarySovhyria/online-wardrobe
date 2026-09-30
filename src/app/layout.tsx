import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "The Edit — Your personal wardrobe",
  description: "A little space for everything you love to wear.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
