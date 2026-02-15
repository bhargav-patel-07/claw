"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (!res?.error) {
      router.push("/dashboard")
      return
    }

    setError("Invalid email or password")
  }

  return (
    <div className="flex flex-col items-center mt-20 gap-4">
      <h1 className="text-2xl font-bold">Login</h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-3 w-80">
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
          Login
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

      <button
        onClick={() => router.push("/reset-password")}
        className="text-sm text-blue-600"
      >
        Forgot Password?
      </button>
    </div>
  )
}
