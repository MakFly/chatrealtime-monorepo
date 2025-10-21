import { LoginForm } from "@/components/login-form"

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const error = params.error as string
  const redirect = params.redirect as string

  return (
    <div className="bg-muted flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm error={error} redirect={redirect} />
      </div>
    </div>
  )
}
