import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResuRalph",
  description: "Annotation control system for resume review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
