import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { GlobalNotificationProvider } from "@/lib/providers/global-notification-provider";
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
  const cookieStore = await cookies()
  const expiresAtCookie = cookieStore.get('access_token_expires_at')?.value
  let normalizedTokenExpiresAt: number | null = null

  if (expiresAtCookie) {
    const parsed = Number.parseInt(expiresAtCookie, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      normalizedTokenExpiresAt = parsed
    }
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <AuthProvider initialUser={user} initialTokenExpiresAt={normalizedTokenExpiresAt}>
            <GlobalNotificationProvider>
              {children}
              {/* <AuthDebugButton /> */}
            </GlobalNotificationProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
