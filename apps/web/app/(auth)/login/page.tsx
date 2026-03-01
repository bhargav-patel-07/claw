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
      router.push("/builder")
      return
    }

    setError("Invalid email or password")
    
  }

  return (
<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

  <div className="w-full max-w-md">

    {/* Brand Header */}
    <div className="text-center mb-8">
      <h1 className="text-3xl font-semibold text-green-900">
        Welcome Back
      </h1>
      <p className="text-gray-500 mt-2 text-sm">
        Sign in to continue to your dashboard
      </p>
    </div>

    {/* Card */}
    <div className="bg-white border border-gray-200 
                    rounded-2xl shadow-lg p-8">

      <form onSubmit={handleLogin} className="flex flex-col gap-5">

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            className="p-3 rounded-lg border border-gray-300
                       focus:outline-none
                       focus:ring-2 focus:ring-green-900
                       focus:border-green-900
                       transition"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            className="p-3 rounded-lg border border-gray-300
                       focus:outline-none
                       focus:ring-2 focus:ring-green-900
                       focus:border-green-900
                       transition"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="mt-2 bg-green-900 hover:bg-green-800
                     text-white p-3 rounded-lg font-medium
                     transition duration-200"
        >
          Sign In
        </button>

      </form>

      {error && (
        <p className="text-sm text-red-600 mt-4 text-center">
          {error}
        </p>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-sm text-gray-400">OR</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* GitHub Button */}
      <button
        onClick={() => signIn("github")}
        className="w-full border border-gray-300
                   hover:border-green-900
                   text-gray-700 hover:text-green-900
                   p-3 rounded-lg font-medium
                   transition duration-200"
      >
        Continue with GitHub
      </button>

      <button
        onClick={() => router.push("/reset-password")}
        className="text-sm text-green-900 hover:underline
                   mt-6 w-full text-center"
      >
        Forgot Password?
      </button>

    </div>
  </div>
</div>
  )
}
