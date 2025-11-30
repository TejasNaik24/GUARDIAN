import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SupabaseProvider } from "@/app/providers/SupabaseProvider";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { SpeechProvider } from "@/components/speech/SpeechProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GUARDIAN",
  description:
    "Memory-enabled AI health assistant for medical insights and document assistance",
  icons: {
    icon: "/images/guardian-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseProvider>
          <AuthProvider>
            <ConversationProvider>
              <SpeechProvider>{children}</SpeechProvider>
            </ConversationProvider>
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
