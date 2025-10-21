import { RegisterForm } from "@/components/forms/register-form"

interface RegisterPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams
  const error = params.error as string

  return (
    <div className="bg-muted flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <RegisterForm error={error} />
      </div>
    </div>
  )
}
