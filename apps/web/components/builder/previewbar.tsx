"use client"

import { useState } from "react"
import { Monitor, Tablet, Smartphone } from "lucide-react"

export default function PreviewBar() {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")

  const widths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  }

  return (
    <div className="border-b bg-muted p-2 flex justify-center gap-4">
      <button onClick={() => setDevice("desktop")}>
        <Monitor className="w-4 h-4" />
      </button>

      <button onClick={() => setDevice("tablet")}>
        <Tablet className="w-4 h-4" />
      </button>

      <button onClick={() => setDevice("mobile")}>
        <Smartphone className="w-4 h-4" />
      </button>
    </div>
  )
}