"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/utils/trpc"
import { signIn } from "next-auth/react"

export default function RegisterPage() {
  const router = useRouter()
  const mutation = trpc.auth.register.useMutation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      await mutation.mutateAsync({ email, password })
      router.push("/login")
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
        return
      }
      setError("Registration failed")
    }
  }

  return (
    <div className="flex flex-col items-center mt-20 gap-4">
      <h1 className="text-2xl font-bold">Create Account</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-80">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="bg-black text-white p-2 rounded">
          Register
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="text-sm text-gray-500">OR</div>

      <button
        onClick={() => signIn("github")}
        className="bg-gray-800 text-white p-2 rounded w-80"
      >
        Continue with GitHub
      </button>
    </div>
  )
}
