"use client"

import { useState } from "react"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await fetch("/api/reset-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  }

  return (
    <div className="flex flex-col items-center mt-20">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <input
          type="email"
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2"
        />
        <button className="bg-black text-white p-2">Send Reset Link</button>
      </form>
    </div>
  )
}
