import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <main className="mx-auto mt-20 max-w-2xl px-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-4 text-gray-700">
        Logged in as {session.user.email ?? "user"}
      </p>
    </main>
  )
}
