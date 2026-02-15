"use client"

import { useState } from "react"
import { trpc } from "@/utils/trpc"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const router = useRouter()
  const mutation = trpc.auth.resetPassword.useMutation()

  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()

    await mutation.mutateAsync({ email, newPassword })

    router.push("/login")
  }

  return (
    <div className="flex flex-col items-center mt-20 gap-4">
      <h1 className="text-2xl font-bold">Reset Password</h1>

      <form onSubmit={handleReset} className="flex flex-col gap-3 w-80">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="New Password"
          className="border p-2 rounded"
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button className="bg-black text-white p-2 rounded">
          Reset Password
        </button>
      </form>
    </div>
  )
}
