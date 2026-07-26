import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "CodeAtlas — Talk to Any GitHub Repository",
  description:
    "Analyze, understand and review any codebase, monorepo, or microservice system using AI and multilingual voice.",
  keywords: ["AI", "code review", "GitHub", "Sarvam", "voice", "microservices"],
  authors: [{ name: "CodeAtlas" }],
  openGraph: {
    title: "CodeAtlas — Talk to Any GitHub Repository",
    description: "AI + multilingual voice code intelligence for repos, monorepos, and microservices.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
