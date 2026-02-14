"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (!res?.error) {
      router.push("/dashboard")
    }
  }

  return (
    <div className="flex flex-col items-center mt-20">
      <h1 className="text-2xl font-bold mb-6">Login</h1>

      {/* 🔐 Credentials Login */}
      <form
        onSubmit={handleCredentialsLogin}
        className="flex flex-col gap-4 w-80"
      >
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
        />
        <button className="bg-black text-white p-2 rounded">
          Login with Email
        </button>
      </form>

      <div className="my-6">OR</div>

      {/* 🌐 Google Login */}
      <button
        onClick={() => signIn("google")}
        className="bg-red-500 text-white p-2 rounded w-80 mb-3"
      >
        Continue with Google
      </button>

      {/* 🐙 GitHub Login */}
      <button
        onClick={() => signIn("github")}
        className="bg-gray-800 text-white p-2 rounded w-80"
      >
        Continue with GitHub
      </button>
    </div>
  )
}
