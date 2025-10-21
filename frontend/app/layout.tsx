import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { getCurrentUser } from "@/lib/auth";
import { AuthDebugButton } from "@/components/auth-debug-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat Realtime - Real-time chat application",
  description: "Modern chat application with Next.js 15, React 19, and Symfony 7.3",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user once at root level for AuthDebugButton
  const user = await getCurrentUser()

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <AuthProvider initialUser={user}>
            {children}
            <AuthDebugButton />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
