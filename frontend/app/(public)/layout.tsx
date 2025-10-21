import { PublicNavbar } from '@/components/layout/public-navbar'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Chat Realtime. Built with Next.js 15 & Symfony 7.3</p>
        </div>
      </footer>
    </div>
  )
}
