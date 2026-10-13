import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sanity Playground | Build and Preview Sanity Schemas",
  description: "Experiment with Sanity schemas, preview Studio-style forms and build React previews directly in your browser.",
  metadataBase: new URL("https://www.sanity-playground.com"),
  alternates: { canonical: "/" },
  openGraph: { title: "Sanity Playground", description: "Build and preview Sanity schemas in your browser.", url: "/", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
